package pe.ecomarket.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.ecomarket.auth.dto.AuthRequest;
import pe.ecomarket.auth.dto.AuthResponse;
import pe.ecomarket.auth.dto.RegisterProducerRequest;
import pe.ecomarket.auth.dto.RegisterRequest;
import pe.ecomarket.auth.model.Provider;
import pe.ecomarket.auth.model.User;
import pe.ecomarket.auth.repository.ProviderRepository;
import pe.ecomarket.auth.repository.UserRepository;
import pe.ecomarket.auth.security.JwtUtil;
import pe.ecomarket.auth.util.InputSanitizer;

/**
 * Core authentication service: register, login, and user lookup.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository; // Inyectar ProviderRepository
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final InputSanitizer inputSanitizer;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user with hashed password.
     * Throws if email already exists.
     */
    public AuthResponse register(RegisterRequest request) {
        var email = inputSanitizer.sanitizeEmail(request.getEmail());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("El email ya está registrado.");
        }

        var user = User.builder()
                .email(email)
                .fullName(inputSanitizer.sanitizeText(request.getFullName(), 255))
                .provider("email")
                .role(request.getRole() != null ? request.getRole() : "customer")
                .build();

        // Store hashed password in providerId field (adapter pattern for the existing schema)
        user.setProviderId(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        var token = jwtUtil.generateToken(user);
        return buildResponse(user, token);
    }

    /**
     * Register a new producer with corporate details.
     * Throws if email, RUC, or corporate email already exists.
     */
    public AuthResponse registerProducer(RegisterProducerRequest request) {
        // 1. Validate if user email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("El email de usuario ya está registrado.");
        }

        // 2. Validate if RUC already exists
        if (providerRepository.findByRuc(request.getRuc()).isPresent()) {
            throw new IllegalArgumentException("El RUC ya está registrado.");
        }

        // 3. Validate if corporate email already exists
        if (providerRepository.findByCorporateEmail(request.getCorporateEmail()).isPresent()) {
            throw new IllegalArgumentException("El email empresarial ya está registrado.");
        }

        // 4. Create User entity for the producer
        var user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .provider("email")
                .role("provider") // Set role as 'provider'
                .build();
        user.setProviderId(passwordEncoder.encode(request.getPassword())); // Store hashed password
        userRepository.save(user);

        // 5. Create Provider entity
        var provider = Provider.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .ruc(request.getRuc())
                .fiscalAddress(request.getFiscalAddress())
                .corporatePhone(request.getCorporatePhone())
                .corporateEmail(request.getCorporateEmail())
                .legalRepresentativeName(request.getLegalRepresentativeName())
                .status("PENDING") // Initial status for producers
                .verified(false)
                .ecoCertified(false)
                .build();
        providerRepository.save(provider);

        // 6. Generate token and build response
        var token = jwtUtil.generateToken(user);
        return buildResponse(user, token);
    }

    /**
     * Authenticate user and return JWT token.
     */
    public AuthResponse login(AuthRequest request) {
        var email = inputSanitizer.sanitizeEmail(request.getEmail());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        var token = jwtUtil.generateToken(user);
        return buildResponse(user, token);
    }

    private AuthResponse buildResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId().toString())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .ecoScore(user.getEcoScore())
                .build();
    }
}
