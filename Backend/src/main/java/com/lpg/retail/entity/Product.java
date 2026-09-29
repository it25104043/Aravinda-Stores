package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cylinder_products", uniqueConstraints = @UniqueConstraint(columnNames = {"brand", "size_kg"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;
    
    @Column(nullable = false, length = 80)
    private String brand;
    
    @Column(nullable = false, name = "size_kg")
    private BigDecimal sizeKg;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal exchangePrice;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal newPrice;
    
    @Column(nullable = false)
    private Boolean active = true;
}