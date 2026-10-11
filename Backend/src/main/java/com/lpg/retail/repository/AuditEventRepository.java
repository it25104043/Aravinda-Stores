package com.lpg.retail.repository;

import com.lpg.retail.entity.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findByActionStartingWithAndResourceIdOrderByAuditIdAsc(String action, Long resourceId);
}
