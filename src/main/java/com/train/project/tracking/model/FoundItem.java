package com.train.project.tracking.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "found_items")
public class FoundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "found_id")
    private Long id;

    // Temporarily keep nullable to allow schema evolution if the column didn't exist yet or rows lack values.
    @Column(name = "title")
    private String title;

    @Column(name = "train_number")
    private Integer trainNumber;            // optional reference

    @Column(name = "item_description", columnDefinition = "text")
    private String itemDescription;        // detailed description

    @Column(name = "phone_number")
    private String phoneNumber;            // contact phone

    @Column(name = "image_url")
    private String imageUrl;               // stored path

    @Column(name = "found_date")
    private LocalDate foundDate;           // calendar date item was found

    @Column(name = "found_at")
    private LocalDateTime foundAt;

    @Column(name = "status")
    private String status; // e.g. OPEN / CLAIMED

    @PrePersist
    public void prePersist() {
        if (foundAt == null) foundAt = LocalDateTime.now();
        if (status == null) status = "OPEN";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getTrainNumber() { return trainNumber; }
    public void setTrainNumber(Integer trainNumber) { this.trainNumber = trainNumber; }
    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public LocalDate getFoundDate() { return foundDate; }
    public void setFoundDate(LocalDate foundDate) { this.foundDate = foundDate; }
    public LocalDateTime getFoundAt() { return foundAt; }
    public void setFoundAt(LocalDateTime foundAt) { this.foundAt = foundAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
