package com.lpg.retail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_events")
@Getter
@NoArgsConstructor
public class AuditEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auditId;
    
    @Column(name = "actor_user_id", nullable = false, updatable = false)
    private Long actorUserId;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime occurredAt;
    
    @Column(nullable = false, updatable = false, length = 60)
    private String action;
    
    @Column(nullable = false, updatable = false)
    private Long resourceId;
    
    @Column(nullable = false, updatable = false, length = 2000)
    private String detail;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id", insertable = false, updatable = false)
    private User actor;

    public AuditEvent(Long actor, String action, Long resource, String detail) {
        this.actorUserId = actor;
        this.action = action;
        this.resourceId = resource;
        this.detail = detail;
        this.occurredAt = LocalDateTime.now(java.time.ZoneOffset.UTC);
    }
}
