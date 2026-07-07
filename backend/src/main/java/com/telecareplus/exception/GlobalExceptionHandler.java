package com.telecareplus.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request, HttpServletResponse response) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, response);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<?> handleBadRequest(BadRequestException ex, HttpServletRequest request, HttpServletResponse response) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request, response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request, HttpServletResponse response) {
        if (isSseRequest(request, response)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleDenied(AccessDeniedException ex, HttpServletRequest request, HttpServletResponse response) {
        return build(HttpStatus.FORBIDDEN, "Access denied", request, response);
    }

    @ExceptionHandler({ BadCredentialsException.class, UsernameNotFoundException.class, AuthenticationException.class })
    public ResponseEntity<?> handleAuthFailure(Exception ex, HttpServletRequest request, HttpServletResponse response) {
        return build(HttpStatus.UNAUTHORIZED, "Invalid credentials", request, response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request, HttpServletResponse response) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = "Request could not be processed";
        String details = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String normalizedDetails = details == null ? "" : details.toLowerCase();
        if (normalizedDetails.contains("uk_appointment_doctor_datetime")
                || (normalizedDetails.contains("appointment") && normalizedDetails.contains("doctor_id") && normalizedDetails.contains("appointment_date_time"))) {
            status = HttpStatus.CONFLICT;
            message = "Doctor is unavailable at the selected slot";
        }
        if (details != null && details.contains("care_message") && details.toLowerCase().contains("value too long")) {
            message = "Message body must be at most 2000 characters";
        }
        return build(status, message, request, response);
    }

    @ExceptionHandler(RequestNotPermitted.class)
    public ResponseEntity<?> handleRateLimit(RequestNotPermitted ex, HttpServletRequest request, HttpServletResponse response) {
        return build(HttpStatus.TOO_MANY_REQUESTS, "Too many requests", request, response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleOther(Exception ex, HttpServletRequest request, HttpServletResponse response) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Unexpected error";
        return build(HttpStatus.INTERNAL_SERVER_ERROR, message, request, response);
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message, HttpServletRequest request, HttpServletResponse response) {
        if (isSseRequest(request, response)) {
            return ResponseEntity.status(status).build();
        }
        return build(status, message, null);
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message, Map<String, String> errors) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("message", message);
        if (errors != null && !errors.isEmpty()) {
            body.put("errors", errors);
        }
        return ResponseEntity.status(status).body(body);
    }

    private boolean isSseRequest(HttpServletRequest request, HttpServletResponse response) {
        String contentType = response != null ? response.getContentType() : null;
        if (contentType != null && contentType.contains("text/event-stream")) {
            return true;
        }
        String accept = request != null ? request.getHeader("Accept") : null;
        return accept != null && accept.contains("text/event-stream");
    }
}
