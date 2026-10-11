package com.lpg.retail.repository;

import com.lpg.retail.entity.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {
    // Fetch all addresses belonging to a specific customer
    List<CustomerAddress> findByCustomerCustomerId(Long customerId);

    // Fetch addresses filtered by delivery zone
    List<CustomerAddress> findByDeliveryZone(String zone);

    // Security check: Find address only if it belongs to the given customer
    Optional<CustomerAddress> findByAddressIdAndCustomerCustomerId(Long addressId, Long customerId);

    // Delete address only if it belongs to the given customer
    void deleteByAddressIdAndCustomerCustomerId(Long addressId, Long customerId);
}
