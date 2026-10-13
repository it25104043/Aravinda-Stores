package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {
    private final SaleRepository sales;
    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final DeliveryRepository deliveries;
    private final InventoryRepository inventory;
    private final StockMovementRepository movements;
    private final AuditEventRepository audit;
    private final CurrentUser current;
    @Value("${app.business-zone}")
    private String businessZone;

    public Views.SalesReport sales(LocalDate start, LocalDate end) {
        current.owner();
        if (end.isBefore(start) || end.isAfter(start.plusYears(1)))
            throw new ApiException(400, "Choose a date range of at most one year");
        ZoneId zone = ZoneId.of(businessZone);
        LocalDateTime from = LocalDateTime.ofInstant(start.atStartOfDay(zone).toInstant(), ZoneOffset.UTC),
                to = LocalDateTime.ofInstant(end.plusDays(1).atStartOfDay(zone).toInstant(), ZoneOffset.UTC);
        var result = sales.findBySoldAtGreaterThanEqualAndSoldAtLessThan(from, to);
        return new Views.SalesReport(start.toString(), end.toString(), result.size(),
                result.stream().map(s -> s.getOrder().getTotalAmount()).reduce(BigDecimal.ZERO, BigDecimal::add),
                result.stream().map(ViewMapper::sale).toList());
    }

    private boolean live(Payment p) {
        return !Set.of(Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED, Order.OrderStatus.FAILED)
                .contains(p.getOrder().getStatus());
    }

    public List<Views.Payment> payments() {
        current.owner();
        return payments.findAll().stream().map(ViewMapper::payment).toList();
    }

    public Views.Summary summary() {
        current.owner();
        Map<String, Long> statuses = new LinkedHashMap<>();
        for (var s : Order.OrderStatus.values())
            statuses.put(s.name(), 0L);
        orders.findAll().forEach(o -> statuses.merge(o.getStatus().name(), 1L, Long::sum));
        var all = payments.findAll();
        BigDecimal outstanding = all.stream().filter(this::live).filter(p -> p.getMethod() == Payment.PaymentMethod.COD)
                .map(p -> p.getAmount().subtract(p.getCollectedAmount()).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long transfers = all.stream().filter(this::live)
                .filter(p -> p.getMethod() == Payment.PaymentMethod.BANK_TRANSFER
                        && p.getStatus() == Payment.PaymentStatus.UNDER_REVIEW)
                .count();
        var d = deliveries.findAll();
        return new Views.Summary(statuses, outstanding, transfers, d.size(),
                d.stream().filter(x -> x.getStatus() == Delivery.DeliveryStatus.DELIVERED).count(),
                d.stream().filter(x -> x.getStatus() == Delivery.DeliveryStatus.FAILED).count());
    }

    public List<Views.Stock> stock() {
        current.owner();
        return inventory.findAll().stream().map(ViewMapper::stock).toList();
    }

    public List<Views.Stock> lowStock() {
        current.owner();
        return inventory.findAll().stream().filter(i -> i.getFullQty() < i.getLowStockLevel()).map(ViewMapper::stock)
                .toList();
    }

    public List<Views.Movement> movements(int page) {
        current.owner();
        valid(page);
        return movements.findAll(PageRequest.of(page, 100, Sort.by("movementId").descending())).stream()
                .map(ViewMapper::movement).toList();
    }

    public List<Views.Audit> audit(int page) {
        current.owner();
        valid(page);
        return audit.findAll(PageRequest.of(page, 100, Sort.by("auditId").descending())).stream().map(ViewMapper::audit)
                .toList();
    }

    private void valid(int page) {
        if (page < 0)
            throw new ApiException(400, "Invalid page");
    }
}
