package com.train.project.tracking.repository;

import com.train.project.tracking.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Ticket findByReservationId(Long reservationId);
}
