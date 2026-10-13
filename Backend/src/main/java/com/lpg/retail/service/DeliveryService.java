package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import static com.lpg.retail.exception.ApiException.require;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
public class DeliveryService {
    private final jakarta.persistence.EntityManager entityManager;
    private final DeliveryRepository deliveries;
    private final DeliveryEventRepository events;
    private final UserRepository users;
    private final PaymentRepository payments;
    private final OrderService orders;
    private final InventoryService inventory;
    private final SaleService sales;
    private final CurrentUser current;
    private final AuditService audit;
    private final DeliveryAssignmentService assignments;
    private final DriverService drivers;

    private void access(Delivery d) {
        if (current.get().getRole() == User.Role.DELIVERY_STAFF) {
            if (d.getAssignedStaff() == null || !d.getAssignedStaff().getUserId().equals(current.get().getUserId()))
                throw ApiException.missing();
        } else
            current.staff();
    }

    private Delivery get(Long id) {
        var d = deliveries.findById(id).orElseThrow(ApiException::missing);
        access(d);
        return d;
    }

    private Delivery locked(Long id) {
        var d = get(id);
        orders.lock(d.getOrder().getOrderId());
        assignments.acquire();
        d = deliveries.lockById(id).orElseThrow(ApiException::missing);
        entityManager.refresh(d, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        access(d);
        return d;
    }

    private void worker(Delivery d) {
        current.roles(User.Role.DELIVERY_STAFF);
        access(d);
    }

    public List<Views.Delivery> list() {
        var u = current.get();
        List<Delivery> result;
        if (u.getRole() == User.Role.DELIVERY_STAFF)
            result = deliveries.findByAssignedStaffUserId(u.getUserId());
        else {
            current.staff();
            result = deliveries.findAll();
        }
        return result.stream().map(ViewMapper::delivery).toList();
    }

    public List<Views.Driver> eligibleDrivers(Long id) {
        current.roles(User.Role.OWNER);
        return assignments.eligible(get(id).getOrder()).stream().map(drivers::view).toList();
    }

    public Views.Delivery assign(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.AssignDriver r, String key) {
        current.roles(User.Role.OWNER);
        assignments.acquire();
        audit.claim(key, "ASSIGN");
        var d = locked(id);
        require(d.getOrder().getStatus() == Order.OrderStatus.CONFIRMED
                || d.getOrder().getStatus() == Order.OrderStatus.DISPATCHED, "Order cannot be assigned now");
        assignments.assign(d, users.findById(r.staffId()).orElseThrow(ApiException::missing), r.reason().trim());
        return ViewMapper.delivery(d);
    }

    public Views.Delivery dispatch(Long id, String key) {
        current.roles(User.Role.DELIVERY_STAFF);
        assignments.acquire();
        audit.claim(key, "DISPATCH");
        var d = locked(id);
        worker(d);
        require(d.getStatus() == Delivery.DeliveryStatus.ASSIGNED, "Only assigned deliveries can dispatch");
        require(d.getOrder().getStatus() == Order.OrderStatus.CONFIRMED, "Order must be confirmed");
        require(assignments.eligible(d.getAssignedStaff(), d.getOrder()),
                "Assigned driver is no longer eligible; owner must reassign");
        var p = payments.findByOrderOrderId(d.getOrder().getOrderId());
        require(p.getMethod() != Payment.PaymentMethod.BANK_TRANSFER || p.getStatus() == Payment.PaymentStatus.VERIFIED,
                "Verify transfer before dispatch");
        require(p.getMethod() != Payment.PaymentMethod.CASH || (p.getStatus() == Payment.PaymentStatus.PAID
                && p.getCollectedAmount().compareTo(p.getAmount()) == 0),
                "Shop cash payment must be settled before dispatch");
        require(p.getMethod() != Payment.PaymentMethod.COD
                || (p.getStatus() == Payment.PaymentStatus.PENDING && p.getCollectedAmount().signum() == 0),
                "COD must remain outstanding until handover");
        d.setStatus(Delivery.DeliveryStatus.DISPATCHED);
        d.getOrder().setStatus(Order.OrderStatus.DISPATCHED);
        event(d, DeliveryEvent.EventType.DISPATCHED, "Dispatched");
        return ViewMapper.delivery(d);
    }

    public Views.Delivery complete(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Complete r, String key) {
        current.roles(User.Role.DELIVERY_STAFF);
        assignments.acquire();
        audit.claim(key, "DELIVER");
        var d = locked(id);
        worker(d);
        require(d.getStatus() == Delivery.DeliveryStatus.DISPATCHED, "Only dispatched deliveries can complete");
        sales.settle(d.getOrder(), r);
        d.setCodCollected(r.cashReceived());
        d.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
        d.setStatus(Delivery.DeliveryStatus.DELIVERED);
        event(d, DeliveryEvent.EventType.DELIVERED, "Actual item quantities recorded; cash=" + r.cashReceived());
        return ViewMapper.delivery(d);
    }

    public Views.Delivery fail(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Failure r, String key) {
        current.roles(User.Role.DELIVERY_STAFF);
        assignments.acquire();
        audit.claim(key, "FAIL");
        var d = locked(id);
        worker(d);
        require(d.getStatus() == Delivery.DeliveryStatus.DISPATCHED, "Only dispatched deliveries can fail");
        inventory.release(d.getOrder().getItems());
        var p = payments.findByOrderOrderId(d.getOrder().getOrderId());
        if (p.getCollectedAmount().signum() > 0) {
            p.setReconciliationStatus(Payment.ReconciliationStatus.REQUIRED);
            p.setReconciliationReason(r.reason());
            audit.record("PAYMENT_RECONCILIATION_REQUIRED", p.getPaymentId(),
                    "Delivery failed; original payment retained; reason=" + r.reason());
        }
        d.setStatus(Delivery.DeliveryStatus.FAILED);
        d.getOrder().setStatus(Order.OrderStatus.FAILED);
        d.getOrder().setDecisionReason(r.reason());
        d.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
        event(d, DeliveryEvent.EventType.FAILED, r.reason() + "; no handover or cash collected");
        return ViewMapper.delivery(d);
    }

    public List<Views.Event> timeline(Long id) {
        get(id);
        return events.findByDeliveryDeliveryId(id).stream().sorted(Comparator.comparing(DeliveryEvent::getEventId))
                .map(ViewMapper::event).toList();
    }

    public Views.Payment payment(Long id) {
        var d = get(id);
        return ViewMapper.payment(payments.findByOrderOrderId(d.getOrder().getOrderId()));
    }

    private void event(Delivery d, DeliveryEvent.EventType type, String note) {
        var e = new DeliveryEvent();
        e.setDelivery(d);
        e.setActorUser(current.get());
        e.setEventAt(LocalDateTime.now(ZoneOffset.UTC));
        e.setEventType(type);
        e.setNote(note.length() > 500 ? note.substring(0, 500) : note);
        events.save(e);
        audit.record("DELIVERY_" + type, d.getDeliveryId(), note);
    }
}
