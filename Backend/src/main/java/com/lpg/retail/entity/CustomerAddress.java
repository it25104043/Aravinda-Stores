package com.lpg.retail.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAddress {
    
    @Builder.Default
    @Column(nullable = false)
    private boolean archived = false;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long addressId;
    
    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnoreProperties("addresses")
    private Customer customer;
    
    @Column(nullable = false, length = 250)
    private String addressLine;
    
    @Column(nullable = false, length = 100)
    private String city;
    
    @Column(nullable = false, length = 80)
    private String deliveryZone;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean eligible = true;
    
    @Column
    private String label;
    // "Home", "Work", "Other"
}
