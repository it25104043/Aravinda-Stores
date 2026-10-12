package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import static com.lpg.retail.exception.ApiException.require;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.*;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional(isolation = Isolation.READ_COMMITTED)
public class DriverService {

    private final UserRepository users;
    private final DriverProfileRepository profiles;
    private final DriverZoneRepository coverage;
    private final DeliveryZoneRepository zones;
    private final DeliveryAssignmentService assignments;
    private final CurrentUser current;
    private final AuditService audit;

    public Views.Driver view(User user) {
        var profile = profiles.findById(user.getUserId()).orElse(null);
        return new Views.Driver(ViewMapper.user(user), profile != null && profile.isAvailable(), assignments.workload(user.getUserId()),
                coverage.findByDriverUserId(user.getUserId()).stream().map(c -> new Views.Zone(c.getZone().getZoneId(), c.getZone().getZoneName(), c.getZone().getDeliveryFee())).toList());
    }

    public List<Views.Driver> list() {
        current.owner();
        return users.findByRole(User.Role.DELIVERY_STAFF).stream().map(this::view).toList();
    }

    public Views.Driver update(Long id, @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.DriverCoverage r, String key) {
        current.owner();
        audit.claim(key, "DRIVER_COVERAGE");
        assignments.acquire();
        var driver = users.findById(id).orElseThrow(ApiException::missing);
        require(driver.getRole() == User.Role.DELIVERY_STAFF, "Only delivery staff can have delivery-zone coverage");
        var ids = new TreeSet<>(r.zoneIds());
        require(ids.size() == r.zoneIds().size(), "Duplicate delivery zones are not allowed");
        var selected = ids.stream().map(zoneId -> zones.findById(zoneId).filter(DeliveryZone::isActive).orElseThrow(() -> new ApiException(400, "Choose active delivery zones"))).toList();
        var existing = coverage.findByDriverUserId(id);
        existing.stream().filter(c -> !ids.contains(c.getZone().getZoneId())).forEach(coverage::delete);
        for (var z : selected) {
            if (existing.stream().noneMatch(c -> c.getZone().getZoneId().equals(z.getZoneId()))) {
                var c = new DriverZone();
                c.setDriver(driver);
                c.setZone(z);
                coverage.save(c);
            }
        }
        var profile = profiles.findById(id).orElseGet(() -> {
            var p = new DriverProfile();
            p.setDriver(driver);
            return p;
        });
        profile.setAvailable(r.available());
        profiles.save(profile);
        audit.record("DRIVER_COVERAGE", id, "available=" + r.available() + "; zones=" + ids);
        return view(driver);
    }
}
