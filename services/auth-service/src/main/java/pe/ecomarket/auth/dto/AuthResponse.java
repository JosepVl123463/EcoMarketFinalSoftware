package pe.ecomarket.auth.dto;

import lombok.Builder;
import lombok.Data;

/** Response body for login and register */
@Data
@Builder
public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String fullName;
    private String role;
    private Integer ecoScore;
}
