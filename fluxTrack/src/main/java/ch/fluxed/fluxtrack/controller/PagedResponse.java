package ch.fluxed.fluxtrack.controller;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * Wraps Spring Data's Page into a stable JSON shape for the frontend.
 * Avoids depending on PageImpl's serialization which changes between Spring versions.
 */
public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}