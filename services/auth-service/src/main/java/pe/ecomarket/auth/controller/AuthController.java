package pe.ecomarket.auth.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import pe.ecomarket.auth.dto.AuthRequest;
import pe.ecomarket.auth.dto.AuthResponse;
import pe.ecomarket.auth.dto.RegisterProducerRequest;
import pe.ecomarket.auth.dto.RegisterRequest;
import pe.ecomarket.auth.repository.UserRepository;
import pe.ecomarket.auth.service.AuthService;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.register(request);
        setAuthCookie(httpResponse, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register/producer")
    public ResponseEntity<?> registerProducer(
            @Valid @RequestBody RegisterProducerRequest request,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.registerProducer(request);
        setAuthCookie(httpResponse, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.login(request);
        setAuthCookie(httpResponse, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "");
        if (!email.isBlank()) {
            userRepository.findByEmail(email).ifPresent(user ->
                log.info("Password reset requested for: {}", email)
            );
        }
        return ResponseEntity.ok(Map.of(
                "message", "Si existe una cuenta con ese email, recibirás las instrucciones en breve."
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        ResponseCookie expired = ResponseCookie.from("eco_access_token", "")
                .httpOnly(true)
                .secure(isProduction())
                .sameSite(isProduction() ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, expired.toString());
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada correctamente."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userDetails.getUsername());
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth() {
        return ResponseEntity.status(501).body(Map.of(
                "error", "OAuth Google no configurado. Defina GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET."
        ));
    }

    private void setAuthCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("eco_access_token", token)
                .httpOnly(true)
                .secure(isProduction())
                .sameSite(isProduction() ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ofHours(24))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private boolean isProduction() {
        String env = System.getenv("SPRING_PROFILES_ACTIVE");
        return env != null && env.contains("prod");
    }
}
