package com.lpg.retail.repository;

import com.lpg.retail.entity.DriverZone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DriverZoneRepository extends JpaRepository<DriverZone, Long> {

    List<DriverZone> findByDriverUserId(Long driverId);

    List<DriverZone> findByZoneZoneId(Long zoneId);

    boolean existsByDriverUserIdAndZoneZoneId(Long driverId, Long zoneId);
}
