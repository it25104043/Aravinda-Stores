package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;
    
    @ManyToOne
    @JoinColumn(name = "delivery_id", nullable = false)
    private Delivery delivery;
    
    @ManyToOne
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actorUser;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime eventAt = LocalDateTime.now();
    
    @Column(length = 500)
    private String note;
    
    public enum EventType { ASSIGNED, DISPATCHED, DELIVERED, FAILED, NOTE }
}