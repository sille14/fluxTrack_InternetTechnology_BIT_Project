package com.example.demo.business;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.demo.data.domain.SupportTicket;
import com.example.demo.data.domain.TicketMessage;
import com.example.demo.data.domain.TicketState;
import com.example.demo.data.domain.TicketUrgency;
import com.example.demo.data.repository.SupportTicketRepository;

/**
 * Support ticket lifecycle — creation, state transitions (based on the
 * state machine in UC 107 / Figure 9), and role-scoped retrieval.
 */
@Service
public class SupportTicketService {

    @Autowired
    private SupportTicketRepository ticketRepository;

    @Autowired
    private AppUserService appUserService;

    // Admins see all tickets, partners only see their own
    public List<SupportTicket> getTicketsForUser(Authentication auth) {
        if (auth == null) return List.of();
        String username = auth.getName();
        if (appUserService.isAdminUser(username)) {
            return ticketRepository.findAll();
        }
        Long partnerId = appUserService.getPartnerIdForUsername(username);
        if (partnerId == null) return List.of();
        return ticketRepository.findByPartnerID(partnerId);
    }

    public SupportTicket getTicketForUser(Long ticketId, Authentication auth) {
        SupportTicket ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket == null || auth == null) return null;
        String username = auth.getName();
        if (appUserService.isAdminUser(username)) return ticket;
        Long callerPartnerId = appUserService.getPartnerIdForUsername(username);
        if (callerPartnerId == null || !callerPartnerId.equals(ticket.getPartnerID())) {
            return null;
        }
        return ticket;
    }

    // Only partners can create tickets (admins handle them, not raise them)
    public SupportTicket createTicket(String subject, TicketUrgency urgency,
                                      String description, Authentication auth) {
        if (auth == null) {
            throw new SecurityException("Authentication required");
        }
        String username = auth.getName();
        if (appUserService.isAdminUser(username)) {
            throw new SecurityException("Only partners can raise tickets");
        }
        Long partnerId = appUserService.getPartnerIdForUsername(username);
        if (partnerId == null) {
            throw new SecurityException("Unknown partner user");
        }
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Subject is required");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (urgency == null) urgency = TicketUrgency.MEDIUM;

        LocalDateTime now = LocalDateTime.now();
        SupportTicket ticket = new SupportTicket();
        ticket.setPartnerID(partnerId);
        ticket.setSubject(subject);
        ticket.setUrgency(urgency);
        ticket.setState(TicketState.OPEN);
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);
        ticket.getMessages().add(new TicketMessage(username, description, now));
        return ticketRepository.save(ticket);
    }

    // State transitions — each method enforces the allowed source state(s)
    // and moves the ticket to the next state per the UC 107 state diagram.

    public SupportTicket adminReply(Long ticketId, String message, Authentication auth) {
        requireAdmin(auth);
        SupportTicket ticket = mustFind(ticketId);
        requireFromState(ticket, EnumSet.of(TicketState.OPEN));
        appendMessage(ticket, auth.getName(), message);
        ticket.setState(TicketState.ANSWERED);
        return ticketRepository.save(ticket);
    }

    public SupportTicket partnerReply(Long ticketId, String message, Authentication auth) {
        String username = requirePartnerOwner(auth, mustFind(ticketId));
        SupportTicket ticket = mustFind(ticketId);
        requireFromState(ticket, EnumSet.of(TicketState.ANSWERED));
        appendMessage(ticket, username, message);
        ticket.setState(TicketState.OPEN);
        return ticketRepository.save(ticket);
    }

    public SupportTicket markResolved(Long ticketId, Authentication auth) {
        String username = requirePartnerOwner(auth, mustFind(ticketId));
        SupportTicket ticket = mustFind(ticketId);
        requireFromState(ticket, EnumSet.of(TicketState.ANSWERED));
        appendMessage(ticket, username, "Problem confirmed as resolved.");
        ticket.setState(TicketState.RESOLVED);
        return ticketRepository.save(ticket);
    }

    public SupportTicket adminReopen(Long ticketId, String message, Authentication auth) {
        requireAdmin(auth);
        SupportTicket ticket = mustFind(ticketId);
        requireFromState(ticket, EnumSet.of(TicketState.RESOLVED));
        appendMessage(ticket, auth.getName(), message);
        ticket.setState(TicketState.ANSWERED);
        return ticketRepository.save(ticket);
    }

    public SupportTicket markCompleted(Long ticketId, Authentication auth) {
        requireAdmin(auth);
        SupportTicket ticket = mustFind(ticketId);
        requireFromState(ticket, EnumSet.of(TicketState.RESOLVED));
        appendMessage(ticket, auth.getName(), "Ticket closed as completed.");
        ticket.setState(TicketState.COMPLETED);
        return ticketRepository.save(ticket);
    }

    // Used by fluxTrackApplication.initTestData() to seed demo tickets
    public SupportTicket seedTicket(Long partnerID, String subject, TicketUrgency urgency,
                                    TicketState state, LocalDateTime when,
                                    List<TicketMessage> messages) {
        SupportTicket ticket = new SupportTicket();
        ticket.setPartnerID(partnerID);
        ticket.setSubject(subject);
        ticket.setUrgency(urgency);
        ticket.setState(state);
        ticket.setCreatedAt(when);
        ticket.setUpdatedAt(when);
        ticket.getMessages().addAll(messages);
        return ticketRepository.save(ticket);
    }

    // Internal helpers

    private void requireAdmin(Authentication auth) {
        if (auth == null || !appUserService.isAdminUser(auth.getName())) {
            throw new SecurityException("Admin role required");
        }
    }

    private String requirePartnerOwner(Authentication auth, SupportTicket ticket) {
        if (auth == null) throw new SecurityException("Authentication required");
        String username = auth.getName();
        if (appUserService.isAdminUser(username)) {
            throw new SecurityException("This action is for partner users only");
        }
        Long callerPartnerId = appUserService.getPartnerIdForUsername(username);
        if (callerPartnerId == null || !callerPartnerId.equals(ticket.getPartnerID())) {
            throw new SecurityException("Cannot act on another partner's ticket");
        }
        return username;
    }

    private SupportTicket mustFind(Long ticketId) {
        SupportTicket ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket == null) {
            throw new IllegalArgumentException("Ticket not found");
        }
        return ticket;
    }

    private void requireFromState(SupportTicket ticket, Set<TicketState> allowed) {
        if (!allowed.contains(ticket.getState())) {
            throw new IllegalStateException(
                "Invalid transition: ticket is in state " + ticket.getState());
        }
    }

    private void appendMessage(SupportTicket ticket, String author, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content is required");
        }
        LocalDateTime now = LocalDateTime.now();
        ticket.getMessages().add(new TicketMessage(author, content, now));
        ticket.setUpdatedAt(now);
    }
}