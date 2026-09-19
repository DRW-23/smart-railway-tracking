package com.train.project.tracking.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static class OtpRecord {
        final String code;
        final Instant expiresAt;
        OtpRecord(String code, Instant expiresAt) { this.code = code; this.expiresAt = expiresAt; }
        boolean expired() { return Instant.now().isAfter(expiresAt); }
    }

    private final Map<String, OtpRecord> store = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Value("${app.otp.length:6}")
    private int length;

    @Value("${app.otp.ttl-seconds:300}")
    private long ttlSeconds;

    public String generateFor(String email) {
        String code = randomCode(length);
        store.put(email.toLowerCase(), new OtpRecord(code, Instant.now().plusSeconds(ttlSeconds)));
        return code;
    }

    public boolean validate(String email, String code) {
        if (email == null || code == null) return false;
        OtpRecord rec = store.get(email.toLowerCase());
        if (rec == null) return false;
        if (rec.expired()) { store.remove(email.toLowerCase()); return false; }
        boolean ok = rec.code.equals(code.trim());
        if (ok) store.remove(email.toLowerCase()); // one-time use
        return ok;
    }

    private String randomCode(int len) {
        String digits = "0123456789"; // numeric only for SMS-style ease
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(digits.charAt(random.nextInt(digits.length())));
        }
        return sb.toString();
    }
}
