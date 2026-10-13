package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.DeliveryZone;
import com.lpg.retail.repository.DeliveryZoneRepository;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import static com.lpg.retail.exception.ApiException.require;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@org.springframework.validation.annotation.Validated
@Transactional
public class DeliveryZoneService {
    private final DeliveryZoneRepository zones;
    private final CurrentUser current;
    private final AuditService audit;
    private final DeliveryAssignmentService assignments;

    private Views.ManagedZone view(DeliveryZone zone) {
        return new Views.ManagedZone(zone.getZoneId(), zone.getZoneName(), zone.getDeliveryFee(), zone.isActive());
    }

    public List<Views.ManagedZone> list() {
        current.owner();
        return zones.findAll().stream().map(this::view).toList();
    }

    public Views.ManagedZone save(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.ZoneInput input, String key) {
        current.owner();
        assignments.acquire();
        audit.claim(key, "ZONE_UPDATE");
        var zone = id == null ? new DeliveryZone() : zones.findById(id).orElseThrow(ApiException::missing);
        String name = input.zoneName().trim();
        if (id == null)
            require(name.length() <= 80, "New zone names must fit saved addresses (maximum 80 characters)");
        // Saved addresses store zone names, so renaming an existing zone would
        // invalidate them.
        if (id != null)
            require(zone.getZoneName().equals(name),
                    "Existing zone names cannot be changed; edit its fee or availability");
        require(zones.findAll().stream()
                .noneMatch(z -> !java.util.Objects.equals(z.getZoneId(), id) && z.getZoneName().equalsIgnoreCase(name)),
                "A zone with this name already exists");
        zone.setZoneName(name);
        zone.setDeliveryFee(input.deliveryFee());
        zone.setActive(input.active());
        zones.saveAndFlush(zone);
        audit.record("ZONE_UPDATE", zone.getZoneId(), "fee=" + input.deliveryFee() + "; active=" + input.active());
        return view(zone);
    }
}
