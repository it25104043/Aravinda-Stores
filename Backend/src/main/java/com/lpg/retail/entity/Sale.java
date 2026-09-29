package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long saleId;
    
    @OneToOne
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;
    
    @Column(nullable = false, unique = true, length = 50)
    private String receiptNo;
    
    @ManyToOne
    @JoinColumn(name = "completed_by", nullable = false)
    private User completedBy;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime soldAt = LocalDateTime.now();
}