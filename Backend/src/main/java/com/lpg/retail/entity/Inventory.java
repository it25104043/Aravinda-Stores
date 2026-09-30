package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory_balances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;
    
    @OneToOne
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;
    
    @Column(nullable = false)
    private Integer fullQty = 0;
    
    @Column(nullable = false)
    private Integer emptyQty = 0;
    
    @Column(nullable = false)
    private Integer lowStockLevel = 5;
}
