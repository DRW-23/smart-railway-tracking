package com.train.project.tracking.model;

import jakarta.persistence.*;
import java.time.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * TrainSchedule maps the UI modal fields to a persistent entity.
 * Fields captured in modal: name, route, depart/arrive times & cities,
 * trainClass, classDetails, availability, status text & kind.
 */
@Entity
@Table(name = "train_schedule")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrainSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 120, nullable = false)
    private String name;              // Train Name
    @Column(length = 200)
    private String route;             // Free-form route string (e.g., "Kandy – Colombo")

    @Column(name = "train_class", length = 40)
    private String trainClass;        // e.g. 1st, 2nd, 3rd
    @Column(name = "class_details", length = 250)
    private String classDetails;      // description / facilities
    @Column(name = "availability", length = 40)
    private String availability;      // Available | Limited | Full

    @Column(name = "depart_time", nullable = false)
    private LocalTime departTime;     // HH:mm (UI supplies time only)
    @Column(name = "depart_city", length = 100)
    private String departCity;

    @Column(name = "arrive_time", nullable = false)
    private LocalTime arriveTime;     // HH:mm
    @Column(name = "arrive_city", length = 100)
    private String arriveCity;

    @Column(name = "status_text", length = 80)
    private String statusText = "On Time"; // Display text
    @Column(name = "status_kind", length = 20)
    private String statusKind = "on";      // on | delayed | cancelled

    // Optional schedule date (if needed later); for now default today.
    @Column(name = "schedule_date")
    private LocalDate scheduleDate = LocalDate.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = updatedAt = Instant.now();
    }
    @PreUpdate
    void preUpdate() { updatedAt = Instant.now(); }

    // Getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }
    public String getTrainClass() { return trainClass; }
    public void setTrainClass(String trainClass) { this.trainClass = trainClass; }
    public String getClassDetails() { return classDetails; }
    public void setClassDetails(String classDetails) { this.classDetails = classDetails; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public LocalTime getDepartTime() { return departTime; }
    public void setDepartTime(LocalTime departTime) { this.departTime = departTime; }
    public String getDepartCity() { return departCity; }
    public void setDepartCity(String departCity) { this.departCity = departCity; }
    public LocalTime getArriveTime() { return arriveTime; }
    public void setArriveTime(LocalTime arriveTime) { this.arriveTime = arriveTime; }
    public String getArriveCity() { return arriveCity; }
    public void setArriveCity(String arriveCity) { this.arriveCity = arriveCity; }
    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }
    public String getStatusKind() { return statusKind; }
    public void setStatusKind(String statusKind) { this.statusKind = statusKind; }
    public LocalDate getScheduleDate() { return scheduleDate; }
    public void setScheduleDate(LocalDate scheduleDate) { this.scheduleDate = scheduleDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
