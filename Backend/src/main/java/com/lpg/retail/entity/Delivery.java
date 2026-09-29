package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long deliveryId;
    
    @OneToOne
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;
    
    @ManyToOne
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status = DeliveryStatus.UNASSIGNED;
    
    @Column
    private LocalDateTime assignedAt;
    
    @Column
    private LocalDateTime completedAt;
    
    @Column
    private BigDecimal codCollected = BigDecimal.ZERO;
    
    public enum DeliveryStatus { UNASSIGNED, ASSIGNED, DISPATCHED, DELIVERED, FAILED }
}