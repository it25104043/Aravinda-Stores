package com.lpg.retail.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class Views {
    private Views() {
    }

    public record User(Long userId, String fullName, String email, String phone, String role, boolean active) {
    }

    public record Login(User user, String token, long expiresInSeconds) {
    }

    public record Address(Long addressId, String addressLine, String city, String deliveryZone, String label,
            boolean eligible) {
    }

    public record Customer(Long customerId, User user, List<Address> addresses) {
    }

    public record Product(Long productId, String brand, BigDecimal sizeKg, BigDecimal exchangePrice,
            BigDecimal newPrice, boolean active, int fullQty, int availableQty, int lowStockLevel, String imageUrl) {
    }

    public record Stock(Long inventoryId, Product product, int fullQty, int emptyQty, int reservedQty, int availableQty,
            int lowStockLevel) {
    }

    public record Item(Long orderItemId, Long productId, String brand, BigDecimal sizeKg, String purchaseType,
            int quantity, BigDecimal unitPrice, int deliveredQty, int emptyCollected, String imageUrl) {
    }

    public record Order(Long orderId, String reference, String channel, String fulfilment, String status,
            String decisionReason, LocalDateTime placedAt, BigDecimal deliveryFee, BigDecimal totalAmount,
            String customerName, String customerPhone, String addressSnapshot, List<Item> items, Long deliveryZoneId,
            String deliveryZone, String deliveryInstructions) {
    }

    public record Payment(Long paymentId, Long orderId, String method, String status, BigDecimal amount,
            BigDecimal collectedAmount, boolean hasSlip, String reconciliationStatus, String reconciliationReason,
            String verifiedBy, LocalDateTime verifiedAt) {
    }

    public record Movement(Long movementId, Long productId, int fullDelta, int emptyDelta, String reason, String note,
            Long actorUserId, LocalDateTime recordedAt, String actorName, String actorRole) {
    }

    public record Delivery(Long deliveryId, Order order, User assignedStaff, String status, BigDecimal codCollected) {
    }

    public record Event(Long eventId, Long actorUserId, String type, LocalDateTime eventAt, String note,
            String actorName, String actorRole) {
    }

    public record Audit(Long auditId, Long actorUserId, LocalDateTime occurredAt, String action, Long resourceId,
            String detail, String actorName, String actorRole) {
    }

    public record Sale(Long saleId, String receiptNo, Order order, LocalDateTime soldAt, Long completedBy,
            Delivery delivery) {
    }

    public record WalkInQuote(java.math.BigDecimal subtotal, java.math.BigDecimal deliveryFee,
            java.math.BigDecimal totalAmount) {
    }

    public record Driver(User user, boolean available, long activeDeliveries, List<Zone> zones) {
    }

    public record SlipPolicy(long maxBytes, List<String> contentTypes, int maxDimension, long maxPixels) {
    }

    public record CustomerOrder(Order order, Payment payment, Delivery delivery) {
    }

    public record OrderDetails(Order order, Payment payment, Delivery delivery, List<Audit> orderHistory,
            List<Audit> paymentHistory, List<Event> deliveryHistory) {
    }

    public record ManagedZone(Long zoneId, String zoneName, BigDecimal deliveryFee, boolean active) {
    }

    public record Zone(Long zoneId, String zoneName, BigDecimal deliveryFee) {
    }

    public record SalesReport(String startDate, String endDate, int totalSales, BigDecimal totalRevenue,
            List<Sale> sales) {
    }

    public record Summary(Map<String, Long> ordersByStatus, BigDecimal outstandingCod, long transfersAwaitingReview,
            long totalDeliveries, long delivered, long failed) {
    }
}
