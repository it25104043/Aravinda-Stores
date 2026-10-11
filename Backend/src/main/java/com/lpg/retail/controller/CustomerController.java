package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CustomerService service;

    @GetMapping("/me")
    public Views.Customer me() {
        return service.me();
    }

    @PostMapping("/me/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public Views.Address add(@Valid @RequestBody Requests.Address r) {
        return service.add(r);
    }

    @PutMapping("/me/addresses/{id}")
    public Views.Address update(@PathVariable Long id, @Valid @RequestBody Requests.Address r) {
        return service.update(id, r);
    }

    @DeleteMapping("/me/addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
