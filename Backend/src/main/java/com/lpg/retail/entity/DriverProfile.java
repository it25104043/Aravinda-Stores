package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "driver_profiles")
@Getter
@Setter
@NoArgsConstructor
public class DriverProfile {

    @Id
    private Long driverId;
    @OneToOne
    @MapsId
    @JoinColumn(name = "driver_id")
    private User driver;
    @Column(nullable = false)
    private boolean available = true;
}
