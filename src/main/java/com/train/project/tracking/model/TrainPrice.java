package com.train.project.tracking.model;

import jakarta.persistence.*;
import java.time.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * TrainPrice represents a fare / price entry for a train service.
 * It can be linked to a schedule implicitly via train name + times (simple approach for now).
 * Future enhancement: add a FK to TrainSchedule when schedule IDs are stable for pricing logic.
 */
@Entity
@Table(name = "train_price")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrainPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 120, nullable = false)
    private String name; // Train name (mirrors schedule)

    @Column(name = "depart_time", nullable = false)
    private LocalTime departTime;   // HH:mm
    @Column(name = "depart_city", length = 100)
    private String departCity;

    @Column(name = "arrive_time", nullable = false)
    private LocalTime arriveTime;   // HH:mm
    @Column(name = "arrive_city", length = 100)
    private String arriveCity;

    @Column(name = "train_class", length = 40)
    private String trainClass;      // 1st / 2nd / 3rd etc.
    @Column(name = "class_details", length = 250)
    private String classDetails;    // AC Reclining Seats, etc.

    @Column(name = "availability", length = 40)
    private String availability;    // Optional textual availability (can diverge from schedule) or numeric later.

    @Column(name = "price_lkr")
    private Integer priceLkr;       // Price in LKR

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() { createdAt = updatedAt = Instant.now(); }
    @PreUpdate
    void preUpdate() { updatedAt = Instant.now(); }

    // Getters / setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalTime getDepartTime() { return departTime; }
    public void setDepartTime(LocalTime departTime) { this.departTime = departTime; }
    public String getDepartCity() { return departCity; }
    public void setDepartCity(String departCity) { this.departCity = departCity; }
    public LocalTime getArriveTime() { return arriveTime; }
    public void setArriveTime(LocalTime arriveTime) { this.arriveTime = arriveTime; }
    public String getArriveCity() { return arriveCity; }
    public void setArriveCity(String arriveCity) { this.arriveCity = arriveCity; }
    public String getTrainClass() { return trainClass; }
    public void setTrainClass(String trainClass) { this.trainClass = trainClass; }
    public String getClassDetails() { return classDetails; }
    public void setClassDetails(String classDetails) { this.classDetails = classDetails; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public Integer getPriceLkr() { return priceLkr; }
    public void setPriceLkr(Integer priceLkr) { this.priceLkr = priceLkr; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
