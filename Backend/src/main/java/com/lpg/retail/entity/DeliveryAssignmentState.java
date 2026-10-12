package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * One durable row serializes assignment decisions across application instances.
 */
@Entity
@Table(name = "delivery_assignment_state")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryAssignmentState {

    @Id
    private Long id;
    private Long lastDriverId;
}
