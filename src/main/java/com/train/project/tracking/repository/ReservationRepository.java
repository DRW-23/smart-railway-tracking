package com.train.project.tracking.repository;

import com.train.project.tracking.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByTrainId(Long trainId);
    List<Reservation> findByUserId(Long userId);

    @Query("SELECT COUNT(r) FROM Reservation r " +
            "WHERE r.train.id = :trainId " +
            "AND r.travelDate = :travelDate " +
            "AND r.trainClass = :trainClass " +
            "AND r.status = 'BOOKED'")
    int countBookedSeats(@Param("trainId") Long trainId,
                         @Param("travelDate") LocalDate travelDate,
                         @Param("trainClass") String trainClass);
}


