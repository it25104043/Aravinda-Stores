package com.lpg.retail.repository;

import com.lpg.retail.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByUserUserId(Long userId);

    Optional<Customer> findByUserEmail(String email);
    // Explicitly typed
}
