package com.lpg.retail.exception;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import jakarta.validation.ConstraintViolationException;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    private ResponseEntity<Map<String, Object>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("status", status, "message", message));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<?> domain(ApiException e) {
        return error(e.getStatus(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> validation(MethodArgumentNotValidException e) {
        return error(400,
                e.getBindingResult().getFieldErrors().stream().map(f -> f.getField() + ": " + f.getDefaultMessage())
                        .distinct().sorted().collect(java.util.stream.Collectors.joining("; ")));
    }

    @ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            ConstraintViolationException.class, IllegalArgumentException.class,
            org.springframework.web.bind.MissingRequestHeaderException.class,
            org.springframework.web.bind.MissingServletRequestParameterException.class })
    public ResponseEntity<?> input(Exception e) {
        return error(400, "Invalid request fields or format");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> denied() {
        return error(403, "You do not have permission for this operation");
    }

    @ExceptionHandler({ DataIntegrityViolationException.class, ConcurrencyFailureException.class })
    public ResponseEntity<?> conflict() {
        return error(409, "Conflicting or duplicate operation. Refresh and check the saved result.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> large() {
        return error(413, "Upload exceeds the configured request size limit");
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<?> missingRoute() {
        return error(404, "Endpoint not found");
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<?> wrongMethod() {
        return error(405, "Method not supported");
    }

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<?> wrongType() {
        return error(415, "Unsupported content type");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> unexpected(Exception e) {
        org.slf4j.LoggerFactory.getLogger(getClass()).error("Unhandled API failure of type {}",
                e.getClass().getSimpleName());
        return error(500, "The operation could not be completed");
    }
}
