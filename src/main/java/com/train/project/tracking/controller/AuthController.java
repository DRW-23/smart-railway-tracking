package com.train.project.tracking.controller;

import com.train.project.tracking.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserRepository userRepo;

    public AuthController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        log.info("Login attempt for email: {}", email);
        log.info("Full request payload: {}", request);

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Email and password required");
        }

        try {
            // 1) Try passengers table first
            String storedPassword = userRepo.getPassengerPasswordByEmail(email);
            if (storedPassword != null && storedPassword.equals(password)) {
                String name = userRepo.getPassengerNameByEmail(email);

                Map<String, Object> response = new HashMap<>();
                response.put("message", "Login successful");
                response.put("user", Map.of(
                    "email", email,
                    "name", name,
                    "role", "passenger"
                ));
                return ResponseEntity.ok(response);
            }

            // 2) Try users table (Train Master)
            var userOpt = userRepo.findByEmail(email);
            if (userOpt.isPresent()) {
                var user = userOpt.get();
                if (user.getPassword().equals(password)) {
                    String role = "trainmaster"; // or normalize from user.getRole()

                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Login successful");
                    response.put("user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "name", user.getFullName(),
                        "role", role
                    ));
                    return ResponseEntity.ok(response);
                }
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");

        } catch (Exception e) {
            log.error("Login error for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Login failed");
        }
    }
}
