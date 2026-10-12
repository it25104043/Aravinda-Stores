package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService service;

    @GetMapping
    public List<Views.Stock> all() {
        return service.all();
    }

    @GetMapping("/movements")
    public List<Views.Movement> history(@RequestParam(defaultValue = "0") int page) {
        return service.history(page);
    }

    @PostMapping("/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public Views.Movement movement(@Valid @RequestBody Requests.Movement r,
            @RequestHeader("Idempotency-Key") String key) {
        return service.movement(r, key);
    }

    @PutMapping("/{productId}/threshold")
    public Views.Stock threshold(@PathVariable Long productId, @Valid @RequestBody Requests.Threshold r) {
        return service.threshold(productId, r);
    }
}
