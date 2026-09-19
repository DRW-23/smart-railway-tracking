package com.train.project.tracking.controller;

import com.train.project.tracking.model.TrainPrice;
import com.train.project.tracking.repository.TrainPriceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/train-prices")
@CrossOrigin(origins = "http://localhost:3000")
public class TrainPriceController {

    private final TrainPriceRepository repo;

    public TrainPriceController(TrainPriceRepository repo) {
        this.repo = repo; }

    @GetMapping
    public List<TrainPrice> list(@RequestParam(value = "train", required = false) String trainName) {
        if (trainName == null || trainName.isBlank()) {
            return repo.findAll();
        }
        return repo.findByNameOrderByDepartTimeAsc(trainName);
    }

    @PostMapping
    public ResponseEntity<TrainPrice> create(@RequestBody TrainPrice price) {
        TrainPrice saved = repo.save(price);
        return ResponseEntity.created(URI.create("/api/train-prices/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainPrice> update(@PathVariable Long id, @RequestBody TrainPrice incoming) {
        return repo.findById(id)
                .map(existing -> {
                    existing.setName(incoming.getName());
                    existing.setDepartTime(incoming.getDepartTime());
                    existing.setDepartCity(incoming.getDepartCity());
                    existing.setArriveTime(incoming.getArriveTime());
                    existing.setArriveCity(incoming.getArriveCity());
                    existing.setTrainClass(incoming.getTrainClass());
                    existing.setClassDetails(incoming.getClassDetails());
                    existing.setAvailability(incoming.getAvailability());
                    existing.setPriceLkr(incoming.getPriceLkr());
                    TrainPrice saved = repo.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
