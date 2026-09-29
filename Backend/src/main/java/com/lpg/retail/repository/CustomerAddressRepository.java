package com.lpg.retail.repository;

import com.lpg.retail.entity.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {
    List<CustomerAddress> findByCustomerCustomerId(Long customerId);
    List<CustomerAddress> findByDeliveryZone(String zone);
}