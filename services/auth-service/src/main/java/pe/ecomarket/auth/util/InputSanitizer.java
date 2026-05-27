package pe.ecomarket.auth.util;

import org.springframework.stereotype.Component;

/**
 * Sanitización estricta de entradas antes de persistencia o consultas.
 */
@Component
public class InputSanitizer {

    public String sanitizeEmail(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase()
                .replaceAll("[^a-zA-Z0-9@._+-]", "")
                .substring(0, Math.min(email.length(), 255));
    }

    public String sanitizeText(String input, int maxLen) {
        if (input == null) return "";
        return input.trim()
                .replaceAll("[<>\"'`;]", "")
                .substring(0, Math.min(input.length(), maxLen));
    }
}
