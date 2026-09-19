package com.train.project.tracking.controller;

import com.train.project.tracking.model.Complaint;
import com.train.project.tracking.model.ComplaintReply;
import com.train.project.tracking.repository.ComplaintRepository;
import com.train.project.tracking.repository.ComplaintReplyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/")
public class ComplaintController {
    private static final Logger log = LoggerFactory.getLogger(ComplaintController.class);
    private final ComplaintRepository repo;
    private final ComplaintReplyRepository replyRepo;

    public ComplaintController(ComplaintRepository repo, ComplaintReplyRepository replyRepo) {
        this.repo = repo; this.replyRepo = replyRepo;
    }

    @GetMapping("/complaints")
    public ResponseEntity<?> list(@RequestParam(value = "status", required = false) String status,
                                  @RequestParam(value = "passengerId", required = false) Long passengerId) {
        try {
            List<Complaint> data;
            if (passengerId != null) {
                data = repo.findAllByPassengerIdOrderByCreatedAtDesc(passengerId);
            } else if (status != null && !status.isBlank()) {
                data = repo.findAllByStatusOrderByCreatedAtDesc(status.toUpperCase(Locale.ROOT));
            } else {
                data = repo.findAll();
                data.sort(Comparator.comparing(Complaint::getCreatedAt).reversed());
            }
            List<Map<String,Object>> items = new ArrayList<>();
            for (Complaint c : data) {
                items.add(Map.of(
                        "id", c.getId(),
                        "title", Optional.ofNullable(c.getTitle()).orElse(deriveTitle(c.getDescription())),
                        "description", c.getDescription(),
                        "status", c.getStatus(),
                        "createdAt", c.getCreatedAt().toString()
                ));
            }
            return ResponseEntity.ok(Map.of("items", items, "count", items.size()));
        } catch (Exception ex) {
            log.error("List complaints failed", ex);
            return ResponseEntity.status(500).body(Map.of("error", "List failed"));
        }
    }

    @PostMapping("/complaints")
    public ResponseEntity<?> create(@RequestBody Map<String,Object> body) {
        try {
        String title = Objects.toString(body.getOrDefault("title",""), "").trim();
        String description = Objects.toString(body.getOrDefault("description",""), "").trim();
            Long passengerId = toLong(body.get("passengerId"));
        if (title.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","Title required"));
        if (description.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","Description required"));
            if (passengerId == null) passengerId = 1L; // temporary until auth
            Complaint c = new Complaint();
        c.setTitle(title);
            c.setDescription(description);
            c.setPassengerId(passengerId);
            c.setStatus("PENDING");
            Complaint saved = repo.save(c);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "item", Map.of(
                            "id", saved.getId(),
                "title", Optional.ofNullable(saved.getTitle()).orElse(deriveTitle(saved.getDescription())),
                            "description", saved.getDescription(),
                            "status", saved.getStatus(),
                            "createdAt", saved.getCreatedAt().toString()
                    )
            ));
        } catch (Exception ex) {
            log.error("Create complaint failed", ex);
            return ResponseEntity.status(500).body(Map.of("error","Create failed"));
        }
    }

    @PatchMapping("/complaints/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String,Object> body) {
        try {
            String status = Objects.toString(body.getOrDefault("status",""),"").toUpperCase(Locale.ROOT);
            if (status.isBlank()) return ResponseEntity.badRequest().body(Map.of("error","Status required"));
            Complaint c = repo.findById(id).orElse(null);
            if (c == null) return ResponseEntity.status(404).body(Map.of("error","Not found"));
            c.setStatus(status);
            repo.save(c);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception ex) {
            log.error("Status update failed", ex);
            return ResponseEntity.status(500).body(Map.of("error","Status update failed"));
        }
    }

    // List replies for a complaint
    @GetMapping("/complaints/{id}/replies")
    public ResponseEntity<?> listReplies(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(404).body(Map.of("error","Complaint not found"));
        var replies = replyRepo.findByComplaint_IdOrderByCreatedAtAsc(id);
        List<Map<String,Object>> out = new ArrayList<>();
        for (ComplaintReply r : replies) {
            out.add(Map.of(
                    "id", r.getId(),
                    "authorRole", r.getAuthorRole(),
                    "message", r.getMessage(),
                    "createdAt", r.getCreatedAt().toString()
            ));
        }
        return ResponseEntity.ok(Map.of("items", out));
    }

    // Add a reply (train master or passenger). Expect body: { message, role }
    @PostMapping("/complaints/{id}/replies")
    public ResponseEntity<?> addReply(@PathVariable Long id, @RequestBody Map<String,Object> body) {
        Complaint c = repo.findById(id).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(Map.of("error","Complaint not found"));
        String message = Objects.toString(body.getOrDefault("message",""),"").trim();
        String role = Objects.toString(body.getOrDefault("role","MASTER"),"").trim().toUpperCase(Locale.ROOT);
        if (message.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","Message required"));
        if (role.isEmpty()) role = "MASTER";
        ComplaintReply reply = new ComplaintReply();
        reply.setComplaint(c);
        reply.setAuthorRole(role);
        reply.setMessage(message);
        ComplaintReply saved = replyRepo.save(reply);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "authorRole", saved.getAuthorRole(),
                "message", saved.getMessage(),
                "createdAt", saved.getCreatedAt().toString()
        ));
    }

    private Long toLong(Object o) {
        if (o instanceof Number n) return n.longValue();
        if (o instanceof String s && !s.isBlank()) { try { return Long.parseLong(s); } catch (Exception ignored) {} }
        return null;
    }

    private String deriveTitle(String description) {
        if (description == null || description.isBlank()) return "(No Title)";
        String firstLine = description.split("\n")[0].trim();
        if (firstLine.length() > 150) firstLine = firstLine.substring(0, 147) + "...";
        return firstLine.isEmpty() ? "(No Title)" : firstLine;
    }
}
