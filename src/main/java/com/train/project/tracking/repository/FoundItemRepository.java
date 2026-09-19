package com.train.project.tracking.repository;

import com.train.project.tracking.model.FoundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface FoundItemRepository extends JpaRepository<FoundItem, Long> {
	List<FoundItem> findByFoundAtBefore(LocalDateTime cutoff);
}
