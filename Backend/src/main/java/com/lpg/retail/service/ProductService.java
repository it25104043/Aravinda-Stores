package com.lpg.retail.service;

import com.lpg.retail.dto.*;
import com.lpg.retail.entity.*;
import com.lpg.retail.repository.*;
import com.lpg.retail.security.CurrentUser;
import com.lpg.retail.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@org.springframework.validation.annotation.Validated
@RequiredArgsConstructor
@Transactional
public class ProductService {
    private final ProductRepository products;
    private final InventoryRepository inventories;
    private final InventoryService stock;
    private final CurrentUser current;
    private final AuditService audit;
    private final ProductImageStorage images;
    private final ProductImageCleanup cleanup;

    public Views.Product image(Long id, org.springframework.web.multipart.MultipartFile file, String key) {
        current.staff();
        var inv = stock.locked(id);
        var product = inv.getProduct();
        if (!Boolean.TRUE.equals(product.getActive()))
            throw ApiException.missing();
        audit.claim(key, "PRODUCT_IMAGE");
        String old = product.getImageKey();
        product.setImageKey(images.save(file));
        product.setImageContentType("image/png");
        audit.record("PRODUCT_IMAGE_UPDATED", id, "Product photograph updated");
        afterCommit(old);
        return ViewMapper.product(product, inv);
    }

    public void removeImage(Long id, String key) {
        current.staff();
        var product = stock.locked(id).getProduct();
        audit.claim(key, "PRODUCT_IMAGE_DELETE");
        String old = product.getImageKey();
        product.setImageKey(null);
        product.setImageContentType(null);
        audit.record("PRODUCT_IMAGE_REMOVED", id, "Product photograph removed");
        afterCommit(old);
    }

    public record Image(String key, byte[] bytes) {
    }

    @Transactional(readOnly = true)
    public Image readImage(Long id, String version) {
        var p = products.findById(id).filter(x -> Boolean.TRUE.equals(x.getActive()))
                .orElseThrow(ApiException::missing);
        if (p.getImageKey() == null || (version != null && !version.equals(p.getImageKey())))
            throw ApiException.missing();
        return new Image(p.getImageKey(), images.read(p.getImageKey()));
    }

    private void afterCommit(String key) {
        org.springframework.transaction.support.TransactionSynchronizationManager
                .registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            cleanup.obsolete(key);
                        } catch (RuntimeException ex) {
                            org.slf4j.LoggerFactory.getLogger(ProductService.class)
                                    .warn("Product image cleanup deferred; reference update is committed");
                        }
                    }
                });
    }

    public List<Views.Product> all() {
        return products.findByActive(true).stream().map(p -> ViewMapper.product(p, stock.stock(p.getProductId())))
                .toList();
    }

    public Views.Product get(Long id) {
        var p = products.findById(id).filter(x -> Boolean.TRUE.equals(x.getActive()))
                .orElseThrow(ApiException::missing);
        return ViewMapper.product(p, stock.stock(id));
    }

    public Views.Product create(
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.ProductInput r) {
        current.staff();
        Product p = new Product();
        copy(p, r);
        p.setActive(true);
        p = products.saveAndFlush(p);
        var i = new Inventory();
        i.setProduct(p);
        i.setLowStockLevel(r.lowStockLevel());
        inventories.saveAndFlush(i);
        audit.record("PRICE_CREATE", p.getProductId(), "exchange=" + p.getExchangePrice() + ",new=" + p.getNewPrice());
        return ViewMapper.product(p, i);
    }

    public Views.Product update(Long id,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.ProductInput r) {
        current.staff();
        var inv = stock.locked(id);
        var p = inv.getProduct();
        String before = "exchange=" + p.getExchangePrice() + ",new=" + p.getNewPrice();
        copy(p, r);
        inv.setLowStockLevel(r.lowStockLevel());
        audit.record("THRESHOLD", id, "Threshold=" + r.lowStockLevel());
        audit.record("PRICE_CHANGE", id, before + " -> exchange=" + p.getExchangePrice() + ",new=" + p.getNewPrice());
        return ViewMapper.product(p, inv);
    }

    public void disable(Long id) {
        current.staff();
        stock.locked(id).getProduct().setActive(false);
    }

    private void copy(Product p,
            @jakarta.validation.Valid @jakarta.validation.constraints.NotNull Requests.ProductInput r) {
        p.setBrand(r.brand().trim());
        p.setSizeKg(r.sizeKg());
        p.setExchangePrice(r.exchangePrice());
        p.setNewPrice(r.newPrice());
    }
}
