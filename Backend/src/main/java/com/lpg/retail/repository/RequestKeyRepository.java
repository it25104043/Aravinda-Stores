package com.lpg.retail.repository;

import com.lpg.retail.entity.RequestKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestKeyRepository extends JpaRepository<RequestKey, Long> {
    boolean existsByActorIdAndRequestKey(Long actorId, String requestKey);
}
