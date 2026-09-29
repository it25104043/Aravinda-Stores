package com.lpg.retail.service;

import com.lpg.retail.entity.Customer;
import com.lpg.retail.entity.CustomerAddress;
import com.lpg.retail.entity.User;
import com.lpg.retail.repository.CustomerRepository;
import com.lpg.retail.repository.CustomerAddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerAddressRepository addressRepository;

    public Customer createCustomer(User user) {
        Customer customer = new Customer();
        customer.setUser(user);
        customer.setLoyaltyPoints("0");
        return customerRepository.save(customer);
    }

    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    public Customer getCustomerByUserId(Long userId) {
        return customerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    public List<CustomerAddress> getCustomerAddresses(Long customerId) {
        return addressRepository.findByCustomerCustomerId(customerId);
    }

    public CustomerAddress addAddress(Long customerId, CustomerAddress address) {
        Customer customer = getCustomerById(customerId);
        address.setCustomer(customer);
        return addressRepository.save(address);
    }

    public CustomerAddress updateAddress(Long addressId, CustomerAddress addressDetails) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        address.setAddressLine(addressDetails.getAddressLine());
        address.setCity(addressDetails.getCity());
        address.setDeliveryZone(addressDetails.getDeliveryZone());
        address.setLabel(addressDetails.getLabel());
        return addressRepository.save(address);
    }

    public void deleteAddress(Long addressId) {
        addressRepository.deleteById(addressId);
    }
}