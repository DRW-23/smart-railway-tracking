package com.train.project.tracking.controller;

import com.train.project.tracking.model.Ticket;
import com.train.project.tracking.service.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets")
@CrossOrigin(origins = "http://localhost:3000")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // Generate ticket after payment
    @PostMapping("/generate/{reservationId}")
    public ResponseEntity<Ticket> generateTicket(@PathVariable Long reservationId) {
        return ResponseEntity.ok(ticketService.generateTicket(reservationId));
    }
}
