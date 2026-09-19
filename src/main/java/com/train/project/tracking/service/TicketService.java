package com.train.project.tracking.service;

import com.train.project.tracking.model.Reservation;
import com.train.project.tracking.model.Ticket;
import com.train.project.tracking.repository.ReservationRepository;
import com.train.project.tracking.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TicketService {

    private final TicketRepository ticketRepo;
    private final ReservationRepository reservationRepo;

    public TicketService(TicketRepository ticketRepo, ReservationRepository reservationRepo) {
        this.ticketRepo = ticketRepo;
        this.reservationRepo = reservationRepo;
    }

    public Ticket generateTicket(Long reservationId) {
        Reservation reservation = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        // Ticket number format: TKT-<reservationId>-<timestamp>
        String ticketNumber = "TKT-" + reservationId + "-" + System.currentTimeMillis();

        Ticket ticket = new Ticket();
        ticket.setReservation(reservation);
        ticket.setTicketNumber(ticketNumber);
        ticket.setIssuedAt(LocalDateTime.now());

        return ticketRepo.save(ticket);
    }
}
