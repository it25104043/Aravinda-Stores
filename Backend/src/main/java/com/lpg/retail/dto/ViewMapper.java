package com.lpg.retail.dto;

import com.lpg.retail.entity.*;

public final class ViewMapper {
    private static String imageUrl(Product p) {
        return p.getImageKey() == null ? null : "/api/products/" + p.getProductId() + "/image?v=" + p.getImageKey();
    }

    private ViewMapper() {
    }

    public static Views.User user(User u) {
        return u == null ? null
                : new Views.User(u.getUserId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole().name(),
                        Boolean.TRUE.equals(u.getActive()));
    }

    public static Views.Address address(CustomerAddress a) {
        return new Views.Address(a.getAddressId(), a.getAddressLine(), a.getCity(), a.getDeliveryZone(), a.getLabel(),
                Boolean.TRUE.equals(a.getEligible()));
    }

    public static Views.Customer customer(Customer c) {
        return new Views.Customer(c.getCustomerId(), user(c.getUser()),
                c.getAddresses().stream().filter(a -> !a.isArchived()).map(ViewMapper::address).toList());
    }

    public static Views.Product product(Product p, Inventory i) {
        return new Views.Product(p.getProductId(), p.getBrand(), p.getSizeKg(), p.getExchangePrice(), p.getNewPrice(),
                Boolean.TRUE.equals(p.getActive()), i.getFullQty(), i.getFullQty() - i.getReservedQty(),
                i.getLowStockLevel(), imageUrl(p));
    }

    public static Views.Stock stock(Inventory i) {
        return new Views.Stock(i.getInventoryId(), product(i.getProduct(), i), i.getFullQty(), i.getEmptyQty(),
                i.getReservedQty(), i.getFullQty() - i.getReservedQty(), i.getLowStockLevel());
    }

    public static Views.Item item(OrderItem i) {
        return new Views.Item(i.getOrderItemId(), i.getProduct().getProductId(), i.getProduct().getBrand(),
                i.getProduct().getSizeKg(), i.getPurchaseType().name(), i.getQuantity(), i.getUnitPrice(),
                i.getDeliveredQty(), i.getEmptyCollected(), imageUrl(i.getProduct()));
    }

    public static Views.Order order(Order o) {
        return new Views.Order(o.getOrderId(), "ORD-" + o.getOrderId(), o.getChannel().name(), o.getFulfilment().name(),
                o.getStatus().name(), o.getDecisionReason(), o.getPlacedAt(), o.getDeliveryFee(), o.getTotalAmount(),
                o.getContactName(), o.getContactPhone(), o.getAddressSnapshot(),
                o.getItems().stream().map(ViewMapper::item).toList(),
                o.getDeliveryZone() == null ? null : o.getDeliveryZone().getZoneId(),
                o.getDeliveryZoneSnapshot() != null ? o.getDeliveryZoneSnapshot()
                        : o.getAddress() == null ? null : o.getAddress().getDeliveryZone(),
                o.getDeliveryInstructions());
    }

    public static Views.Payment payment(Payment p) {
        return new Views.Payment(p.getPaymentId(), p.getOrder().getOrderId(), p.getMethod().name(),
                p.getStatus().name(), p.getAmount(), p.getCollectedAmount(), p.getSlipKey() != null,
                p.getReconciliationStatus().name(), p.getReconciliationReason(),
                p.getVerifiedBy() == null ? null : p.getVerifiedBy().getFullName(), p.getVerifiedAt());
    }

    public static Views.Movement movement(StockMovement m) {
        return new Views.Movement(m.getMovementId(), m.getProduct().getProductId(), m.getFullDelta(), m.getEmptyDelta(),
                m.getReason().name(), m.getNote(), m.getRecordedBy().getUserId(), m.getRecordedAt(),
                m.getRecordedBy().getFullName(), m.getRecordedBy().getRole().name());
    }

    public static Views.Delivery delivery(Delivery d) {
        return new Views.Delivery(d.getDeliveryId(), order(d.getOrder()), user(d.getAssignedStaff()),
                d.getStatus().name(), d.getCodCollected());
    }

    public static Views.Event event(DeliveryEvent e) {
        return new Views.Event(e.getEventId(), e.getActorUser().getUserId(), e.getEventType().name(), e.getEventAt(),
                e.getNote(), e.getActorUser().getFullName(), e.getActorUser().getRole().name());
    }

    public static Views.Audit audit(AuditEvent e) {
        return new Views.Audit(e.getAuditId(), e.getActorUserId(), e.getOccurredAt(), e.getAction(), e.getResourceId(),
                e.getDetail(), e.getActor() == null ? null : e.getActor().getFullName(),
                e.getActor() == null ? null : e.getActor().getRole().name());
    }

    public static Views.Sale sale(Sale s) {
        return sale(s, null);
    }

    public static Views.Sale sale(Sale s, Delivery delivery) {
        return new Views.Sale(s.getSaleId(), s.getReceiptNo(), order(s.getOrder()), s.getSoldAt(),
                s.getCompletedBy().getUserId(), delivery == null ? null : delivery(delivery));
    }
}
