package com.lpg.retail.service;

import com.lpg.retail.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.*;
import javax.imageio.*;
import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.*;

@Service
public class SlipStorageService {
    private final Path directory;
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final int MAX_DIMENSION = 6000;
    private static final long MAX_PIXELS = 16000000;
    @Value("${spring.servlet.multipart.max-file-size:5MB}")
    private org.springframework.util.unit.DataSize multipartLimit;

    public com.lpg.retail.dto.Views.SlipPolicy policy() {
        long limit = multipartLimit == null || multipartLimit.toBytes() < 0 ? MAX_BYTES
                : Math.min(MAX_BYTES, multipartLimit.toBytes());
        return new com.lpg.retail.dto.Views.SlipPolicy(limit, List.of("image/png", "image/jpeg"), MAX_DIMENSION,
                MAX_PIXELS);
    }

    public SlipStorageService(@Value("${app.slips.directory}") String path) throws IOException {
        directory = Path.of(path).toAbsolutePath().normalize();
        Files.createDirectories(directory);
        if (Files.isSymbolicLink(directory))
            throw new IOException("Slip directory cannot be a symlink");
        try {
            Files.setPosixFilePermissions(directory, PosixFilePermissions.fromString("rwx------"));
        } catch (UnsupportedOperationException ignored) {
        }
    }

    public String save(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > policy().maxBytes())
            throw new ApiException(400, "Choose a PNG or JPEG slip within the upload limit");
        if (!Set.of("image/png", "image/jpeg").contains(Objects.toString(file.getContentType(), "")))
            throw new ApiException(400, "Only PNG and JPEG slips are accepted");
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(file.getBytes()))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext())
                throw new ApiException(400, "Invalid image");
            var reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String type = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!Set.of("png", "jpeg", "jpg").contains(type))
                    throw new ApiException(400, "Invalid image type");
                int w = reader.getWidth(0), h = reader.getHeight(0);
                if (w < 1 || h < 1 || w > MAX_DIMENSION || h > MAX_DIMENSION || (long) w * h > MAX_PIXELS)
                    throw new ApiException(400, "Image dimensions are too large");
                var image = reader.read(0);
                String key = UUID.randomUUID().toString();
                Path target = path(key);
                try (var out = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE)) {
                    if (!ImageIO.write(image, "png", out))
                        throw new IOException("Image encoding failed");
                }
                try {
                    Files.setPosixFilePermissions(target, PosixFilePermissions.fromString("rw-------"));
                } catch (UnsupportedOperationException ignored) {
                }
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status != STATUS_COMMITTED)
                            try {
                                Files.deleteIfExists(target);
                            } catch (IOException ignored) {
                            }
                    }
                });
                return key;
            } finally {
                reader.dispose();
            }
        } catch (IOException e) {
            throw new ApiException(400, "The slip image could not be read or stored");
        }
    }

    public byte[] read(String key) {
        try {
            return Files.readAllBytes(path(key));
        } catch (IOException e) {
            throw ApiException.missing();
        }
    }

    private Path path(String key) {
        if (key == null || !key.matches("[a-f0-9-]{36}"))
            throw ApiException.missing();
        Path p = directory.resolve(key + ".png");
        if (Files.isSymbolicLink(p))
            throw ApiException.missing();
        return p;
    }
}
