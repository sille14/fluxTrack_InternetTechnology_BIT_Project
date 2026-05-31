package ch.fluxed.fluxtrack.controller;

import java.time.LocalDateTime;

/** Standard JSON error shape returned by GlobalExceptionHandler. */
public record ErrorResponse(
    int status,
    String message,
    String timestamp
) {
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, LocalDateTime.now().toString());
    }
}