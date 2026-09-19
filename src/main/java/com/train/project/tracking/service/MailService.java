package com.train.project.tracking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String from;

    public MailService(JavaMailSender mailSender) { this.mailSender = mailSender; }

    public void sendOtp(String to, String code) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setFrom(from);
            msg.setSubject("Your Railway Portal OTP Code");
            msg.setText("Use this One-Time Password to complete your registration: " + code + "\n\n" +
                    "This code expires in a few minutes. If you did not request it, you can ignore this email.");
            mailSender.send(msg);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to {}", to, ex);
            throw new RuntimeException("Unable to send OTP email");
        }
    }
}
