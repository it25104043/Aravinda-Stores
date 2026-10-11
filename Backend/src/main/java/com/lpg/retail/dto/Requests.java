package com.lpg.retail.dto;

import com.lpg.retail.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public final class Requests {
    public record ChangePassword(@NotNull String currentPassword, @NotNull String newPassword,
            @NotNull String confirmPassword) {
        @Override
        public String toString() {
            return "ChangePassword[redacted]";
        }
    }

    private Requests() {
    }

    public record Register(@NotBlank @Size(max = 100) String fullName, @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Pattern(regexp = "[+0-9 ()-]{7,20}") String phone,
            @NotBlank @Size(min = 10, max = 72) String password) {
        @Override
        public String toString() {
            return "AuthenticationRequest[redacted]";
        }
    }

    public record Login(@NotBlank @Email String email, @NotBlank @Size(max = 72) String password) {
        @Override
        public String toString() {
            return "AuthenticationRequest[redacted]";
        }
    }

    public record Staff(@Valid @NotNull Register account, @NotNull User.Role role) {
    }

    public record StaffAccess(@NotNull User.Role role, @NotNull Boolean active,
            @Size(min = 1, max = 100) String fullName, @Pattern(regexp = "[+0-9 ()-]{7,20}") String phone) {
        public StaffAccess(User.Role role, Boolean active) {
            this(role, active, null, null);
        }
    }

    public record Contact(@NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "[+0-9 ()-]{7,20}") String phone) {
    }

    public record Address(@NotBlank @Size(max = 250) String addressLine, @NotBlank @Size(max = 100) String city,
            @NotBlank @Size(max = 80) String deliveryZone, @Size(max = 100) String label) {
    }

    public record Line(@NotNull @Positive Long productId, @NotNull OrderItem.PurchaseType purchaseType,
            @NotNull @Min(1) @Max(1000) Integer quantity) {
    }

    public record PlaceOrder(@NotNull Order.Fulfilment fulfilment, @NotNull Payment.PaymentMethod paymentMethod,
            @Valid Address address, @Positive Long addressId,
            @NotEmpty @Size(max = 50) List<@NotNull @Valid Line> items) {
    }

    public record GuestDelivery(@NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "(?:0|\\+94|94)[1-9][0-9]{8}") String phone,
            @NotBlank @Size(max = 350) String addressLine, @NotNull @Positive Long zoneId,
            @Size(max = 500) String instructions) {
    }

    public record WalkIn(@NotNull Order.Fulfilment fulfilment, @NotNull Payment.PaymentMethod paymentMethod,
            @Valid GuestDelivery customer, @NotEmpty @Size(max = 50) List<@NotNull @Valid Line> items) {
    }

    public record DriverCoverage(@NotNull Boolean available,
            @NotNull @Size(max = 200) List<@NotNull @Positive Long> zoneIds) {
    }

    public record AssignDriver(@NotNull @Positive Long staffId, @NotBlank @Size(max = 500) String reason) {
    }

    public record Reconciliation(@NotBlank @Size(max = 500) String reason) {
    }

    public record Decision(@NotNull Order.OrderStatus status, @Size(max = 500) String reason) {
    }

    public record Movement(@NotNull @Positive Long productId, @NotNull @Min(-100000) @Max(100000) Integer fullDelta,
            @NotNull @Min(-100000) @Max(100000) Integer emptyDelta, @NotNull StockMovement.Reason reason,
            @NotBlank @Size(max = 500) String note) {
    }

    public record Threshold(@NotNull @Min(0) @Max(100000) Integer lowStockLevel) {
    }

    public record ProductInput(@NotBlank @Size(max = 80) String brand,
            @NotNull @DecimalMin("0.01") @Digits(integer = 5, fraction = 2) BigDecimal sizeKg,
            @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal exchangePrice,
            @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal newPrice,
            @NotNull @Min(0) @Max(100000) Integer lowStockLevel) {
    }

    public record Review(@NotNull Boolean approve, @NotBlank @Size(max = 500) String reason) {
    }

    public record Actual(@NotNull @Positive Long orderItemId, @NotNull @Min(0) @Max(1000) Integer deliveredQty,
            @NotNull @Min(0) @Max(1000) Integer emptyCollected) {
    }

    public record Complete(@NotEmpty @Size(max = 50) List<@NotNull @Valid Actual> items,
            @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal cashReceived) {
    }

    public record ZoneInput(@NotBlank @Size(max = 255) String zoneName,
            @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal deliveryFee,
            @NotNull Boolean active) {
    }

    public record Failure(@NotBlank @Size(max = 500) String reason) {
    }
}
