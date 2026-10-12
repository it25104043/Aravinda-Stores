package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService service;

    @PostMapping(value = "/{id}/image", consumes = "multipart/form-data")
    public Views.Product uploadImage(@PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestHeader("Idempotency-Key") String key) {
        return service.image(id, file, key);
    }

    @DeleteMapping("/{id}/image")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeImage(@PathVariable Long id, @RequestHeader("Idempotency-Key") String key) {
        service.removeImage(id, key);
    }

    @GetMapping("/{id}/image")
    public org.springframework.http.ResponseEntity<byte[]> image(@PathVariable Long id,
            @RequestParam(value = "v", required = false) String version,
            @RequestHeader(value = "If-None-Match", required = false) String etag) {
        var image = service.readImage(id, version);
        String tag = "\"" + image.key() + "\"";
        var response = org.springframework.http.ResponseEntity.status(tag.equals(etag) ? 304 : 200)
                .contentType(org.springframework.http.MediaType.IMAGE_PNG).eTag(tag)
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Disposition", "inline; filename=product.png")
                .cacheControl(org.springframework.http.CacheControl
                        .maxAge(version == null ? 0 : 3600, java.util.concurrent.TimeUnit.SECONDS).cachePublic()
                        .mustRevalidate());
        return response.body(tag.equals(etag) ? null : image.bytes());
    }

    @GetMapping
    public List<Views.Product> all() {
        return service.all();
    }

    @GetMapping("/{id}")
    public Views.Product get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Views.Product create(@Valid @RequestBody Requests.ProductInput r) {
        return service.create(r);
    }

    @PutMapping("/{id}")
    public Views.Product update(@PathVariable Long id, @Valid @RequestBody Requests.ProductInput r) {
        return service.update(id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(@PathVariable Long id) {
        service.disable(id);
    }
}
