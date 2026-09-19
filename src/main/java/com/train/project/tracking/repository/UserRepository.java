package com.train.project.tracking.repository;

import com.train.project.tracking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    // For passenger login
    @Query(value = "SELECT password FROM passengers WHERE email = :email", nativeQuery = true)
    String getPassengerPasswordByEmail(@Param("email") String email);

    @Query(value = "SELECT full_name FROM passengers WHERE email = :email", nativeQuery = true)
    String getPassengerNameByEmail(@Param("email") String email);

    // Add this missing method
    @Query(value = "SELECT passenger_id FROM passengers WHERE email = :email", nativeQuery = true)
    Long getPassengerIdByEmail(@Param("email") String email);

    // Passenger profile auxiliary queries (phone may not exist depending on schema)
    @Query(value = "SELECT phone_number FROM passengers WHERE email = :email", nativeQuery = true)
    String getPassengerPhone(@Param("email") String email);

    // For passenger registration (used by UserController)
    @Query(value = "SELECT COUNT(1) > 0 FROM passengers WHERE email = :email", nativeQuery = true)
    boolean passengerExistsByEmail(@Param("email") String email);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO passengers (full_name, email, phone_number, role, password) " +
                   "VALUES (:fullName, :email, :phoneNumber, :role, :password)", nativeQuery = true)
    int insertPassenger(@Param("fullName") String fullName,
                        @Param("email") String email,
                        @Param("phoneNumber") String phoneNumber,
                        @Param("role") String role,
                        @Param("password") String password);
}
