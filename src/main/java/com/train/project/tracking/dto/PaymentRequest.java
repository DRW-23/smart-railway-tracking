package com.train.project.tracking.dto;

public class PaymentRequest {
    private Long reservationId;
    private String cardholderName;
    private String cardNumber;
    private String expiryDate;
    private String cvv;
    private double amount;

    // Getters & setters
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }
    public String getCardholderName() { return cardholderName; }
    public void setCardholderName(String cardholderName) { this.cardholderName = cardholderName; }
    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }
    public String getCvv() { return cvv; }
    public void setCvv(String cvv) { this.cvv = cvv; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
}
