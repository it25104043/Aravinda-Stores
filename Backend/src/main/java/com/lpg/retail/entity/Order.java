package com.lpg.retail.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    
    @ManyToOne
    @JoinColumn(name = "delivery_zone_id", updatable = false)
    private DeliveryZone deliveryZone;
    
    @Column(length = 255, updatable = false)
    private String deliveryZoneSnapshot;
    
    @Column(length = 500, updatable = false)
    private String deliveryInstructions;
    
    @Column(length = 500)
    private String decisionReason;
    
    @Column(length = 500, updatable = false)
    private String addressSnapshot;
    
    @Column(updatable = false)
    private String contactName;
    
    @Column(updatable = false)
    private String contactPhone;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;
    
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;
    
    @ManyToOne
    @JoinColumn(name = "placed_by_user_id")
    private User placedByUser;
    
    @ManyToOne
    @JoinColumn(name = "address_id")
    private CustomerAddress address;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Channel channel;
    // ONLINE, WALK_IN
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Fulfilment fulfilment;
    // PICKUP, DELIVERY
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;
    
    @Column(nullable = false, precision = 10, scale = 2, updatable = false)
    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.ZERO;
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "placed_at", nullable = false)
    private LocalDateTime placedAt;

    @PrePersist
    protected void onCreate() {
        if (placedAt == null) {
            placedAt = LocalDateTime.now();
        }
    }

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("order") // Prevents circular reference during serialization
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    public enum Channel {
        ONLINE, WALK_IN
    }

    public enum Fulfilment {
        PICKUP, DELIVERY
    }

    public enum OrderStatus {
        PENDING, CONFIRMED, DISPATCHED, COMPLETED, CANCELLED, FAILED, REJECTED
    }
}
