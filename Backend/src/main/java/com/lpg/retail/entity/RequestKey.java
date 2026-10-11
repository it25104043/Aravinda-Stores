package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "request_keys", uniqueConstraints = @UniqueConstraint(columnNames = { "actor_id", "request_key" }))
@Getter
@NoArgsConstructor
public class RequestKey {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "actor_id", nullable = false)
    private Long actorId;
    
    @Column(name = "request_key", nullable = false, length = 80)
    private String requestKey;
    
    @Column(nullable = false, length = 60)
    private String operation;

    public RequestKey(Long actor, String key, String operation) {
        this.actorId = actor;
        this.requestKey = key;
        this.operation = operation;
    }
}
