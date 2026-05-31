package com.example.demo.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Catches unhandled exceptions and maps them to clean JSON error responses.
 * Logs server-side for debugging but never exposes internal details to clients.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Preserves the status code controllers set via ResponseStatusException
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(
            ResponseStatusException ex, HttpServletRequest request) {
        int status = ex.getStatusCode().value();
        String reason = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        log.debug("Request rejected at [{}]: status={}, reason={}", sanitisePath(request), status, reason);
        return ResponseEntity.status(status).body(ErrorResponse.of(status, reason));
    }

    // Validation errors from the service layer → 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Validation failure at [{}]: {}", sanitisePath(request), ex.getMessage());
        return ResponseEntity.badRequest().body(ErrorResponse.of(400, ex.getMessage()));
    }

    // Business rule violations (e.g. insufficient stock) → 409
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex, HttpServletRequest request) {
        log.warn("Business rule violation at [{}]: {}", sanitisePath(request), ex.getMessage());
        return ResponseEntity.status(409).body(ErrorResponse.of(409, ex.getMessage()));
    }

    // Ownership/access violations from the service layer → 403
    // Returns generic "Access denied" to avoid leaking resource details
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleSecurity(
            SecurityException ex, HttpServletRequest request) {
        log.warn("Access denied at [{}]: {}", sanitisePath(request), ex.getMessage());
        return ResponseEntity.status(403).body(ErrorResponse.of(403, "Access denied"));
    }

    // Catch-all for unexpected errors → 500 (full stack trace logged for debugging)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at [{}]", sanitisePath(request), ex);
        return ResponseEntity.internalServerError()
                .body(ErrorResponse.of(500, "An internal error occurred"));
    }

    // Strips query string from the URI before logging (query params can contain tokens)
    private String sanitisePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return "unknown";
        int q = uri.indexOf('?');
        return q >= 0 ? uri.substring(0, q) : uri;
    }
}