package com.train.project.tracking.controller;

import com.train.project.tracking.model.TrainSchedule;
import com.train.project.tracking.repository.TrainScheduleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/train-schedules")
@CrossOrigin(origins = "http://localhost:3000")
public class TrainScheduleController {

    private final TrainScheduleRepository repo;

    public TrainScheduleController(TrainScheduleRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<TrainSchedule> list(@RequestParam(value = "date", required = false) String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return repo.findAll();
        }
        LocalDate d = LocalDate.parse(dateStr);
        return repo.findByScheduleDateOrderByDepartTimeAsc(d);
    }

    @PostMapping
    public ResponseEntity<TrainSchedule> create(@RequestBody TrainSchedule schedule) {
        if (schedule.getScheduleDate() == null) {
            schedule.setScheduleDate(LocalDate.now());
        }
        TrainSchedule saved = repo.save(schedule);
        return ResponseEntity.created(URI.create("/api/train-schedules/" + saved.getId())).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainSchedule> update(@PathVariable Long id, @RequestBody TrainSchedule incoming) {
        return repo.findById(id)
                .map(existing -> {
                    // Update mutable fields
                    existing.setName(incoming.getName());
                    existing.setRoute(incoming.getRoute());
                    existing.setTrainClass(incoming.getTrainClass());
                    existing.setClassDetails(incoming.getClassDetails());
                    existing.setAvailability(incoming.getAvailability());
                    existing.setDepartTime(incoming.getDepartTime());
                    existing.setDepartCity(incoming.getDepartCity());
                    existing.setArriveTime(incoming.getArriveTime());
                    existing.setArriveCity(incoming.getArriveCity());
                    existing.setStatusText(incoming.getStatusText());
                    existing.setStatusKind(incoming.getStatusKind());
                    if (incoming.getScheduleDate() != null) {
                        existing.setScheduleDate(incoming.getScheduleDate());
                    }
                    TrainSchedule saved = repo.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
