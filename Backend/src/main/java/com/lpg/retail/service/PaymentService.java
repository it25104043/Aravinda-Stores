package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import static com.lpg.retail.exception.ApiException.require;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.*;
import java.util.*;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
public class PaymentService {
    private final jakarta.persistence.EntityManager entityManager;
    private final PaymentRepository payments;
    private final OrderService orders;
    private final CurrentUser current;
    private final AuditService audit;
    private final AuditEventRepository events;
    private final SlipStorageService storage;

    private Payment get(Long id) {
        var p = payments.findById(id).orElseThrow(ApiException::missing);
        orders.authorize(p.getOrder());
        return p;
    }

    private Payment lock(Long id) {
        var p = get(id);
        orders.lock(p.getOrder().getOrderId());
        var locked = payments.lockById(id).orElseThrow(ApiException::missing);
        entityManager.refresh(locked, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return locked;
    }

    public Views.Payment byOrder(Long id) {
        orders.get(id);
        var p = payments.findByOrderOrderId(id);
        if (p == null)
            throw ApiException.missing();
        return ViewMapper.payment(p);
    }

    public Views.Payment upload(Long id, MultipartFile file, String key) {
        current.roles(User.Role.CUSTOMER);
        audit.claim(key, "SLIP");
        var p = lock(id);
        require(p.getMethod() == Payment.PaymentMethod.BANK_TRANSFER, "This order does not use bank transfer");
        require(p.getStatus() == Payment.PaymentStatus.PENDING || p.getStatus() == Payment.PaymentStatus.REJECTED,
                "Slip is already under review or verified");
        require(p.getOrder().getStatus() == Order.OrderStatus.PENDING
                || p.getOrder().getStatus() == Order.OrderStatus.CONFIRMED,
                "Order is no longer accepting payment slips");
        p.setSlipKey(storage.save(file));
        p.setSlipType("image/png");
        p.setStatus(Payment.PaymentStatus.UNDER_REVIEW);
        audit.record("PAYMENT_UPLOAD", id, "New private slip submitted for review");
        return ViewMapper.payment(p);
    }

    public byte[] slip(Long id) {
        return storage.read(get(id).getSlipKey());
    }

    public Views.Payment review(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Review r, String key) {
        current.staff();
        audit.claim(key, "PAYMENT_REVIEW");
        var p = lock(id);
        require(p.getMethod() == Payment.PaymentMethod.BANK_TRANSFER
                && p.getStatus() == Payment.PaymentStatus.UNDER_REVIEW,
                "Only an unreviewed bank transfer can be decided");
        require(p.getOrder().getStatus() != Order.OrderStatus.CANCELLED
                && p.getOrder().getStatus() != Order.OrderStatus.REJECTED, "Order has been cancelled or rejected");
        p.setStatus(r.approve() ? Payment.PaymentStatus.VERIFIED : Payment.PaymentStatus.REJECTED);
        p.setVerifiedBy(current.get());
        p.setVerifiedAt(LocalDateTime.now(ZoneOffset.UTC));
        if (r.approve()) {
            p.setPaidAt(LocalDateTime.now(ZoneOffset.UTC));
            p.setCollectedAmount(p.getAmount());
        }
        audit.record("PAYMENT_REVIEW", id,
                (r.approve() ? "APPROVED" : "REJECTED") + "; reason=" + r.reason() + "; slip=" + p.getSlipKey());
        return ViewMapper.payment(p);
    }

    public Views.Payment reconcile(Long id, @jakarta.validation.Valid Requests.Reconciliation r, String key) {
        current.roles(User.Role.OWNER);
        audit.claim(key, "RECONCILIATION");
        var p = lock(id);
        require(p.getReconciliationStatus() == Payment.ReconciliationStatus.REQUIRED,
                "Payment does not require reconciliation");
        p.setReconciliationStatus(Payment.ReconciliationStatus.RESOLVED);
        p.setReconciliationReason(r.reason().trim());
        audit.record("PAYMENT_RECONCILIATION_RESOLVED", id, r.reason().trim() + "; original payment retained");
        return ViewMapper.payment(p);
    }

    public List<Views.Payment> reviewQueue() {
        current.staff();
        return payments.findByStatus(Payment.PaymentStatus.UNDER_REVIEW).stream()
                .filter(p -> p.getMethod() == Payment.PaymentMethod.BANK_TRANSFER)
                .filter(p -> p.getOrder().getStatus() != Order.OrderStatus.CANCELLED
                        && p.getOrder().getStatus() != Order.OrderStatus.REJECTED)
                .map(ViewMapper::payment).toList();
    }

    public List<Views.Audit> history(Long id) {
        get(id);
        return events.findByActionStartingWithAndResourceIdOrderByAuditIdAsc("PAYMENT_", id).stream()
                .map(ViewMapper::audit).toList();
    }
}
