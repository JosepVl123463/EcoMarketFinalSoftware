package pe.ecomarket.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.ecomarket.auth.model.User;
import pe.ecomarket.auth.repository.UserRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Credenciales fijas del administrador principal
    private static final String ADMIN_EMAIL    = "admin@ecomarket.pe";
    private static final String ADMIN_PASSWORD = "Admin123";
    private static final String ADMIN_NAME     = "Administrador Principal";

    @Override
    public void run(ApplicationArguments args) {
        upsertAdmin();
    }

    private void upsertAdmin() {
        String hash = passwordEncoder.encode(ADMIN_PASSWORD);

        userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(
            existing -> {
                existing.setProviderId(hash);
                existing.setRole("admin");
                existing.setFullName(ADMIN_NAME);
                userRepository.save(existing);
                log.info("=== ADMIN ACTUALIZADO === email: {} | password: {}", ADMIN_EMAIL, ADMIN_PASSWORD);
            },
            () -> {
                var admin = User.builder()
                        .email(ADMIN_EMAIL)
                        .fullName(ADMIN_NAME)
                        .provider("email")
                        .providerId(hash)
                        .role("admin")
                        .ecoScore(999)
                        .build();
                userRepository.save(admin);
                log.info("=== ADMIN CREADO === email: {} | password: {}", ADMIN_EMAIL, ADMIN_PASSWORD);
            }
        );
    }
}
