package com.train.project.tracking.controller;

import com.train.project.tracking.dto.ReservationRequest;
import com.train.project.tracking.model.Reservation;
import com.train.project.tracking.service.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservations")
@CrossOrigin(origins = "http://localhost:3000")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    // Book a seat
    @PostMapping("/book")
    public ResponseEntity<Reservation> bookSeat(@RequestBody ReservationRequest request) {
        return ResponseEntity.ok(reservationService.bookSeat(request));
    }

    // Get reservations by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Reservation>> getUserReservations(@PathVariable Long userId) {
        return ResponseEntity.ok(reservationService.getUserReservations(userId));
    }

    // Get reservations by train
    @GetMapping("/train/{trainId}")
    public ResponseEntity<List<Reservation>> getTrainReservations(@PathVariable Long trainId) {
        return ResponseEntity.ok(reservationService.getTrainReservations(trainId));
    }

    // Cancel reservation
    @PutMapping("/cancel/{id}")
    public ResponseEntity<String> cancelReservation(@PathVariable Long id) {
        reservationService.cancelReservation(id);
        return ResponseEntity.ok("Reservation cancelled");
    }

    // Confirm payment
    @PutMapping("/confirm/{reservationId}")
    public ResponseEntity<Reservation> confirmPayment(@PathVariable Long reservationId) {
        return ResponseEntity.ok(reservationService.confirmPayment(reservationId));
    }
}
