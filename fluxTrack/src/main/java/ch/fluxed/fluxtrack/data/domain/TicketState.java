package ch.fluxed.fluxtrack.data.domain;

/**
 * Lifecycle states for a SupportTicket (per UC 107, Figure 9 of the RE paper).
 *
 * State transitions are validated in SupportTicketService:
 *   OPEN -> ANSWERED      (admin responds)
 *   ANSWERED -> OPEN      (partner replies, not yet satisfied)
 *   ANSWERED -> RESOLVED  (partner confirms problem solved)
 *   RESOLVED -> ANSWERED  (admin reopens with request for details)
 *   RESOLVED -> COMPLETED (admin closes ticket as final)
 *   COMPLETED -> (terminal)
 *
 * DRAFT from the RE paper is implicit — only "submitted" tickets exist in
 * persistence; a partner clicking "Submit" creates a ticket directly in OPEN.
 */
public enum TicketState {
    OPEN,
    ANSWERED,
    RESOLVED,
    COMPLETED
}
