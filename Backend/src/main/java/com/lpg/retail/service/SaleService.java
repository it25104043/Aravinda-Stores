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
import java.math.BigDecimal;
import java.util.*;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
public class SaleService {
    private final jakarta.persistence.EntityManager entityManager;
    private final SaleRepository sales;
    private final PaymentRepository payments;
    private final OrderService orders;
    private final InventoryService inventory;
    private final CurrentUser current;
    private final AuditService audit;
    private final DeliveryAssignmentService assignments;
    private final DeliveryRepository deliveries;

    public Views.Sale walkIn(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.PlaceOrder r,
            String key) {
        require(r.address() == null && r.addressId() == null, "Use guest delivery details for walk-in delivery");
        return walkIn(new Requests.WalkIn(r.fulfilment(), r.paymentMethod(), null, r.items()), key);
    }

    public Views.Sale walkIn(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.WalkIn r,
            String key) {
        current.staff();
        if (r.fulfilment() == Order.Fulfilment.DELIVERY)
            assignments.acquire();
        audit.claim(key, "WALK_IN");
        var o = orders.createWalkIn(r);
        if (o.getFulfilment() == Order.Fulfilment.DELIVERY) {
            var p = payments.findByOrderOrderId(o.getOrderId());
            p.setStatus(Payment.PaymentStatus.PAID);
            p.setCollectedAmount(o.getTotalAmount());
            p.setPaidAt(LocalDateTime.now(ZoneOffset.UTC));
            audit.record("PAYMENT_SHOP_CASH", p.getPaymentId(), "Cash received at shop=" + o.getTotalAmount());
            o.setStatus(Order.OrderStatus.CONFIRMED);
            var sale = receiptFor(o);
            audit.record("ORDER_CONFIRMED", o.getOrderId(), "Prepaid guest delivery; stock reserved until handover");
            return ViewMapper.sale(sale, assignments.create(o));
        }
        var actual = o.getItems().stream().map(i -> new Requests.Actual(i.getOrderItemId(), i.getQuantity(),
                i.getPurchaseType() == OrderItem.PurchaseType.EXCHANGE ? i.getQuantity() : 0)).toList();
        return ViewMapper.sale(settle(o, new Requests.Complete(actual, o.getTotalAmount())));
    }

    public Views.Sale pickup(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Complete r, String key) {
        current.staff();
        audit.claim(key, "PICKUP");
        var o = orders.lock(id);
        require(o.getFulfilment() == Order.Fulfilment.PICKUP && o.getStatus() == Order.OrderStatus.CONFIRMED,
                "Pickup must be confirmed");
        return ViewMapper.sale(settle(o, r));
    }

    public Sale settle(Order o, @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Complete r) {
        var prior = sales.findByOrderOrderId(o.getOrderId());
        boolean prepaid = o.getChannel() == Order.Channel.WALK_IN && o.getFulfilment() == Order.Fulfilment.DELIVERY;
        require(prior.isEmpty() || prepaid, "Sale already completed");
        require(o.getStatus() == Order.OrderStatus.DISPATCHED ||
                (o.getFulfilment() == Order.Fulfilment.PICKUP && (o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        (o.getChannel() == Order.Channel.WALK_IN && o.getStatus() == Order.OrderStatus.PENDING))),
                "Order cannot be handed over now");
        Map<Long, Requests.Actual> actuals = new HashMap<>();
        for (var a : r.items())
            require(actuals.put(a.orderItemId(), a) == null, "Duplicate item actuals");
        require(actuals.size() == o.getItems().size(), "Record actual quantities for every item");
        for (var i : o.getItems()) {
            var a = actuals.get(i.getOrderItemId());
            require(a != null, "Unknown or missing item");
            require(a.deliveredQty().equals(i.getQuantity()),
                    "Completion requires the full agreed quantity; use failed delivery for an incomplete handover");
            int empties = i.getPurchaseType() == OrderItem.PurchaseType.EXCHANGE ? i.getQuantity() : 0;
            require(a.emptyCollected() == empties,
                    "Exchange requires one empty per delivered cylinder; new purchase requires zero");
            i.setDeliveredQty(a.deliveredQty());
            i.setEmptyCollected(a.emptyCollected());
        }
        var existing = payments.findByOrderOrderId(o.getOrderId());
        if (existing == null)
            throw ApiException.missing();
        var p = payments.lockById(existing.getPaymentId()).orElseThrow(ApiException::missing);
        entityManager.refresh(p, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (prepaid) {
            require(prior.isPresent() && p.getMethod() == Payment.PaymentMethod.CASH
                    && p.getStatus() == Payment.PaymentStatus.PAID
                    && p.getCollectedAmount().compareTo(o.getTotalAmount()) == 0,
                    "Shop payment and receipt must exist before delivery");
            require(r.cashReceived().signum() == 0, "Prepaid delivery has no cash due at handover");
        } else if (p.getMethod() == Payment.PaymentMethod.BANK_TRANSFER) {
            require(p.getStatus() == Payment.PaymentStatus.VERIFIED, "Transfer must be verified before handover");
            require(r.cashReceived().compareTo(BigDecimal.ZERO) == 0, "No cash is due for a verified transfer");
        } else {
            require(p.getStatus() == Payment.PaymentStatus.PENDING && p.getCollectedAmount().signum() == 0,
                    "Cash was already collected or payment is not pending");
            require(r.cashReceived().compareTo(o.getTotalAmount()) == 0, "Record the exact cash amount received");
            p.setStatus(Payment.PaymentStatus.PAID);
            p.setCollectedAmount(r.cashReceived());
            p.setPaidAt(LocalDateTime.now(ZoneOffset.UTC));
        }
        inventory.settle(o);
        o.setStatus(Order.OrderStatus.COMPLETED);
        var sale = prior.orElseGet(() -> receiptFor(o));
        audit.record("SALE_COMPLETED", o.getOrderId(), "receipt=" + sale.getReceiptNo() + ",cash=" + r.cashReceived());
        return sale;
    }

    private Sale receiptFor(Order o) {
        var sale = new Sale();
        sale.setOrder(o);
        sale.setReceiptNo("REC-" + UUID.randomUUID().toString().toUpperCase(Locale.ROOT));
        sale.setCompletedBy(current.get());
        sale.setSoldAt(LocalDateTime.now(ZoneOffset.UTC));
        sale = sales.saveAndFlush(sale);
        audit.record("SALE_RECEIPT", o.getOrderId(), "receipt=" + sale.getReceiptNo());
        return sale;
    }

    public Views.Sale receipt(String receipt) {
        current.staff();
        var sale = sales.findByReceiptNo(receipt).orElseThrow(ApiException::missing);
        return ViewMapper.sale(sale, deliveries.findByOrderOrderId(sale.getOrder().getOrderId()).orElse(null));
    }
}
