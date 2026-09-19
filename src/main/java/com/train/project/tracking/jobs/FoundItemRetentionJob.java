package com.train.project.tracking.jobs;

import com.train.project.tracking.model.FoundItem;
import com.train.project.tracking.repository.FoundItemRepository;
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
 * Purges found items (and images) older than retention window (15 days).
 */
@Component
public class FoundItemRetentionJob {
    private static final Logger log = LoggerFactory.getLogger(FoundItemRetentionJob.class);
    private static final int RETENTION_DAYS = 15;

    private final FoundItemRepository repository;
    public FoundItemRetentionJob(FoundItemRepository repository) { this.repository = repository; }

    @Scheduled(cron = "0 25 2 * * *") // run daily at 02:25
    @Transactional
    public void purgeOldFoundItems() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        List<FoundItem> old = repository.findByFoundAtBefore(cutoff);
        if (old.isEmpty()) return;
        for (FoundItem fi : old) {
            String imageUrl = fi.getImageUrl();
            if (imageUrl != null && imageUrl.startsWith("/uploads/found-items/")) {
                try {
                    Path path = Path.of(System.getProperty("user.dir"), imageUrl.substring(1));
                    Files.deleteIfExists(path);
                } catch (Exception ex) {
                    log.warn("Could not delete found item image {}: {}", imageUrl, ex.getMessage());
                }
            }
        }
        repository.deleteAll(old);
        log.info("Purged {} found items older than {} days (cutoff {}).", old.size(), RETENTION_DAYS, cutoff);
    }
}