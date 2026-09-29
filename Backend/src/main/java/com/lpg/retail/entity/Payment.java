package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    
    @Column(length = 255)
    private String slipPath;
    
    @ManyToOne
    @JoinColumn(name = "verified_by")
    private User verifiedBy;
    
    @Column
    private LocalDateTime verifiedAt;
    
    @Column
    private LocalDateTime paidAt;
    
    public enum PaymentMethod { CASH, COD, BANK_TRANSFER }
    public enum PaymentStatus { PENDING, UNDER_REVIEW, VERIFIED, REJECTED, PAID }
}