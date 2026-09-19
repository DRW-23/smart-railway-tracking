package com.train.project.tracking.service;

import com.train.project.tracking.dto.ReservationRequest;
import com.train.project.tracking.model.Reservation;
import com.train.project.tracking.model.Train;
import com.train.project.tracking.model.User;
import com.train.project.tracking.repository.ReservationRepository;
import com.train.project.tracking.repository.TrainRepository;
import com.train.project.tracking.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepo;
    private final TrainRepository trainRepo;
    private final UserRepository userRepo;

    public ReservationService(ReservationRepository reservationRepo,
                              TrainRepository trainRepo,
                              UserRepository userRepo) {
        this.reservationRepo = reservationRepo;
        this.trainRepo = trainRepo;
        this.userRepo = userRepo;
    }

    /**
     * Step 1: Check seat availability
     */
    public int checkAvailability(Long trainId, String travelDate, String trainClass) {
        Train train = trainRepo.findById(trainId).orElseThrow();

        // Count already booked seats
        int bookedSeats = reservationRepo.countBookedSeats(trainId,
                java.time.LocalDate.parse(travelDate),
                trainClass);

        return train.getTotalSeats() - bookedSeats;
    }

    /**
     * Step 2: Book seat(s) with departure, arrival, and amount
     */
    public Reservation bookSeat(ReservationRequest request) {
        Train train = trainRepo.findById(request.getTrainId())
                .orElseThrow(() -> new RuntimeException("Train not found with id: " + request.getTrainId()));

        User user = userRepo.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        // Check availability
        int available = checkAvailability(request.getTrainId(),
                request.getTravelDate(),
                request.getTrainClass());

        if (available < request.getPassengerCount()) {
            throw new RuntimeException("Not enough seats available!");
        }

        // Create new reservation
        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setTrain(train);
        reservation.setTravelDate(java.time.LocalDate.parse(request.getTravelDate()));
        reservation.setTrainClass(request.getTrainClass());
        reservation.setPassengerType(request.getPassengerType());
        reservation.setPassengerCount(request.getPassengerCount());
        reservation.setDeparture(request.getDeparture());
        reservation.setArrival(request.getArrival());
        reservation.setStatus("PENDING"); // Payment not done yet

        // ✅ Simple fare calculation (you can customize this logic)
        double baseFare = 500.0; // Example base fare
        double multiplier = "First".equalsIgnoreCase(request.getTrainClass()) ? 2.0 : 1.0;
        double totalAmount = baseFare * request.getPassengerCount() * multiplier;

        reservation.setAmount(totalAmount);

        return reservationRepo.save(reservation);
    }

    /**
     * Step 3: Confirm payment & issue ticket
     */
    public Reservation confirmPayment(Long reservationId) {
        Reservation res = reservationRepo.findById(reservationId).orElseThrow();
        res.setStatus("BOOKED"); // update to booked once paid
        return reservationRepo.save(res);
    }

    /**
     * Step 4: Cancel reservation
     */
    public void cancelReservation(Long reservationId) {
        Reservation res = reservationRepo.findById(reservationId).orElseThrow();
        res.setStatus("CANCELLED");
        reservationRepo.save(res);
    }

    /**
     * Extra: Get all reservations by user
     */
    public List<Reservation> getUserReservations(Long userId) {
        return reservationRepo.findByUserId(userId);
    }

    /**
     * Extra: Get all reservations for a train
     */
    public List<Reservation> getTrainReservations(Long trainId) {
        return reservationRepo.findByTrainId(trainId);
    }
}
