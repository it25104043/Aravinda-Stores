package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {
    private final SaleService service;
    private final com.lpg.retail.service.OrderService orders;

    @PostMapping("/walk-in/quote")
    public Views.WalkInQuote quote(@Valid @RequestBody Requests.WalkIn r) {
        return orders.quoteWalkIn(r);
    }

    @PostMapping("/walk-in")
    @ResponseStatus(HttpStatus.CREATED)
    public Views.Sale walkIn(@Valid @RequestBody Requests.WalkIn r, @RequestHeader("Idempotency-Key") String key) {
        return service.walkIn(r, key);
    }

    @PostMapping("/pickup/{id}")
    public Views.Sale pickup(@PathVariable Long id, @Valid @RequestBody Requests.Complete r,
            @RequestHeader("Idempotency-Key") String key) {
        return service.pickup(id, r, key);
    }

    @GetMapping("/receipt/{receipt}")
    public Views.Sale receipt(@PathVariable String receipt) {
        return service.receipt(receipt);
    }
}
