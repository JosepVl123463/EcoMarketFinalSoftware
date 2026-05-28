package pe.ecomarket.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Valida tokens de Cloudflare Turnstile contra la API de siteverify.
 * Clave de test (siempre pasa): 1x0000000000000000000000000000000AA
 * En producción, configurar TURNSTILE_SECRET_KEY en variables de entorno.
 */
@Service
@Slf4j
public class TurnstileService {

    @Value("${turnstile.secret-key}")
    private String secretKey;

    @Value("${turnstile.verify-url}")
    private String verifyUrl;

    private final RestClient restClient;

    public TurnstileService() {
        this.restClient = RestClient.create();
    }

    public boolean verify(String token, String clientIp) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secretKey);
            body.add("response", token);
            if (clientIp != null && !clientIp.isBlank()) {
                body.add("remoteip", clientIp);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> result = restClient.post()
                    .uri(verifyUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            return result != null && Boolean.TRUE.equals(result.get("success"));
        } catch (Exception e) {
            log.warn("Turnstile verification error: {}", e.getMessage());
            return false;
        }
    }
}
