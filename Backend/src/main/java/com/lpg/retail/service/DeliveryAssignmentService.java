package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import static com.lpg.retail.exception.ApiException.require;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class DeliveryAssignmentService {

    private final EntityManager entityManager;
    private final DeliveryAssignmentStateRepository state;
    private final DriverProfileRepository profiles;
    private final DriverZoneRepository coverage;
    private final DeliveryRepository deliveries;
    private final DeliveryZoneRepository zones;
    private final DeliveryEventRepository events;
    private final AuditService audit;
    private final CurrentUser current;
    private static final List<Delivery.DeliveryStatus> ACTIVE = List.of(Delivery.DeliveryStatus.ASSIGNED, Delivery.DeliveryStatus.DISPATCHED);

    public DeliveryAssignmentState acquire() {
        var lock = state.lockState().orElseThrow(() -> new ApiException(409, "Delivery assignment migration is required"));
        entityManager.refresh(lock, LockModeType.PESSIMISTIC_WRITE);
        return lock;
    }

    public DeliveryZone zone(Order order) {
        if (order.getDeliveryZone() != null) {
            return order.getDeliveryZone();
        }
        // Legacy records retain their original address; never infer guest ownership.
        if (order.getAddress() != null) {
            return zones.findByZoneNameIgnoreCaseAndActiveTrue(order.getAddress().getDeliveryZone()).orElse(null);
        }
        return null;
    }

    public long workload(Long driverId) {
        entityManager.flush();
        return deliveries.countByAssignedStaffUserIdAndStatusIn(driverId, ACTIVE);
    }

    public boolean eligible(User driver, Order order) {
        entityManager.refresh(driver);
        var z = zone(order);
        var profile = profiles.findById(driver.getUserId()).orElse(null);
        return driver.getRole() == User.Role.DELIVERY_STAFF && Boolean.TRUE.equals(driver.getActive())
                && profile != null && profile.isAvailable() && z != null && z.isActive()
                && coverage.existsByDriverUserIdAndZoneZoneId(driver.getUserId(), z.getZoneId());
    }

    public List<User> eligible(Order order) {
        var z = zone(order);
        if (z == null || !z.isActive()) {
            return List.of();
        }
        return coverage.findByZoneZoneId(z.getZoneId()).stream().map(DriverZone::getDriver)
                .filter(u -> eligible(u, order)).sorted(Comparator.comparing(User::getUserId)).toList();
    }

    public Delivery create(Order order) {
        require(order.getFulfilment() == Order.Fulfilment.DELIVERY && order.getStatus() == Order.OrderStatus.CONFIRMED, "Delivery requires a confirmed delivery order");
        var lock = acquire();
        require(deliveries.findByOrderOrderId(order.getOrderId()).isEmpty(), "Delivery already exists");
        var delivery = new Delivery();
        delivery.setOrder(order);
        deliveries.saveAndFlush(delivery);
        var drivers = eligible(order);
        if (!drivers.isEmpty()) {
            long minimum = drivers.stream().mapToLong(u -> workload(u.getUserId())).min().orElseThrow();
            var tied = drivers.stream().filter(u -> workload(u.getUserId()) == minimum).toList();
            Long previous = lock.getLastDriverId();
            var selected = tied.stream().filter(u -> previous == null || u.getUserId() > previous).findFirst().orElse(tied.get(0));
            delivery.setAssignedStaff(selected);
            delivery.setAssignedAt(LocalDateTime.now(ZoneOffset.UTC));
            delivery.setStatus(Delivery.DeliveryStatus.ASSIGNED);
            lock.setLastDriverId(selected.getUserId());
            event(delivery, DeliveryEvent.EventType.ASSIGNED, "Automatic assignment; previous=none; new=" + selected.getUserId());
        } else {
            event(delivery, DeliveryEvent.EventType.NOTE, "No active available driver serves this zone; delivery remains UNASSIGNED");
        }
        return delivery;
    }

    public void assign(Delivery delivery, User replacement, String reason) {
        require(!Set.of(Delivery.DeliveryStatus.DELIVERED, Delivery.DeliveryStatus.FAILED).contains(delivery.getStatus()), "Finished deliveries cannot be reassigned");
        require(eligible(replacement, delivery.getOrder()), "Choose an active available driver who serves this delivery zone");
        var previous = delivery.getAssignedStaff();
        require(previous == null || !previous.getUserId().equals(replacement.getUserId()), "This driver is already assigned");
        delivery.setAssignedStaff(replacement);
        delivery.setAssignedAt(LocalDateTime.now(ZoneOffset.UTC));
        if (delivery.getStatus() != Delivery.DeliveryStatus.DISPATCHED) {
            delivery.setStatus(Delivery.DeliveryStatus.ASSIGNED);
        }
        // NOTE retains compatibility with the existing delivery event enum.
        event(delivery, previous == null ? DeliveryEvent.EventType.ASSIGNED : DeliveryEvent.EventType.NOTE,
                "Owner " + (previous == null ? "assignment" : "reassignment") + "; previous=" + (previous == null ? "none" : previous.getUserId()) + "; new=" + replacement.getUserId() + "; reason=" + reason.trim());
    }

    public void event(Delivery delivery, DeliveryEvent.EventType type, String note) {
        var e = new DeliveryEvent();
        e.setDelivery(delivery);
        e.setActorUser(current.get());
        e.setEventAt(LocalDateTime.now(ZoneOffset.UTC));
        e.setEventType(type);
        e.setNote(note.length() > 500 ? note.substring(0, 500) : note);
        events.save(e);
        audit.record(type == DeliveryEvent.EventType.NOTE && note.startsWith("Owner reassignment") ? "DELIVERY_REASSIGNED" : "DELIVERY_" + type,
                delivery.getDeliveryId(), note);
    }
}
