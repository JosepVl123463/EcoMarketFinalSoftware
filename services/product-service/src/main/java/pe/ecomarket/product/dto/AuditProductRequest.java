package pe.ecomarket.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditProductRequest {

    @NotNull(message = "El estado de auditoría es obligatorio.")
    private AuditStatus status; // APPROVED or REJECTED

    private String motivoRechazo; // Required if status is REJECTED

    public enum AuditStatus {
        APPROVED,
        REJECTED
    }
}
