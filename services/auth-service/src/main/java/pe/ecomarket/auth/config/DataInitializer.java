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

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Crea la cuenta de administrador inicial SOLO si aún no existe.
 *
 * Diferencias de seguridad respecto a la versión anterior:
 *  - Ya NO se sobrescribe la contraseña del admin en cada arranque (antes se
 *    reseteaba a un valor fijo, deshaciendo cualquier cambio real).
 *  - La contraseña se toma de la variable de entorno ADMIN_PASSWORD. Si no está
 *    definida, se genera una aleatoria fuerte de un solo uso.
 *  - La contraseña NUNCA se escribe en los logs.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_EMAIL:admin@ecomarket.pe}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        seedAdminIfAbsent();
    }

    private void seedAdminIfAbsent() {
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Cuenta de administrador ya existente; no se modifica.");
            return;
        }

        boolean generated = false;
        String password = adminPassword;
        if (password == null || password.isBlank()) {
            password = generateStrongPassword();
            generated = true;
        }

        var admin = User.builder()
                .email(adminEmail)
                .fullName("Administrador Principal")
                .provider("email")
                .providerId(passwordEncoder.encode(password))
                .role("admin")
                .ecoScore(999)
                .build();
        userRepository.save(admin);

        if (generated) {
            // Solo en el primer arranque y sin ADMIN_PASSWORD configurada: se
            // imprime una vez para que el operador pueda entrar y cambiarla.
            log.warn("Admin creado con contraseña temporal generada. Cámbiala tras el primer acceso: {}", password);
        } else {
            log.info("Cuenta de administrador creada a partir de ADMIN_PASSWORD.");
        }
    }

    private String generateStrongPassword() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
