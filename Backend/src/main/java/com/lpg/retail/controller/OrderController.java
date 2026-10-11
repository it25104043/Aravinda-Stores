package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService service;

    @GetMapping("/mine")
    public List<Views.CustomerOrder> mine(@RequestParam(defaultValue = "0") int page) {
        return service.mine(page);
    }

    @GetMapping("/{id}/details")
    public Views.OrderDetails details(@PathVariable Long id) {
        return service.details(id);
    }

    @GetMapping
    public List<Views.Order> list(@RequestParam(defaultValue = "0") int page) {
        return service.list(page);
    }

    @GetMapping("/{id}")
    public Views.Order get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Views.Order place(@Valid @RequestBody Requests.PlaceOrder r, @RequestHeader("Idempotency-Key") String key) {
        return service.place(r, key);
    }

    @PostMapping("/{id}/cancel")
    public Views.Order cancel(@PathVariable Long id, @RequestHeader("Idempotency-Key") String key) {
        return service.cancel(id, key);
    }

    @PostMapping("/{id}/decision")
    public Views.Order decision(@PathVariable Long id, @Valid @RequestBody Requests.Decision r,
                                @RequestHeader("Idempotency-Key") String key) {
        return service.decision(id, r, key);
    }
}
