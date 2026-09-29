package com.lpg.retail.repository;

import com.lpg.retail.entity.DeliveryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface DeliveryEventRepository extends JpaRepository<DeliveryEvent, Long> {
    List<DeliveryEvent> findByDeliveryDeliveryId(Long deliveryId);
    List<DeliveryEvent> findByEventType(DeliveryEvent.EventType eventType);
    List<DeliveryEvent> findByEventAtBetween(LocalDateTime start, LocalDateTime end);
}