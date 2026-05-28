package pe.ecomarket.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.ecomarket.auth.model.User;
import pe.ecomarket.auth.repository.UserRepository;

/**
 * Garantiza que el usuario administrador exista en la BD al arrancar el backend.
 * Si ya existe, actualiza la contraseña con el hash correcto.
 * Esto resuelve el problema de BDs ya inicializadas con hashes incorrectos.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:admin@ecomarket.pe}")
    private String adminEmail;

    @Value("${admin.password:123456789}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        upsertAdmin();
    }

    private void upsertAdmin() {
        String hashedPassword = passwordEncoder.encode(adminPassword);

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
            existing -> {
                existing.setProviderId(hashedPassword);
                existing.setRole("admin");
                existing.setFullName("Administrador Principal");
                userRepository.save(existing);
                log.info("Admin user updated: {}", adminEmail);
            },
            () -> {
                var admin = User.builder()
                        .email(adminEmail)
                        .fullName("Administrador Principal")
                        .provider("email")
                        .providerId(hashedPassword)
                        .role("admin")
                        .ecoScore(999)
                        .build();
                userRepository.save(admin);
                log.info("Admin user created: {}", adminEmail);
            }
        );
    }
}
