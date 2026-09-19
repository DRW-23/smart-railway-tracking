package com.train.project.tracking.repository;

import com.train.project.tracking.model.Train;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrainRepository extends JpaRepository<Train, Long> {
	// Some schemas use a business key 'train_number' on trains table; check by native query.
	@Query(value = "SELECT CASE WHEN COUNT(*)>0 THEN TRUE ELSE FALSE END FROM trains WHERE train_number = :num", nativeQuery = true)
	boolean existsByTrainNumber(@Param("num") Integer num);
}
