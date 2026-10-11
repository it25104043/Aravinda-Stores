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
import org.springframework.data.domain.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
public class OrderService {
    private final jakarta.persistence.EntityManager entityManager;
    private final OrderRepository orders;
    private final CustomerService customers;
    private final DeliveryZoneRepository zones;
    private final PaymentRepository payments;
    private final DeliveryRepository deliveries;
    private final DeliveryAssignmentService assignments;
    private final AuditEventRepository history;
    private final DeliveryEventRepository deliveryEvents;
    private final InventoryService inventory;
    private final AuditService audit;
    private final CurrentUser current;

    public Views.Order place(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.PlaceOrder r,
            String key) {
        current.roles(User.Role.CUSTOMER);
        audit.claim(key, "ORDER");
        return ViewMapper.order(create(r, false));
    }

    public Order create(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.PlaceOrder r,
            boolean walkIn) {
        return create(r, walkIn, null);
    }

    public Order createWalkIn(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.WalkIn r) {
        current.staff();
        require(r.paymentMethod() == Payment.PaymentMethod.CASH, "Walk-in sales accept shop cash only");
        require((r.fulfilment() == Order.Fulfilment.DELIVERY) == (r.customer() != null),
                "Provide guest delivery details only for delivery");
        return create(new Requests.PlaceOrder(r.fulfilment(), r.paymentMethod(), null, null, r.items()), true,
                r.customer());
    }

