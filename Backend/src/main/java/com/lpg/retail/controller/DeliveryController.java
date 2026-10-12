package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.DeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {
    private final DeliveryService service;

    @GetMapping
    public List<Views.Delivery> list() {
        return service.list();
    }

    @GetMapping("/{id}/eligible-drivers")
    public List<Views.Driver> eligibleDrivers(@PathVariable Long id) {
        return service.eligibleDrivers(id);
    }

    @PostMapping("/{id}/assign")
    public Views.Delivery assign(@PathVariable Long id, @Valid @RequestBody Requests.AssignDriver r,
            @RequestHeader("Idempotency-Key") String key) {
        return service.assign(id, r, key);
    }

    @PostMapping("/{id}/dispatch")
    public Views.Delivery dispatch(@PathVariable Long id, @RequestHeader("Idempotency-Key") String key) {
        return service.dispatch(id, key);
    }

    @PostMapping("/{id}/complete")
    public Views.Delivery complete(@PathVariable Long id, @Valid @RequestBody Requests.Complete r,
            @RequestHeader("Idempotency-Key") String key) {
        return service.complete(id, r, key);
    }

    @PostMapping("/{id}/fail")
    public Views.Delivery fail(@PathVariable Long id, @Valid @RequestBody Requests.Failure r,
            @RequestHeader("Idempotency-Key") String key) {
        return service.fail(id, r, key);
    }

    @GetMapping("/{id}/timeline")
    public List<Views.Event> timeline(@PathVariable Long id) {
        return service.timeline(id);
    }

    @GetMapping("/{id}/payment")
    public Views.Payment payment(@PathVariable Long id) {
        return service.payment(id);
    }
}
