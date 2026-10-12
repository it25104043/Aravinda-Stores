package com.lpg.retail.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import com.lpg.retail.repository.ProductRepository;

@Service
@RequiredArgsConstructor
public class ProductImageCleanup {
    private final ProductRepository products;
    private final ProductImageStorage storage;

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void obsolete(String key) {
        if (key != null && !products.existsByImageKey(key))
            storage.delete(key);
    }
}
