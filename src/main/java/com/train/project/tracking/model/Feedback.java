package com.train.project.tracking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Long id;

    @Column(name = "passenger_id")
    private Long passengerId; // optional (nullable)

    @Column(name = "feedback_type")
    private String feedbackType; // FEEDBACK or COMPLAINT

    // We will store the title inside message first line if table lacks column; since table only shows message column we keep a synthetic title
    @Transient
    private String title; // not persisted directly (DB schema lacks a title column)

    @Column(name = "message", columnDefinition = "text")
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (feedbackType == null) feedbackType = "FEEDBACK";
        // Ensure passengerId never null to satisfy NOT NULL constraint in DB (fallback to 1)
        if (passengerId == null) passengerId = 1L;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPassengerId() { return passengerId; }
    public void setPassengerId(Long passengerId) { this.passengerId = passengerId; }
    public String getFeedbackType() { return feedbackType; }
    public void setFeedbackType(String feedbackType) { this.feedbackType = feedbackType; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
