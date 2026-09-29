package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

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
    private Channel channel; // ONLINE, WALK_IN

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Fulfilment fulfilment; // PICKUP, DELIVERY

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime placedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    public enum Channel { ONLINE, WALK_IN }
    public enum Fulfilment { PICKUP, DELIVERY }
    public enum OrderStatus { PENDING, CONFIRMED, DISPATCHED, COMPLETED, CANCELLED, FAILED }
}