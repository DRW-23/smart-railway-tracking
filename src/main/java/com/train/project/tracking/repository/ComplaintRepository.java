package com.train.project.tracking.repository;

import com.train.project.tracking.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByStatusOrderByCreatedAtDesc(String status);
    List<Complaint> findAllByPassengerIdOrderByCreatedAtDesc(Long passengerId);
}
