package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.config.JwtUtils;
import com.lpg.retail.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
public class UserService {
    private final jakarta.persistence.EntityManager entityManager;
    private final UserRepository users;
    private final CustomerRepository customers;
    private final CurrentUser current;
    private final DeliveryAssignmentService assignments;
    private final BCryptPasswordEncoder encoder;
    private final JwtUtils jwt;
    private final AuditService audit;

    public void changePassword(@jakarta.validation.Valid Requests.ChangePassword r, String key) {
        var u = current.lock();
        if (r == null || r.currentPassword() == null || r.newPassword() == null || r.confirmPassword() == null)
            throw new ApiException(400, "All password fields are required");
        if (r.currentPassword().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
                || !encoder.matches(r.currentPassword(), u.getPasswordHash()))
            throw new ApiException(400, "Current password is incorrect");
        String next = r.newPassword();
        if (!next.equals(r.confirmPassword()))
            throw new ApiException(400, "New passwords must match");
        if (next.length() < 12 || next.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72 ||
                !next.matches("(?s).*[a-z].*") || !next.matches("(?s).*[A-Z].*") || !next.matches("(?s).*[0-9].*"))
            throw new ApiException(400,
                    "Use at least 12 characters with uppercase, lowercase and a number; maximum 72 UTF-8 bytes");
        if (encoder.matches(next, u.getPasswordHash()))
            throw new ApiException(400, "Choose a different new password");
        audit.claim(key, "CHANGE_PASSWORD");
        u.setPasswordHash(encoder.encode(next));
        u.setTokenVersion(u.getTokenVersion() + 1);
        audit.record("PASSWORD_CHANGED", u.getUserId(), "Account password changed; previous sessions invalidated");
    }

    public Views.User register(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Register r) {
        return ViewMapper.user(create(r, User.Role.CUSTOMER));
    }

    private User create(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Register r,
            User.Role role) {
        if (r.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
            throw new ApiException(400, "Password exceeds 72 UTF-8 bytes");
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        if (users.findByEmail(email).isPresent())
            throw new ApiException(409, "Email is already registered");
        User u = new User();
        u.setFullName(r.fullName().trim());
        u.setEmail(email);
        u.setPhone(r.phone().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(role);
        u.setActive(true);
        u = users.saveAndFlush(u);
        if (role == User.Role.CUSTOMER) {
            Customer c = new Customer();
            c.setUser(u);
            customers.save(c);
        }
        return u;
    }

    public Views.Login login(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Login r) {
        var u = users.findByEmail(r.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ApiException(401, "Invalid credentials"));
        if (!encoder.matches(r.password(), u.getPasswordHash()) || !Boolean.TRUE.equals(u.getActive()))
            throw new ApiException(401, "Invalid credentials");
        return new Views.Login(ViewMapper.user(u), jwt.generate(u), jwt.ttl());
    }

    public Views.User me() {
        return ViewMapper.user(current.get());
    }

    public void logout() {
        var u = current.lock();
        u.setTokenVersion(u.getTokenVersion() + 1);
    }

    public Views.User contact(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Contact r) {
        var u = current.lock();
        u.setFullName(r.fullName().trim());
        u.setPhone(r.phone().trim());
        audit.record("PROFILE_UPDATED", u.getUserId(), "Personal contact details updated");
        return ViewMapper.user(u);
    }

    public List<Views.User> staff() {
        current.owner();
        return users.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STORE_STAFF || u.getRole() == User.Role.DELIVERY_STAFF)
                .map(ViewMapper::user).toList();
    }

    public Views.User createStaff(@jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Staff r) {
        current.owner();
        staffRole(r.role());
        return ViewMapper.user(create(r.account(), r.role()));
    }

    public Views.User access(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.StaffAccess r) {
        current.owner();
        staffRole(r.role());
        var existing = users.findById(id).orElseThrow(ApiException::missing);
        staffRole(existing.getRole());
        if (existing.getRole() == User.Role.DELIVERY_STAFF || r.role() == User.Role.DELIVERY_STAFF)
            assignments.acquire();
        var u = users.lockById(id).orElseThrow(ApiException::missing);
        entityManager.refresh(u, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        staffRole(u.getRole());
        if (r.fullName() != null) {
            if (r.fullName().isBlank())
                throw new ApiException(400, "Full name is required");
            u.setFullName(r.fullName().trim());
        }
        if (r.phone() != null) {
            if (r.phone().isBlank())
                throw new ApiException(400, "Phone is required");
            u.setPhone(r.phone().trim());
        }
        audit.record("STAFF_UPDATED", id, "Owner updated staff contact or access; existing sessions invalidated");
        u.setActive(r.active());
        u.setRole(r.role());
        u.setTokenVersion(u.getTokenVersion() + 1);
        return ViewMapper.user(u);
    }

    private void staffRole(User.Role r) {
        if (r != User.Role.STORE_STAFF && r != User.Role.DELIVERY_STAFF)
            throw new ApiException(400, "Only store or delivery staff roles are allowed");
    }

    public List<Views.User> workers() {
        current.staff();
        return users.findByRole(User.Role.DELIVERY_STAFF).stream().filter(u -> Boolean.TRUE.equals(u.getActive()))
                .map(ViewMapper::user).toList();
    }
}
