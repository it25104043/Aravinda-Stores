package com.lpg.retail.repository;

import com.lpg.retail.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    Optional<Sale> findByOrderOrderId(Long orderId);

    Optional<Sale> findByReceiptNo(String receiptNo);

    List<Sale> findBySoldAtBetween(LocalDateTime start, LocalDateTime end);

    List<Sale> findBySoldAtGreaterThanEqualAndSoldAtLessThan(LocalDateTime start, LocalDateTime end);
}
