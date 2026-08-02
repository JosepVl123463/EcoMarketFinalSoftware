package pe.ecomarket.product.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        // Un token inválido/expirado/malformado NO debe provocar un error 500:
        // se ignora silenciosamente y la petición continúa sin autenticar (los
        // endpoints protegidos responderán 401/403 por sí mismos).
        try {
            if (jwtUtil.isTokenValid(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
                final String userEmail = jwtUtil.extractEmail(jwt);
                final String userId = jwtUtil.extractUserId(jwt);
                final String role = jwtUtil.extractRole(jwt);

                // Se propaga el rol como autoridad de Spring Security (ROLE_ADMIN,
                // ROLE_PROVIDER, ROLE_CUSTOMER) para poder aplicar control de
                // acceso por rol (hasRole) en SecurityConfig.
                List<SimpleGrantedAuthority> authorities = (role != null && !role.isBlank())
                        ? List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                        : List.of();

                request.setAttribute("userId", userId);
                request.setAttribute("role", role);

                var authToken = new UsernamePasswordAuthenticationToken(userEmail, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception ignored) {
            // Token no confiable: se continúa como no autenticado.
        }

        filterChain.doFilter(request, response);
    }
}
