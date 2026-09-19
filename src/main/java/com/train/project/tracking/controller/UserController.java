package com.train.project.tracking.controller;

import com.train.project.tracking.model.User;
import com.train.project.tracking.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.train.project.tracking.service.OtpService;
import com.train.project.tracking.service.MailService;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserRepository userRepo;
    private final OtpService otpService;
    private final MailService mailService;
    @Value("${app.otp.dev-mode:false}")
    private boolean otpDevMode;

    public UserController(UserRepository userRepo, OtpService otpService, MailService mailService) {
        this.userRepo = userRepo; this.otpService = otpService; this.mailService = mailService;
    }

    /* =================== OTP FLOW =================== */
    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String,String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email required");
        }
        // If already exists as passenger or user -> reject to avoid account takeover
        if (userRepo.passengerExistsByEmail(email) || userRepo.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already registered");
        }
        String code = otpService.generateFor(email);
        try {
            mailService.sendOtp(email, code);
        } catch (RuntimeException ex) {
            if (otpDevMode) {
                // expose OTP only in dev mode for troubleshooting
                return ResponseEntity.status(HttpStatus.OK).body(Map.of(
                        "message","OTP generated (email send failed, dev mode)",
                        "otp", code
                ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send OTP email");
        }
        return ResponseEntity.ok(Map.of("message","OTP sent"));
    }

    @PostMapping("/register-with-otp")
    public ResponseEntity<?> registerUserWithOtp(@RequestBody Map<String,String> body) {
        String fullName = body.get("fullName");
        String email = body.get("email");
        String phone = body.get("contact");
        String role = body.getOrDefault("type","Passenger");
        String password = body.get("password");
        String otp = body.get("otp");

        if (fullName == null || email == null || password == null || otp == null) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }
        if (!otpService.validate(email, otp)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired OTP");
        }
        // Re-use existing logic for passenger or user insertion
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhoneNumber(phone);
        user.setRole(role);
        user.setPassword(password);
        return registerUser(user);
    }

    // Register user (routes Passenger into passengers table)
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        log.info("Register request email={}, role={}, phone={}", user.getEmail(), user.getRole(), user.getPhoneNumber());

        // basic validation
        if (user.getEmail() == null || user.getPassword() == null || user.getFullName() == null) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        String role = user.getRole() == null ? "" : user.getRole().trim();

        try {
            if ("passenger".equalsIgnoreCase(role)) {
                if (userRepo.passengerExistsByEmail(user.getEmail())) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body("Passenger email already exists");
                }
                userRepo.insertPassenger(
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhoneNumber(),
                        user.getRole(),
                        user.getPassword()
                );
                return ResponseEntity.status(HttpStatus.CREATED).body("Passenger registered");
            }

            // Non-passenger -> save into users table
            if (userRepo.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("User email already exists");
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(userRepo.save(user));

        } catch (DataIntegrityViolationException ex) {
            log.error("DB constraint error", ex);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid data or duplicate");
        } catch (Exception ex) {
            log.error("Registration error", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Registration failed");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepo.findAll());
    }

    // Lightweight profile fetch by email (provided as header or query). In real app you'd use auth token.
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam(name = "email", required = false) String email,
                                            @RequestHeader(name = "X-User-Email", required = false) String headerEmail) {
        String target = (email != null ? email : headerEmail);
        if (target == null || target.isBlank()) {
            return ResponseEntity.badRequest().body("Email required");
        }
    try {
        // Try passenger first (reuse existing name query to avoid schema mismatch)
        if (userRepo.passengerExistsByEmail(target)) {
        String name = userRepo.getPassengerNameByEmail(target);
        String phone = null;
        try { phone = userRepo.getPassengerPhone(target); } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of(
            "email", target,
            "name", name,
            "phone", phone,
            "role", "passenger",
            "memberSince", ""
        ));
        }
        // Else user table
        return userRepo.findByEmail(target)
            .<ResponseEntity<?>>map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "email", u.getEmail(),
                "name", u.getFullName(),
                "phone", u.getPhoneNumber(),
                "role", u.getRole(),
                "memberSince", "")))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    } catch (Exception ex) {
        log.error("/users/me failed for email {}", target, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Profile lookup failed");
    }
    }

    // Optional: guard to make accidental GET /register return 405 with a clear message
    @GetMapping("/register")
    public ResponseEntity<String> registerGetNotAllowed() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body("Use POST /users/register");
    }

    // IMPORTANT: restrict {id} to digits so it won't catch 'register'
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
