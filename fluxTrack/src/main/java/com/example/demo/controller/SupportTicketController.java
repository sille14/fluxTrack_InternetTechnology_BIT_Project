package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.business.SupportTicketService;
import com.example.demo.data.domain.SupportTicket;
import com.example.demo.data.domain.TicketUrgency;

@RestController
@RequestMapping("/ticket")
public class SupportTicketController {

    @Autowired
    private SupportTicketService ticketService;

    @GetMapping("/")
    public List<SupportTicket> listTickets(Authentication auth) {
        return ticketService.getTicketsForUser(auth);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportTicket> getTicket(@PathVariable Long id, Authentication auth) {
        SupportTicket ticket = ticketService.getTicketForUser(id, auth);
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found or access denied");
        }
        return ResponseEntity.ok(ticket);
    }

    // Partner creates a new ticket
    @PostMapping(path = "/", consumes = "application/json", produces = "application/json")
    public ResponseEntity<SupportTicket> createTicket(@RequestBody CreateTicketRequest req,
                                                       Authentication auth) {
        SupportTicket ticket = ticketService.createTicket(
            req.getSubject(), req.getUrgency(), req.getDescription(), auth);
        return ResponseEntity.ok(ticket);
    }

    // State transition endpoints — each maps to a step in the UC 107 state diagram

    @PostMapping(path = "/{id}/admin-reply", consumes = "application/json")
    public ResponseEntity<SupportTicket> adminReply(@PathVariable Long id,
                                                     @RequestBody MessageRequest req,
                                                     Authentication auth) {
        return runTransition(() ->
            ticketService.adminReply(id, req.getMessage(), auth));
    }

    @PostMapping(path = "/{id}/partner-reply", consumes = "application/json")
    public ResponseEntity<SupportTicket> partnerReply(@PathVariable Long id,
                                                       @RequestBody MessageRequest req,
                                                       Authentication auth) {
        return runTransition(() ->
            ticketService.partnerReply(id, req.getMessage(), auth));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<SupportTicket> resolve(@PathVariable Long id, Authentication auth) {
        return runTransition(() -> ticketService.markResolved(id, auth));
    }

    @PostMapping(path = "/{id}/reopen", consumes = "application/json")
    public ResponseEntity<SupportTicket> reopen(@PathVariable Long id,
                                                 @RequestBody MessageRequest req,
                                                 Authentication auth) {
        return runTransition(() ->
            ticketService.adminReopen(id, req.getMessage(), auth));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SupportTicket> complete(@PathVariable Long id, Authentication auth) {
        return runTransition(() -> ticketService.markCompleted(id, auth));
    }

    // Shared error handling for all state transitions
    private ResponseEntity<SupportTicket> runTransition(java.util.function.Supplier<SupportTicket> op) {
        try {
            return ResponseEntity.ok(op.get());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (SecurityException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
        }
    }

    // Request DTOs

    public static class CreateTicketRequest {
        private String subject;
        private TicketUrgency urgency;
        private String description;

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public TicketUrgency getUrgency() { return urgency; }
        public void setUrgency(TicketUrgency urgency) { this.urgency = urgency; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class MessageRequest {
        private String message;
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}