package com.lpg.retail.service;

import com.lpg.retail.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.*;
import javax.imageio.ImageIO;
import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.*;

/**
 * Product-only storage. Private payment slips retain their separate
 * authorization/service.
 */
@Service
public class ProductImageStorage {
    private final Path directory;
    private final long maxBytes;
    private final int maxDimension;

    public ProductImageStorage(@Value("${app.products.images.directory:./storage/products}") String location,
            @Value("${app.slips.directory}") String slips,
            @Value("${app.products.images.max-bytes:5242880}") long maxBytes,
            @Value("${app.products.images.max-dimension:2400}") int maxDimension) throws IOException {
        directory = Path.of(location).toAbsolutePath().normalize();
        Path privateDirectory = Path.of(slips).toAbsolutePath().normalize();
        if (directory.startsWith(privateDirectory) || privateDirectory.startsWith(directory))
            throw new IOException("Product and private slip directories must be separate");
        if (maxBytes < 1 || maxBytes > 10 * 1024 * 1024 || maxDimension < 1 || maxDimension > 6000)
            throw new IOException("Invalid product image limits");
        for (Path part = directory; part != null; part = part.getParent())
            if (Files.isSymbolicLink(part))
                throw new IOException("Image directory cannot contain symlinks");
        Files.createDirectories(directory);
        try {
            Files.setPosixFilePermissions(directory, PosixFilePermissions.fromString("rwx------"));
        } catch (UnsupportedOperationException ignored) {
        }
        this.maxBytes = maxBytes;
        this.maxDimension = maxDimension;
    }

    public String save(MultipartFile file) {
        if (!TransactionSynchronizationManager.isSynchronizationActive())
            throw new IllegalStateException("Image save requires a transaction");
        if (file == null || file.isEmpty() || file.getSize() > maxBytes)
            throw new ApiException(400, "Choose an image within the configured upload limit");
        if (!Set.of("image/png", "image/jpeg").contains(Objects.toString(file.getContentType(), "")))
            throw new ApiException(400, "Only PNG and JPEG product images are supported");
        Path target = null;
        try (var input = ImageIO.createImageInputStream(file.getInputStream())) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext())
                throw new ApiException(400, "Invalid image content");
            var reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!Set.of("png", "jpeg", "jpg").contains(format))
                    throw new ApiException(400, "Invalid image format");
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > maxDimension || height > maxDimension
                        || (long) width * height > 16000000)
                    throw new ApiException(400, "Image dimensions exceed the configured limit");
                var decoded = reader.read(0);
                String key = UUID.randomUUID().toString();
                target = path(key);
                final Path saved = target;
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status != STATUS_COMMITTED)
                            removeFile(saved);
                    }
                });
                try (var output = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW,
                        StandardOpenOption.WRITE)) {
                    if (!ImageIO.write(decoded, "png", output))
                        throw new IOException("Image encoding failed");
                }
                try {
                    Files.setPosixFilePermissions(target, PosixFilePermissions.fromString("rw-------"));
                } catch (UnsupportedOperationException ignored) {
                }
                return key;
            } finally {
                reader.dispose();
            }
        } catch (IOException ex) {
            if (target != null)
                removeFile(target);
            throw new ApiException(400, "Product image could not be read or stored");
        }
    }

    public byte[] read(String key) {
        try (var input = Files.newInputStream(path(key), LinkOption.NOFOLLOW_LINKS)) {
            return input.readAllBytes();
        } catch (IOException ex) {
            throw ApiException.missing();
        }
    }

    public void delete(String key) {
        if (key != null)
            removeFile(path(key));
    }

    private static void removeFile(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException ex) {
            org.slf4j.LoggerFactory.getLogger(ProductImageStorage.class)
                    .warn("An obsolete product image needs offline cleanup");
        }
    }

    private Path path(String key) {
        if (key == null || !key.matches("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"))
            throw ApiException.missing();
        Path file = directory.resolve(key + ".png");
        if (Files.isSymbolicLink(file))
            throw ApiException.missing();
        return file;
    }
}
