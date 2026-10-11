package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional
public class CustomerService {
    private final CustomerRepository customers;
    private final CustomerAddressRepository addresses;
    private final DeliveryZoneRepository zones;
    private final CurrentUser current;

    public Customer own() {
        current.roles(User.Role.CUSTOMER);
        return customers.findByUserUserId(current.get().getUserId()).orElseThrow(ApiException::missing);
    }

    public Views.Customer me() {
        return ViewMapper.customer(own());
    }

    public Views.Address add(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Address r) {
        Customer c = own();
        var a = new CustomerAddress();
        a.setCustomer(c);
        copy(a, r);
        return ViewMapper.address(addresses.save(a));
    }

    public Views.Address update(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Address r) {
        var a = address(id);
        copy(a, r);
        return ViewMapper.address(a);
    }

    public void delete(Long id) {
        address(id).setArchived(true);
    }

    public CustomerAddress address(Long id) {
        return addresses.findByAddressIdAndCustomerCustomerId(id, own().getCustomerId()).filter(a -> !a.isArchived())
                .orElseThrow(ApiException::missing);
    }

    private void copy(CustomerAddress a,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Address r) {
        a.setAddressLine(r.addressLine().trim());
        a.setCity(r.city().trim());
        a.setDeliveryZone(r.deliveryZone().trim());
        a.setLabel(r.label());
        a.setEligible(zones.findByZoneNameIgnoreCaseAndActiveTrue(r.deliveryZone().trim()).isPresent());
    }
}
