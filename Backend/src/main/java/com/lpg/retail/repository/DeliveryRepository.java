package com.lpg.retail.repository;

import com.lpg.retail.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderOrderId(Long orderId);

    List<Delivery> findByStatus(Delivery.DeliveryStatus status);

    List<Delivery> findByAssignedStaffUserId(Long userId);

    List<Delivery> findByOrderAddressDeliveryZone(String zone);

    long countByAssignedStaffUserIdAndStatusIn(Long userId, java.util.Collection<Delivery.DeliveryStatus> statuses);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from Delivery e where e.deliveryId = :id")
    java.util.Optional<Delivery> lockById(@org.springframework.data.repository.query.Param("id") Long id);
}