    public Views.WalkInQuote quoteWalkIn(
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.WalkIn r) {
        current.staff();
        require(r.paymentMethod() == Payment.PaymentMethod.CASH, "Walk-in sales accept shop cash only");
        require((r.fulfilment() == Order.Fulfilment.DELIVERY) == (r.customer() != null),
                "Provide guest delivery details only for delivery");
        BigDecimal fee = BigDecimal.ZERO, subtotal = BigDecimal.ZERO;
        if (r.customer() != null)
            fee = zones.findById(r.customer().zoneId()).filter(DeliveryZone::isActive)
                    .orElseThrow(() -> new ApiException(400, "Choose an active delivery zone")).getDeliveryFee();
        Map<Long, Integer> quantities = new TreeMap<>();
        Map<Long, Inventory> quoteStock = new TreeMap<>();
        r.items().stream().map(Requests.Line::productId).distinct().sorted()
                .forEach(id -> quoteStock.put(id, inventory.locked(id)));
        for (var line : r.items()) {
            var stock = quoteStock.get(line.productId());
            var p = stock.getProduct();
            require(Boolean.TRUE.equals(p.getActive()), "Product is unavailable");
            var price = line.purchaseType() == OrderItem.PurchaseType.NEW ? p.getNewPrice() : p.getExchangePrice();
            require(price.signum() > 0, "Product price configuration is invalid");
            subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(line.quantity())));
            int qty = quantities.merge(line.productId(), line.quantity(), Integer::sum);
            require(stock.getFullQty() - stock.getReservedQty() >= qty, "Insufficient available stock");
        }
        require(fee.signum() >= 0 && fee.compareTo(new BigDecimal("99999999.99")) <= 0
                && subtotal.add(fee).compareTo(new BigDecimal("9999999999.99")) <= 0, "Total configuration is invalid");
        return new Views.WalkInQuote(subtotal, fee, subtotal.add(fee));
    }

    private Order create(Requests.PlaceOrder r, boolean walkIn, Requests.GuestDelivery guest) {
        User actor = current.get();
        if (walkIn)
            current.staff();
        else {
            current.roles(User.Role.CUSTOMER);
            require(r.fulfilment() == Order.Fulfilment.DELIVERY, "Online customer orders require delivery");
        }
        var o = new Order();
        o.setChannel(walkIn ? Order.Channel.WALK_IN : Order.Channel.ONLINE);
        o.setFulfilment(r.fulfilment());
        o.setStatus(Order.OrderStatus.PENDING);
        o.setPlacedByUser(actor);
        o.setContactName(walkIn ? "Walk-in customer" : actor.getFullName());
        o.setContactPhone(walkIn ? null : actor.getPhone());
        o.setPlacedAt(LocalDateTime.now(ZoneOffset.UTC));
        o.setDeliveryFee(BigDecimal.ZERO);
        if (!walkIn)
            o.setCustomer(customers.own());
        if (r.fulfilment() == Order.Fulfilment.DELIVERY) {
            if (walkIn) {
                require(guest != null, "Guest delivery details are required");
                var z = zones.findById(guest.zoneId()).filter(DeliveryZone::isActive)
                        .orElseThrow(() -> new ApiException(400, "Choose an active delivery zone"));
                require(z.getDeliveryFee().signum() >= 0
                        && z.getDeliveryFee().compareTo(new BigDecimal("99999999.99")) <= 0,
                        "Delivery fee configuration is invalid");
                o.setContactName(guest.fullName().trim());
                o.setContactPhone(guest.phone());
                o.setAddressSnapshot(guest.addressLine().trim());
                o.setDeliveryZone(z);
                o.setDeliveryZoneSnapshot(z.getZoneName());
                o.setDeliveryInstructions(guest.instructions() == null ? null : guest.instructions().trim());
                o.setDeliveryFee(z.getDeliveryFee());
            } else {
                require(r.paymentMethod() == Payment.PaymentMethod.COD
                        || r.paymentMethod() == Payment.PaymentMethod.BANK_TRANSFER,
                        "Delivery requires COD or bank transfer");
                require((r.addressId() != null) != (r.address() != null),
                        "Supply either a saved address or a new address");
                String line, city, zone;
                if (r.addressId() != null) {
                    var a = customers.address(r.addressId());
                    line = a.getAddressLine();
                    city = a.getCity();
                    zone = a.getDeliveryZone();
                    o.setAddress(a);
                } else {
                    var a = r.address();
                    line = a.addressLine();
                    city = a.city();
                    zone = a.deliveryZone();
                }
                var z = zones.findByZoneNameIgnoreCaseAndActiveTrue(zone.trim())
                        .orElseThrow(() -> new ApiException(400, "Address zone is outside the delivery area"));
                // Preserve an independent address row for existing database delivery-address
                // constraints.
                if (o.getAddress() == null) {
                    var saved = customers.add(r.address());
                    o.setAddress(customers.address(saved.addressId()));
                }
                require(z.getDeliveryFee().signum() >= 0
                        && z.getDeliveryFee().compareTo(new BigDecimal("99999999.99")) <= 0,
                        "Delivery fee configuration is invalid");
                o.setAddressSnapshot(line.trim() + ", " + city.trim() + ", " + z.getZoneName());
                o.setDeliveryFee(z.getDeliveryFee());
                o.setDeliveryZone(z);
                o.setDeliveryZoneSnapshot(z.getZoneName());
            }
        } else {
            require(r.paymentMethod() == Payment.PaymentMethod.CASH, "Pickup uses cash at collection");
            require(r.address() == null && r.addressId() == null, "Pickup must not include a delivery address");
        }
        BigDecimal subtotal = BigDecimal.ZERO;
        // Inventory locks also serialize price changes, providing one authoritative
        // price snapshot.
        Map<Long, Inventory> balances = new TreeMap<>();
        r.items().stream().map(Requests.Line::productId).distinct().sorted()
                .forEach(id -> balances.put(id, inventory.locked(id)));
        for (var line : r.items()) {
            var p = balances.get(line.productId()).getProduct();
            require(Boolean.TRUE.equals(p.getActive()), "Product is unavailable");
            var item = new OrderItem();
            item.setOrder(o);
            item.setProduct(p);
            item.setQuantity(line.quantity());
            item.setPurchaseType(line.purchaseType());
            item.setUnitPrice(
                    line.purchaseType() == OrderItem.PurchaseType.NEW ? p.getNewPrice() : p.getExchangePrice());
            require(item.getUnitPrice().signum() > 0, "Product price configuration is invalid");
            o.getItems().add(item);
            subtotal = subtotal.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        require(subtotal.add(o.getDeliveryFee()).compareTo(new BigDecimal("9999999999.99")) <= 0,
                "Order total exceeds the supported amount");
        inventory.reserve(o.getItems());
        o.setTotalAmount(subtotal.add(o.getDeliveryFee()));
        o = orders.saveAndFlush(o);
        var payment = new Payment();
        payment.setOrder(o);
        payment.setAmount(o.getTotalAmount());
        payment.setMethod(r.paymentMethod());
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payments.save(payment);
        audit.record("ORDER_PLACED", o.getOrderId(), "Stock reserved; total=" + o.getTotalAmount());
        return o;
    }

    public List<Views.Order> list(int page) {
        if (page < 0)
            throw new ApiException(400, "Invalid page");
        var u = current.get();
        if (u.getRole() == User.Role.CUSTOMER)
            return orders.findByCustomerCustomerId(customers.own().getCustomerId()).stream()
                    .sorted(Comparator.comparing(Order::getOrderId).reversed()).skip((long) page * 100).limit(100)
                    .map(ViewMapper::order).toList();
        current.staff();
        return orders.findAll(PageRequest.of(page, 100, Sort.by("orderId").descending())).stream()
                .map(ViewMapper::order).toList();
    }

    public Views.Order get(Long id) {
        var o = orders.findById(id).orElseThrow(ApiException::missing);
        authorize(o);
        return ViewMapper.order(o);
    }

    public Views.OrderDetails details(Long id) {
        var o = orders.findById(id).orElseThrow(ApiException::missing);
        authorize(o);
        var payment = payments.findByOrderOrderId(id);
        if (payment == null)
            throw ApiException.missing();
        return new Views.OrderDetails(ViewMapper.order(o), ViewMapper.payment(payment),
                deliveries.findByOrderOrderId(id).map(this::visibleDelivery).orElse(null),
                history.findByActionStartingWithAndResourceIdOrderByAuditIdAsc("ORDER_", id).stream()
                        .map(this::visibleAudit).toList(),
                history.findByActionStartingWithAndResourceIdOrderByAuditIdAsc("PAYMENT_", payment.getPaymentId())
                        .stream().map(this::visibleAudit).toList(),
                deliveries.findByOrderOrderId(id)
                        .map(d -> deliveryEvents.findByDeliveryDeliveryId(d.getDeliveryId()).stream()
                                .sorted(Comparator.comparing(DeliveryEvent::getEventId)).map(ViewMapper::event)
                                .toList())
                        .orElse(List.of()));
    }

    private Views.Audit visibleAudit(AuditEvent event) {
        var view = ViewMapper.audit(event);
        if (current.get().getRole() != User.Role.CUSTOMER)
            return view;
        String detail = view.detail();
        if (detail != null)
            detail = detail.replaceAll("; slip=.*$", "");
        return new Views.Audit(view.auditId(), view.actorUserId(), view.occurredAt(), view.action(), view.resourceId(),
                detail, view.actorName(), view.actorRole());
    }

    private Views.Delivery visibleDelivery(Delivery d) {
        var view = ViewMapper.delivery(d);
        if (current.get().getRole() != User.Role.CUSTOMER || view.assignedStaff() == null)
            return view;
        var driver = view.assignedStaff();
        return new Views.Delivery(view.deliveryId(), view.order(),
                new Views.User(driver.userId(), driver.fullName(), null, null, driver.role(), driver.active()),
                view.status(), view.codCollected());
    }

    public List<Views.CustomerOrder> mine(int page) {
        current.roles(User.Role.CUSTOMER);
        return list(page).stream()
                .map(o -> new Views.CustomerOrder(o, ViewMapper.payment(payments.findByOrderOrderId(o.orderId())),
                        deliveries.findByOrderOrderId(o.orderId()).map(this::visibleDelivery).orElse(null)))
                .toList();
    }

    public void authorize(Order o) {
        var u = current.get();
        if (u.getRole() == User.Role.CUSTOMER) {
            if (o.getCustomer() == null || !o.getCustomer().getUser().getUserId().equals(u.getUserId()))
                throw ApiException.missing();
        } else
            current.staff();
    }

    public Order lock(Long id) {
        var o = orders.lockById(id).orElseThrow(ApiException::missing);
        entityManager.refresh(o, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return o;
    }

    public Views.Order cancel(Long id, String key) {
        current.roles(User.Role.CUSTOMER);
        audit.claim(key, "CANCEL");
        var o = lock(id);
        authorize(o);
        require(o.getStatus() == Order.OrderStatus.PENDING, "Cancellation window has closed");
        inventory.release(o.getItems());
        o.setStatus(Order.OrderStatus.CANCELLED);
        audit.record("ORDER_CANCELLED", id, "Customer cancelled while pending");
        return ViewMapper.order(o);
    }

    public Views.Order decision(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Decision r, String key) {
        current.staff();
        if (r.status() == Order.OrderStatus.CONFIRMED)
            assignments.acquire();
        audit.claim(key, "DECISION");
        var o = lock(id);
        require(o.getStatus() == Order.OrderStatus.PENDING, "Only pending orders can be decided");
        require(r.status() == Order.OrderStatus.CONFIRMED || r.status() == Order.OrderStatus.REJECTED,
                "Choose confirmed or rejected");
        if (r.status() == Order.OrderStatus.CONFIRMED) {
            var payment = payments.findByOrderOrderId(id);
            require(payment != null, "Order payment is missing");
            require(payment.getMethod() != Payment.PaymentMethod.BANK_TRANSFER
                    || payment.getStatus() == Payment.PaymentStatus.VERIFIED,
                    "Bank transfer must be verified before order confirmation");
        }
        if (r.status() == Order.OrderStatus.REJECTED) {
            require(r.reason() != null && !r.reason().isBlank(), "Rejection reason required");
            inventory.release(o.getItems());
            o.setDecisionReason(r.reason().trim());
        }
        o.setStatus(r.status());
        if (r.status() == Order.OrderStatus.CONFIRMED && o.getFulfilment() == Order.Fulfilment.DELIVERY) {
            assignments.create(o);
        }
        audit.record("ORDER_" + r.status(), id, r.reason() == null ? "Staff confirmed" : r.reason());
        return ViewMapper.order(o);
    }
}
