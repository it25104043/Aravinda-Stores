package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "driver_zones", uniqueConstraints = @UniqueConstraint(columnNames = {"driver_id", "zone_id"}))
@Getter
@Setter
@NoArgsConstructor
public class DriverZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;
    @ManyToOne
    @JoinColumn(name = "zone_id", nullable = false)
    private DeliveryZone zone;
}
