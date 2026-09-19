package com.train.project.tracking.repository;

import com.train.project.tracking.model.ComplaintReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintReplyRepository extends JpaRepository<ComplaintReply, Long> {
    List<ComplaintReply> findByComplaint_IdOrderByCreatedAtAsc(Long complaintId);
}
