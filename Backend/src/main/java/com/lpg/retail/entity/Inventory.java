package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory_balances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {
    @Column(nullable = false)
    @Builder.Default
    private Integer reservedQty = 0;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;
    @OneToOne
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;
    @Column(nullable = false)
    @Builder.Default
    private Integer fullQty = 0;
    @Column(nullable = false)
    @Builder.Default
    private Integer emptyQty = 0;
    @Column(nullable = false)
    @Builder.Default
    private Integer lowStockLevel = 5;
}
