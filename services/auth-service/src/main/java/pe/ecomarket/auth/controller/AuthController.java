package pe.ecomarket.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import pe.ecomarket.auth.dto.AuthRequest;
import pe.ecomarket.auth.dto.AuthResponse;
import pe.ecomarket.auth.dto.RegisterProducerRequest; // Importar el nuevo DTO
import pe.ecomarket.auth.dto.RegisterRequest;
import pe.ecomarket.auth.service.AuthService;

/**
 * REST controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Register a new user (customer or provider).
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * POST /api/auth/register/producer
     * Register a new producer with corporate details.
     */
    @PostMapping("/register/producer")
    public ResponseEntity<AuthResponse> registerProducer(@Valid @RequestBody RegisterProducerRequest request) {
        return ResponseEntity.ok(authService.registerProducer(request));
    }

    /**
     * POST /api/auth/login
     * Authenticate and receive a JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * GET /api/auth/me
     * Returns the authenticated user's info from the token.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userDetails.getUsername());
    }

    /**
     * POST /api/auth/google — OAuth Google (requiere GOOGLE_CLIENT_ID en producción).
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleAuth() {
        return ResponseEntity.status(501).body(java.util.Map.of(
            "error", "OAuth Google no configurado. Defina GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET."
        ));
    }
}
