package pe.ecomarket.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting para endpoints de autenticación (anti fuerza bruta).
 * Usa Redis como almacén primario (persistente entre reinicios de la app).
 * Fallback en memoria si Redis no está disponible.
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final Duration LOCKOUT = Duration.ofMinutes(5);
    private static final String COUNT_PREFIX = "rl:count:";
    private static final String LOCK_PREFIX = "rl:lock:";

    // Redis inyectado de forma opcional: la app funciona sin Redis (fallback en memoria)
    @Autowired(required = false)
    private StringRedisTemplate redis;

    // Fallback en memoria cuando Redis no está disponible
    private final Map<String, Deque<Long>> memAttempts = new ConcurrentHashMap<>();
    private final Map<String, Long> memLockouts = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/register");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String clientKey = resolveClientKey(request);

        if (isLocked(clientKey)) {
            respond429(response, "Demasiados intentos. Intenta en 5 minutos.");
            return;
        }

        if (exceedsLimit(clientKey)) {
            lock(clientKey);
            respond429(response, "Límite de peticiones excedido. Bloqueo temporal activo.");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isLocked(String key) {
        if (redis != null) {
            try {
                return Boolean.TRUE.equals(redis.hasKey(LOCK_PREFIX + key));
            } catch (Exception e) {
                log.debug("Redis unavailable, using in-memory fallback");
            }
        }
        Long until = memLockouts.get(key);
        return until != null && System.currentTimeMillis() < until;
    }

    private boolean exceedsLimit(String key) {
        if (redis != null) {
            try {
                Long count = redis.opsForValue().increment(COUNT_PREFIX + key);
                if (count == 1) {
                    redis.expire(COUNT_PREFIX + key, WINDOW);
                }
                return count != null && count > MAX_ATTEMPTS;
            } catch (Exception e) {
                log.debug("Redis unavailable, using in-memory fallback");
            }
        }
        // In-memory fallback
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = memAttempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW.toMillis()) {
                timestamps.pollFirst();
            }
            timestamps.addLast(now);
            return timestamps.size() > MAX_ATTEMPTS;
        }
    }

    private void lock(String key) {
        if (redis != null) {
            try {
                redis.opsForValue().set(LOCK_PREFIX + key, "1", LOCKOUT);
                redis.delete(COUNT_PREFIX + key);
                return;
            } catch (Exception e) {
                log.debug("Redis unavailable, using in-memory fallback");
            }
        }
        memLockouts.put(key, System.currentTimeMillis() + LOCKOUT.toMillis());
        memAttempts.remove(key);
    }

    private void respond429(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
