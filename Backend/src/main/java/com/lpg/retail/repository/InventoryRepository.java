package com.lpg.retail.repository;

import com.lpg.retail.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductProductId(Long productId);
    List<Inventory> findByFullQtyLessThan(Integer quantity);
}