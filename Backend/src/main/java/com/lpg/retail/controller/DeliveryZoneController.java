package com.lpg.retail.controller;

import com.lpg.retail.dto.Views;
import com.lpg.retail.repository.DeliveryZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-zones")
@RequiredArgsConstructor
public class DeliveryZoneController {
    private final DeliveryZoneRepository zones;
    private final com.lpg.retail.service.DeliveryZoneService management;

    @GetMapping("/manage")
    public List<Views.ManagedZone> manage() {
        return management.list();
    }

    @PostMapping
    public Views.ManagedZone create(@jakarta.validation.Valid @RequestBody com.lpg.retail.dto.Requests.ZoneInput input,
            @RequestHeader("Idempotency-Key") String key) {
        return management.save(null, input, key);
    }

    @PutMapping("/{id}")
    public Views.ManagedZone update(@PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.lpg.retail.dto.Requests.ZoneInput input,
            @RequestHeader("Idempotency-Key") String key) {
        return management.save(id, input, key);
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Views.Zone> all() {
        return zones.findByActiveTrue().stream()
                .map(z -> new Views.Zone(z.getZoneId(), z.getZoneName(), z.getDeliveryFee())).toList();
    }
}
