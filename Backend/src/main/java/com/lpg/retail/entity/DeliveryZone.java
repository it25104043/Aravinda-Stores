package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "delivery_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "zone_id")
    private Long zoneId;
    @Column(name = "zone_name", nullable = false, unique = true)
    private String zoneName;
    @Column(name = "delivery_fee", nullable = false)
    private BigDecimal deliveryFee;
    @Column(name = "active")
    private boolean active = true;
}
