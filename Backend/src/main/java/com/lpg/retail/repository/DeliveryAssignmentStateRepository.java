package com.lpg.retail.repository;

import com.lpg.retail.entity.DeliveryAssignmentState;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface DeliveryAssignmentStateRepository extends JpaRepository<DeliveryAssignmentState, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from DeliveryAssignmentState s where s.id=1")
    Optional<DeliveryAssignmentState> lockState();
}
