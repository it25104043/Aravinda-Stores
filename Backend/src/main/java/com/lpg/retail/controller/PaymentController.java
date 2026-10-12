package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService service;
    private final com.lpg.retail.service.SlipStorageService storage;
    private final com.lpg.retail.security.CurrentUser current;

    @GetMapping("/slip-policy")
    public Views.SlipPolicy slipPolicy() {
        current.get();
        return storage.policy();
    }

    @PostMapping("/{id}/reconciliation")
    public Views.Payment reconcile(@PathVariable Long id, @Valid @RequestBody Requests.Reconciliation r,
            @RequestHeader("Idempotency-Key") String key) {
        return service.reconcile(id, r, key);
    }

    @GetMapping("/order/{id}")
    public Views.Payment byOrder(@PathVariable Long id) {
        return service.byOrder(id);
    }

    @PostMapping(value = "/{id}/slip", consumes = "multipart/form-data")
    public Views.Payment upload(@PathVariable Long id,
            @RequestPart("file") org.springframework.web.multipart.MultipartFile file,
            @RequestHeader("Idempotency-Key") String key) {
        return service.upload(id, file, key);
    }

    @GetMapping("/{id}/slip")
    public org.springframework.http.ResponseEntity<byte[]> slip(@PathVariable Long id) {
        return org.springframework.http.ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=payment-slip.png")
                .header("X-Content-Type-Options", "nosniff").header("Cache-Control", "no-store")
                .contentType(org.springframework.http.MediaType.IMAGE_PNG)
                .body(service.slip(id));
    }

    @PostMapping("/{id}/review")
    public Views.Payment review(@PathVariable Long id, @Valid @RequestBody Requests.Review r,
            @RequestHeader("Idempotency-Key") String key) {
        return service.review(id, r, key);
    }

    @GetMapping("/review-queue")
    public List<Views.Payment> queue() {
        return service.reviewQueue();
    }

    @GetMapping("/{id}/history")
    public List<Views.Audit> history(@PathVariable Long id) {
        return service.history(id);
    }
}
