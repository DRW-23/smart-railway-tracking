package com.train.project.tracking.repository;

import com.train.project.tracking.model.TrainSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TrainScheduleRepository extends JpaRepository<TrainSchedule, Long> {
    List<TrainSchedule> findByScheduleDateOrderByDepartTimeAsc(LocalDate date);
}
