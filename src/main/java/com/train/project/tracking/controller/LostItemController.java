package com.train.project.tracking.controller;

import com.train.project.tracking.model.LostItem;
import com.train.project.tracking.repository.LostItemRepository;
import com.train.project.tracking.repository.UserRepository;
import com.train.project.tracking.repository.TrainRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/") // Remove /api to match frontend URL
@CrossOrigin(origins = "http://localhost:3000")
public class LostItemController {
    
    private static final Logger log = LoggerFactory.getLogger(LostItemController.class);
    private final LostItemRepository lostItemRepository;
    private final UserRepository userRepository;
    private final TrainRepository trainRepository;

    public LostItemController(LostItemRepository lostItemRepository, UserRepository userRepository, TrainRepository trainRepository) {
        this.lostItemRepository = lostItemRepository;
        this.userRepository = userRepository;
        this.trainRepository = trainRepository;
    }
    
    // Add this GET endpoint to fetch lost items
    @GetMapping("/lost-items")
    public ResponseEntity<?> getLostItems() {
        log.info("Fetching all lost items");
    List<LostItem> all = lostItemRepository.findAll().stream()
        .filter(li -> li.getItemName() != null && !li.getItemName().isBlank())
        .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of(
                "items", all,
                "message", "Lost items retrieved successfully"
        ));
    }
    
    // Handle multipart form data (with image upload)
    @PostMapping("/lost-items")
    public ResponseEntity<?> addLostItem(
            @RequestParam("itemName") String itemName,
            @RequestParam("description") String description,
            @RequestParam("location") String location,
            @RequestParam("phone") String phone,
            @RequestParam("lostDate") String lostDate,
            @RequestParam(value = "trainNumber", required = false) String trainNumber,
        @RequestParam(value = "passengerId", required = false) Long passengerId,
            @RequestParam(value = "passengerEmail", required = false) String passengerEmail,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        try {
            log.info("Received lost item: {}, {}, {}, {}", itemName, location, phone, lostDate);
            
            // Validate required fields
            if (itemName == null || itemName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Item name is required"));
            }
            // Map to entity and persist. Only map columns which exist in DB schema snapshot.
            LostItem entity = new LostItem();
            entity.setItemName(itemName);
            entity.setItemDescription(description);
            entity.setLocation(location);
            // Resolve passenger id: prefer provided id, else try email lookup
            Long resolvedPassengerId = passengerId;
            if (resolvedPassengerId == null && passengerEmail != null && !passengerEmail.isBlank()) {
                try {
                    resolvedPassengerId = userRepository.getPassengerIdByEmail(passengerEmail);
                } catch (Exception ex) {
                    log.warn("Unable to resolve passenger id from email {}: {}", passengerEmail, ex.getMessage());
                }
            }
            if (resolvedPassengerId != null) {
                entity.setPassengerId(resolvedPassengerId);
            }
            Integer tn = null;
            try {
                if (trainNumber != null && !trainNumber.isBlank()) {
                    tn = Integer.parseInt(trainNumber);
                }
            } catch (NumberFormatException ignored) {}
            // Avoid FK violation: only set train number if it exists in trains table
            if (tn != null) {
                boolean exists = false;
                try { exists = trainRepository.existsByTrainNumber(tn); } catch (Exception ignore) {}
                if (exists) {
                    entity.setTrainNumber(tn);
                } else {
                    log.warn("Train number {} does not exist; omitting to avoid FK violation", tn);
                    entity.setTrainNumber(null);
                }
            }

            // Handle image upload: save to /uploads/lost-items and set URL
            if (image != null && !image.isEmpty()) {
                try {
                    String original = image.getOriginalFilename();
                    String ext = ".jpg";
                    if (original != null && original.lastIndexOf('.') > -1) {
                        ext = original.substring(original.lastIndexOf('.'));
                    }
                    String filename = UUID.randomUUID() + ext;
                    Path dir = Paths.get(System.getProperty("user.dir"), "uploads", "lost-items");
                    Files.createDirectories(dir);
                    Path target = dir.resolve(filename);
                    image.transferTo(target.toFile());
                    entity.setImageUrl("/uploads/lost-items/" + filename);
                } catch (Exception ioEx) {
                    log.warn("Failed to store image, continuing without it: {}", ioEx.getMessage());
                }
            }
            // Persist lostDate and phone number (columns now exist)
            try { entity.setLostDate(LocalDate.parse(lostDate)); } catch (Exception ignored) {}
            entity.setPhoneNumber(phone);

        // If DB requires passenger_id and we could not resolve it, fail fast with 400
        try {
        LostItem saved = lostItemRepository.save(entity);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Lost item added successfully",
            "item", saved
        ));
        } catch (Exception persistEx) {
        log.error("Persist error saving lost item", persistEx);
        // Common cause: not-null constraint on passenger_id
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "error", "Unable to save lost item",
            "details", persistEx.getMessage(),
            "hint", "Ensure you're logged in and passenger id is known"
        ));
        }
            
        } catch (Exception e) {
            log.error("Error adding lost item", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error",
                "details", e.getMessage()
            ));
        }
    }
}