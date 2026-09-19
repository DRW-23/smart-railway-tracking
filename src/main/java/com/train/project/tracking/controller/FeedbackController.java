package com.train.project.tracking.controller;

import com.train.project.tracking.model.Feedback;
import com.train.project.tracking.repository.FeedbackRepository;
import org.slf4j.Logger;import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "http://localhost:3000")
public class FeedbackController {
    private static final Logger log = LoggerFactory.getLogger(FeedbackController.class);
    private final FeedbackRepository feedbackRepository;
    // Simple in-memory diagnostic holder for last error (not for production)
    private static volatile Map<String,Object> LAST_ERROR = null;
    public FeedbackController(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    @GetMapping("/feedback")
    public ResponseEntity<?> listFeedback(@RequestParam(value = "type", required = false) String type) {
        try {
            String t = (type == null || type.isBlank()) ? "FEEDBACK" : type.toUpperCase(Locale.ROOT);
            log.info("Listing feedback of type={} at {}", t, LocalDateTime.now());
            List<Feedback> data = feedbackRepository.findAllByFeedbackTypeOrderByCreatedAtDesc(t);
            List<Map<String,Object>> items = new ArrayList<>();
            for (Feedback f : data) {
                String msg = Optional.ofNullable(f.getMessage()).orElse("");
                String firstLine;
                if (msg.isBlank()) {
                    firstLine = "(no title)";
                } else if (msg.contains("\n")) {
                    firstLine = msg.substring(0, msg.indexOf('\n'));
                } else {
                    firstLine = msg.length() > 50 ? msg.substring(0,50) : msg;
                }
                String createdAtStr = Optional.ofNullable(f.getCreatedAt())
                        .map(Object::toString)
                        .orElse(LocalDateTime.now().toString());
                items.add(Map.of(
                        "id", f.getId(),
                        "title", firstLine,
                        "message", msg,
                        "type", Optional.ofNullable(f.getFeedbackType()).orElse("FEEDBACK"),
                        "createdAt", createdAtStr
                ));
            }
            return ResponseEntity.ok(Map.of("items", items, "count", items.size()));
        } catch (Exception ex) {
            log.error("Failed to list feedback", ex);
            LAST_ERROR = Map.of(
                "where","listFeedback",
                "exception", ex.getClass().getName(),
                "message", Optional.ofNullable(ex.getMessage()).orElse("(no message)"),
                "time", LocalDateTime.now().toString()
            );
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to list feedback",
                    "details", ex.getClass().getSimpleName() + ": " + ex.getMessage()
            ));
        }
    }

    @GetMapping("/feedback/health")
    public Map<String,Object> health() {
        return Map.of("status", "OK", "time", LocalDateTime.now().toString());
    }

    @PostMapping("/feedback")
    public ResponseEntity<?> createFeedback(@RequestBody Map<String,Object> body) {
        try {
            String title = Objects.toString(body.getOrDefault("title", ""), "").trim();
            String message = Objects.toString(body.getOrDefault("message", ""), "").trim();
            String type = Objects.toString(body.getOrDefault("type", "FEEDBACK"), "FEEDBACK").toUpperCase(Locale.ROOT);
            if (title.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","Title is required"));
            if (message.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","Message is required"));
            if (!("FEEDBACK".equals(type) || "COMPLAINT".equals(type))) {
                type = "FEEDBACK"; // sanitize unexpected type
            }
            // Resolve passengerId (DB has NOT NULL constraint). Accept passengerId or passenger_id or fallback to 1.
            Long passengerId = null;
            Object pidVal = body.get("passengerId");
            if (pidVal == null) pidVal = body.get("passenger_id");
            if (pidVal instanceof Number num) {
                passengerId = num.longValue();
            } else if (pidVal instanceof String str && !str.isBlank()) {
                try { passengerId = Long.parseLong(str.trim()); } catch (NumberFormatException ignored) {}
            }
            if (passengerId == null) {
                // TEMP fallback: use 1. Change later to real authenticated user id.
                passengerId = 1L;
            }
            Feedback f = new Feedback();
            // Persist title + message combined (title on first line) because DB lacks title column
            f.setMessage(title + "\n" + message);
            f.setFeedbackType(type);
            f.setCreatedAt(LocalDateTime.now());
            f.setPassengerId(passengerId);
            log.info("Creating feedback with passengerId={}", passengerId);
            Feedback saved = feedbackRepository.save(f);
            log.info("Saved feedback id={} type={}", saved.getId(), saved.getFeedbackType());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "item", Map.of(
                            "id", saved.getId(),
                            "title", title,
                            "message", message,
                            "type", saved.getFeedbackType(),
                            "createdAt", saved.getCreatedAt().toString()
                    )
            ));
        } catch (Exception ex) {
            log.error("Failed to create feedback", ex);
            LAST_ERROR = Map.of(
                "where","createFeedback",
                "exception", ex.getClass().getName(),
                "message", Optional.ofNullable(ex.getMessage()).orElse("(no message)"),
                "time", LocalDateTime.now().toString(),
                "body", body
            );
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Create failed",
                    "exception", ex.getClass().getName(),
                    "message", Optional.ofNullable(ex.getMessage()).orElse("(no message)"),
                    "hint", "If this is a NOT NULL constraint, check table definition for passenger_id"
            ));
        }
    }

    @GetMapping("/feedback/last-error")
    public ResponseEntity<?> lastError() {
        if (LAST_ERROR == null) return ResponseEntity.ok(Map.of("status","none"));
        return ResponseEntity.ok(LAST_ERROR);
    }
}
