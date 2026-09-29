package com.lpg.retail.repository;

import com.lpg.retail.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductProductId(Long productId);
    List<StockMovement> findByReason(StockMovement.Reason reason);
    List<StockMovement> findByRecordedAtBetween(LocalDateTime start, LocalDateTime end);
}