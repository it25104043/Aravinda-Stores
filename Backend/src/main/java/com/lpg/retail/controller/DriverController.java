package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService service;

    @GetMapping
    public List<Views.Driver> list() {
        return service.list();
    }

    @PutMapping("/{id}/coverage")
    public Views.Driver coverage(@PathVariable Long id, @Valid @RequestBody Requests.DriverCoverage r, @RequestHeader("Idempotency-Key") String key) {
        return service.update(id, r, key);
    }
}
