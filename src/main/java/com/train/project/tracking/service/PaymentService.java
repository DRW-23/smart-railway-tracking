package com.train.project.tracking.service;

import com.train.project.tracking.dto.PaymentRequest;
import com.train.project.tracking.model.Payment;
import com.train.project.tracking.model.Reservation;
import com.train.project.tracking.repository.PaymentRepository;
import com.train.project.tracking.repository.ReservationRepository;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final ReservationRepository reservationRepo;

    public PaymentService(PaymentRepository paymentRepo, ReservationRepository reservationRepo) {
        this.paymentRepo = paymentRepo;
        this.reservationRepo = reservationRepo;
    }

    public Payment processPayment(PaymentRequest request) {
        Reservation reservation = reservationRepo.findById(request.getReservationId())
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        // Dummy card validation
        if (request.getCardNumber().length() != 16) {
            throw new RuntimeException("Invalid card number");
        }

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setCardholderName(request.getCardholderName());
        payment.setCardNumber(request.getCardNumber());
        payment.setExpiryDate(request.getExpiryDate());
        payment.setCvv(request.getCvv());
        payment.setAmount(request.getAmount());

        // Save payment
        Payment savedPayment = paymentRepo.save(payment);

        // Update reservation status to "PAID"
        reservation.setStatus("PAID");
        reservationRepo.save(reservation);

        return savedPayment;
    }
}
