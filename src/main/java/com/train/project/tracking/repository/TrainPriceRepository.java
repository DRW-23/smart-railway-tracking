package com.train.project.tracking.repository;

import com.train.project.tracking.model.TrainPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalTime;
import java.util.List;

public interface TrainPriceRepository extends JpaRepository<TrainPrice, Long> {
    List<TrainPrice> findByNameOrderByDepartTimeAsc(String name);
    List<TrainPrice> findByDepartTime(LocalTime departTime);
}
