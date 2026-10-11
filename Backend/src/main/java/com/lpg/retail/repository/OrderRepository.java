package com.lpg.retail.repository;

import com.lpg.retail.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerCustomerId(Long customerId);

    List<Order> findByStatus(Order.OrderStatus status);

    List<Order> findByPlacedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Order> findByChannel(Order.Channel channel);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from Order e where e.orderId = :id")
    java.util.Optional<Order> lockById(@org.springframework.data.repository.query.Param("id") Long id);
}
