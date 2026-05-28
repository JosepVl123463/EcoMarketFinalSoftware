package pe.ecomarket.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
import pe.ecomarket.auth.service.TurnstileService;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final TurnstileService turnstileService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (!turnstileService.verify(request.getTurnstileToken(), resolveClientIp(httpRequest))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo."));
        }

        AuthResponse authResponse = authService.register(request);
        setAuthCookie(httpResponse, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register/producer")
    public ResponseEntity<?> registerProducer(
            @Valid @RequestBody RegisterProducerRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (!turnstileService.verify(request.getTurnstileToken(), resolveClientIp(httpRequest))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo."));
        }

        AuthResponse authResponse = authService.registerProducer(request);
        setAuthCookie(httpResponse, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (!turnstileService.verify(request.getTurnstileToken(), resolveClientIp(httpRequest))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo."));
        }

        AuthResponse authResponse = authService.login(request);
        setAuthCookie(httpResponse, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> body) {
        // Por seguridad devolvemos SIEMPRE el mismo mensaje,
        // sin revelar si el email existe o no en el sistema.
        String email = body.getOrDefault("email", "");
        if (!email.isBlank()) {
            userRepository.findByEmail(email).ifPresent(user -> {
                // TODO en producción: generar token, guardarlo y enviar email via notification-service
                log.info("Password reset requested for: {}", email);
            });
        }
        return ResponseEntity.ok(java.util.Map.of(
                "message", "Si existe una cuenta con ese email, recibirás las instrucciones en breve."
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        // Invalida la cookie limpiando su valor y poniendo maxAge=0
        ResponseCookie expiredCookie = ResponseCookie.from("eco_access_token", "")
                .httpOnly(true)
                .secure(isProduction())
                .sameSite(isProduction() ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
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
                // Mismo dominio en prod → SameSite=Strict; cross-origin en dev → Lax
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

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
