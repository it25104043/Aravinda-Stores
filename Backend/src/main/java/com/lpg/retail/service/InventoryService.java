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
import org.springframework.data.domain.*;
import java.util.*;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional
public class InventoryService {
    private final jakarta.persistence.EntityManager entityManager;
    private final InventoryRepository inventories;
    private final StockMovementRepository movements;
    private final CurrentUser current;
    private final AuditService audit;

    public Inventory locked(Long id) {
        var i = inventories.lockByProductId(id).orElseThrow(ApiException::missing);
        entityManager.refresh(i, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(i.getProduct(), jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return i;
    }

    public Inventory stock(Long id) {
        return inventories.findByProductProductId(id).orElseThrow(ApiException::missing);
    }

    public List<Views.Stock> all() {
        current.staff();
        return inventories.findAll().stream().map(ViewMapper::stock).toList();
    }

    public List<Views.Movement> history(int page) {
        current.staff();
        if (page < 0)
            throw new ApiException(400, "Invalid page");
        return movements.findAll(PageRequest.of(page, 100, Sort.by("movementId").descending())).stream()
                .map(ViewMapper::movement).toList();
    }

    public Views.Stock threshold(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Threshold r) {
        current.staff();
        var i = locked(id);
        i.setLowStockLevel(r.lowStockLevel());
        audit.record("THRESHOLD", id, "Threshold=" + r.lowStockLevel());
        return ViewMapper.stock(i);
    }

    public Views.Movement movement(
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.Movement r, String key) {
        current.staff();
        audit.claim(key, "STOCK");
        require(r.reason() == StockMovement.Reason.RECEIPT || r.reason() == StockMovement.Reason.RETURN
                || r.reason() == StockMovement.Reason.CORRECTION || r.reason() == StockMovement.Reason.OPENING,
                "Invalid manual movement reason");
        require(r.fullDelta() != 0 || r.emptyDelta() != 0, "Movement must change stock");
        if (r.reason() == StockMovement.Reason.RECEIPT || r.reason() == StockMovement.Reason.OPENING)
            require(r.fullDelta() >= 0 && r.emptyDelta() >= 0, "Receipt quantities must be positive");
        if (r.reason() == StockMovement.Reason.RETURN)
            require(r.fullDelta() == 0 && r.emptyDelta() > 0, "An empty return must increase empty stock only");
        return ViewMapper
                .movement(change(locked(r.productId()), r.fullDelta(), r.emptyDelta(), r.reason(), r.note(), null));
    }

    public void reserve(List<OrderItem> items) {
        for (var entry : totals(items).entrySet()) {
            var i = locked(entry.getKey());
            require(i.getFullQty() - i.getReservedQty() >= entry.getValue(), "Insufficient available full cylinders");
            i.setReservedQty(Math.addExact(i.getReservedQty(), entry.getValue()));
        }
    }

    public void release(List<OrderItem> items) {
        for (var e : totals(items).entrySet()) {
            var i = locked(e.getKey());
            require(i.getReservedQty() >= e.getValue(), "Reservation is inconsistent; contact the owner");
            i.setReservedQty(i.getReservedQty() - e.getValue());
        }
    }

    public void settle(Order order) {
        var sorted = order.getItems().stream().sorted(Comparator.comparing(i -> i.getProduct().getProductId()))
                .toList();
        // Lock all products in a deterministic order before mutation.
        Map<Long, Inventory> locked = new TreeMap<>();
        for (var i : sorted)
            locked.computeIfAbsent(i.getProduct().getProductId(), this::locked);
        for (var line : sorted) {
            var inv = locked.get(line.getProduct().getProductId());
            require(inv.getReservedQty() >= line.getQuantity(), "Reservation is inconsistent");
            inv.setReservedQty(inv.getReservedQty() - line.getQuantity());
            change(inv, -line.getDeliveredQty(), line.getEmptyCollected(),
                    line.getPurchaseType() == OrderItem.PurchaseType.EXCHANGE ? StockMovement.Reason.EXCHANGE_SALE
                            : StockMovement.Reason.NEW_SALE,
                    "Handover for ORD-" + order.getOrderId(), order);
        }
    }

    private Map<Long, Integer> totals(List<OrderItem> items) {
        Map<Long, Integer> result = new TreeMap<>();
        for (var i : items)
            result.merge(i.getProduct().getProductId(), i.getQuantity(), Math::addExact);
        return result;
    }

    private StockMovement change(Inventory i, int full, int empty, StockMovement.Reason reason, String note,
            Order order) {
        int nextFull = Math.addExact(i.getFullQty(), full), nextEmpty = Math.addExact(i.getEmptyQty(), empty);
        require(nextFull >= 0 && nextEmpty >= 0 && nextFull >= i.getReservedQty(),
                "Stock adjustment would consume reserved stock or create a negative balance");
        i.setFullQty(nextFull);
        i.setEmptyQty(nextEmpty);
        var m = new StockMovement();
        m.setProduct(i.getProduct());
        m.setOrder(order);
        m.setFullDelta(full);
        m.setEmptyDelta(empty);
        m.setReason(reason);
        m.setNote(note);
        m.setRecordedBy(current.get());
        m.setRecordedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        m = movements.save(m);
        audit.record("STOCK", m.getMovementId(), "product=" + i.getProduct().getProductId() + ",fullDelta=" + full
                + ",emptyDelta=" + empty + ",reason=" + reason + ",note=" + note);
        return m;
    }
}
