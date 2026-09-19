package com.train.project.tracking.controller;

import com.train.project.tracking.model.FoundItem;
import com.train.project.tracking.repository.FoundItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "http://localhost:3000")
public class FoundItemController {

    private static final Logger log = LoggerFactory.getLogger(FoundItemController.class);
    private final FoundItemRepository repo;

    public FoundItemController(FoundItemRepository repo) { this.repo = repo; }

    @GetMapping("/found-items")
    public ResponseEntity<?> list() {
        List<FoundItem> items = repo.findAll();
        return ResponseEntity.ok(Map.of("items", items));
    }

    @PostMapping("/found-items")
    public ResponseEntity<?> add(
            @RequestParam("itemName") String itemName,
            @RequestParam("description") String description,
            @RequestParam(value = "trainNumber", required = false) String trainNumber,
            @RequestParam(value = "foundDate", required = false) String foundDate,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        try {
            FoundItem fi = new FoundItem();
            fi.setTitle(itemName);
            fi.setItemDescription(description);
            fi.setPhoneNumber(phone);
            if (foundDate != null && !foundDate.isBlank()) {
                try { fi.setFoundDate(java.time.LocalDate.parse(foundDate)); } catch (Exception ignored) {}
            }
            try { if (trainNumber != null && !trainNumber.isBlank()) fi.setTrainNumber(Integer.parseInt(trainNumber)); } catch (NumberFormatException ignored) {}

            // Handle image
            if (image != null && !image.isEmpty()) {
                try {
                    String original = image.getOriginalFilename();
                    String ext = ".jpg";
                    if (original != null && original.lastIndexOf('.') > -1) ext = original.substring(original.lastIndexOf('.'));
                    String filename = UUID.randomUUID() + ext;
                    Path dir = Paths.get(System.getProperty("user.dir"), "uploads", "found-items");
                    Files.createDirectories(dir);
                    Path target = dir.resolve(filename);
                    image.transferTo(target.toFile());
                    fi.setImageUrl("/uploads/found-items/" + filename);
                } catch (Exception storeEx) {
                    log.warn("Failed storing found item image: {}", storeEx.getMessage());
                }
            }

            fi = repo.save(fi);

            return ResponseEntity.ok(Map.of("success", true, "item", fi));
        } catch (Exception e) {
            log.error("Add found item failed", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }
}
