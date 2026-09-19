package com.train.project.tracking.jobs;

import com.train.project.tracking.model.LostItem;
import com.train.project.tracking.repository.LostItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Purges lost items (and their stored images) that are older than 15 days.
 * Runs daily at 02:15 server time.
 */
@Component
public class LostItemRetentionJob {

    private static final Logger log = LoggerFactory.getLogger(LostItemRetentionJob.class);
    private static final int RETENTION_DAYS = 15; // configurable if needed

    private final LostItemRepository repository;

    public LostItemRetentionJob(LostItemRepository repository) { this.repository = repository; }

    @Scheduled(cron = "0 15 2 * * *")
    @Transactional
    public void purgeOldLostItems() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        List<LostItem> oldItems = repository.findByReportedAtBefore(cutoff);
        if (oldItems.isEmpty()) {
            return; // nothing to do silently
        }

        int count = oldItems.size();
        // Attempt to delete associated images
        for (LostItem li : oldItems) {
            String imageUrl = li.getImageUrl();
            if (imageUrl != null && imageUrl.startsWith("/uploads/lost-items/")) {
                try {
                    Path path = Path.of(System.getProperty("user.dir"), imageUrl.substring(1)); // strip leading slash
                    Files.deleteIfExists(path);
                } catch (Exception ex) {
                    log.warn("Failed deleting image for lost item id {}: {}", li.getId(), ex.getMessage());
                }
            }
        }

        repository.deleteAll(oldItems);
        log.info("Purged {} lost items older than {} days (cutoff: {}).", count, RETENTION_DAYS, cutoff);
    }
}