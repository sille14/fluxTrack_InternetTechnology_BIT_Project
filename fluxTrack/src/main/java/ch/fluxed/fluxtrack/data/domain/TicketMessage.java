package ch.fluxed.fluxtrack.data.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * A single message in a SupportTicket conversation thread.
 *
 * Embeddable (not @Entity) — TicketMessage instances only exist as part of
 * the parent SupportTicket's message list. They are stored in a child table
 * via @ElementCollection on the parent entity.
 */
@Embeddable
public class TicketMessage {

    @Column(name = "author", nullable = false)
    private String author;       // username of the writer (partner or "admin")

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public TicketMessage() {}

    public TicketMessage(String author, String content, LocalDateTime createdAt) {
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
