package com.lpg.retail.service;

import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditEventRepository audits;
    private final RequestKeyRepository keys;
    private final CurrentUser current;

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(String action, Long resource, String detail) {
        audits.save(new AuditEvent(current.get().getUserId(), action, resource, detail));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void claim(String key, String operation) {
        var u = current.get();
        if (key == null || !key.matches("[A-Za-z0-9_-]{8,80}"))
            throw new ApiException(400, "A valid Idempotency-Key is required");
        if (keys.existsByActorIdAndRequestKey(u.getUserId(), key))
            throw new ApiException(409, "Duplicate request rejected. Refresh to see the original result.");
        try {
            keys.saveAndFlush(new RequestKey(u.getUserId(), key, operation));
        } catch (org.springframework.dao.DataIntegrityViolationException duplicate) {
            throw new ApiException(409, "Duplicate request rejected. Refresh to see the original result.");
        }
    }
}
