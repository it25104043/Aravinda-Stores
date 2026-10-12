package com.lpg.retail.repository;

import com.lpg.retail.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Payment findByOrderOrderId(Long orderId);

    List<Payment> findByStatus(Payment.PaymentStatus status);

    List<Payment> findByMethod(Payment.PaymentMethod method);

    List<Payment> findByVerifiedAtBetween(LocalDateTime start, LocalDateTime end);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from Payment e where e.paymentId = :id")
    java.util.Optional<Payment> lockById(@org.springframework.data.repository.query.Param("id") Long id);
}
