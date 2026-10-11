package com.lpg.retail.security;

import com.lpg.retail.entity.User;
import com.lpg.retail.repository.UserRepository;
import com.lpg.retail.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;

@Component
@RequiredArgsConstructor
public class CurrentUser {
    private final jakarta.persistence.EntityManager entityManager;
    private final UserRepository users;

    public User get() {
        var a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !a.isAuthenticated() || "anonymousUser".equals(a.getPrincipal()))
            throw new ApiException(401, "Sign in required");
        var u = users.findById(Long.valueOf(a.getName())).orElseThrow(() -> new ApiException(401, "Sign in required"));
        if (!Boolean.TRUE.equals(u.getActive()))
            throw new ApiException(401, "Account disabled");
        return u;
    }

    public User lock() {
        User u = get();
        u = users.lockById(u.getUserId()).orElseThrow(ApiException::missing);
        entityManager.refresh(u, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (!Boolean.TRUE.equals(u.getActive()))
            throw new ApiException(401, "Account disabled");
        return u;
    }

    public void roles(User.Role... roles) {
        User u = get();
        for (var role : roles)
            if (u.getRole() == role)
                return;
        throw new AccessDeniedException("Role required");
    }

    public void staff() {
        roles(User.Role.OWNER, User.Role.STORE_STAFF);
    }

    public void owner() {
        roles(User.Role.OWNER);
    }

    public void own(Long userId) {
        if (!get().getUserId().equals(userId))
            throw new AccessDeniedException("Not your record");
    }
}
