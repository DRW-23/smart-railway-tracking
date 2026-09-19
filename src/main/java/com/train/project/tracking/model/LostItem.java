package com.train.project.tracking.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lost_items")
public class LostItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lost_id")
    private Long id;

    @Column(name = "passenger_id")
    private Long passengerId;           // who reported (optional)

    @Column(name = "train_number")
    private Integer trainNumber;        // optional

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "item_description", columnDefinition = "text")
    private String itemDescription;

    @Column(name = "location")
    private String location;

    @Column(name = "lost_date")
    private LocalDate lostDate;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "image_url")
    private String imageUrl;            // served by static handler

    @Column(name = "reported_at")
    private LocalDateTime reportedAt;

    @Column(name = "status")
    private String status;              // OPEN / FOUND / CLOSED

    @PrePersist
    public void onCreate() {
        if (reportedAt == null) reportedAt = LocalDateTime.now();
        if (status == null) status = "OPEN";
    }

    // getters/setters
    // ...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPassengerId() { return passengerId; }
    public void setPassengerId(Long passengerId) { this.passengerId = passengerId; }
    public Integer getTrainNumber() { return trainNumber; }
    public void setTrainNumber(Integer trainNumber) { this.trainNumber = trainNumber; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDate getLostDate() { return lostDate; }
    public void setLostDate(LocalDate lostDate) { this.lostDate = lostDate; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public LocalDateTime getReportedAt() { return reportedAt; }
    public void setReportedAt(LocalDateTime reportedAt) { this.reportedAt = reportedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}