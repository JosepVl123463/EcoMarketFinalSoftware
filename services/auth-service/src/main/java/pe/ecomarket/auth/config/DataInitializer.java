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

    @Override
    public void run(ApplicationArguments args) {
        upsertAdmin();
    }

    private void upsertAdmin() {
        String email    = "admin@ecomarket.pe";
        String password = "123456789";
        String hash     = passwordEncoder.encode(password);

        userRepository.findByEmail(email).ifPresentOrElse(
            existing -> {
                existing.setProviderId(hash);
                existing.setRole("admin");
                existing.setFullName("Administrador Principal");
                userRepository.save(existing);
                log.info("Admin actualizado: {} / {}", email, password);
            },
            () -> {
                var admin = User.builder()
                        .email(email)
                        .fullName("Administrador Principal")
                        .provider("email")
                        .providerId(hash)
                        .role("admin")
                        .ecoScore(999)
                        .build();
                userRepository.save(admin);
                log.info("Admin creado: {} / {}", email, password);
            }
        );
    }
}
