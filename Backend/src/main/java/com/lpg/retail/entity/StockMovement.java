package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long movementId;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    @Column(nullable = false)
    private Integer fullDelta;
    
    @Column(nullable = false)
    private Integer emptyDelta;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Reason reason;
    
    @ManyToOne
    @JoinColumn(name = "recorded_by", nullable = false)
    private User recordedBy;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();
    
    @Column(length = 500)
    private String note;
    
    public enum Reason { OPENING, RECEIPT, EXCHANGE_SALE, NEW_SALE, CORRECTION, RETURN }
}
