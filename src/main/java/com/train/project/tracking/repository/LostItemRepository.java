package com.train.project.tracking.repository;

import com.train.project.tracking.model.LostItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface LostItemRepository extends JpaRepository<LostItem, Long> {
	// Find items whose reportedAt is older than a cutoff
	List<LostItem> findByReportedAtBefore(LocalDateTime cutoff);
}