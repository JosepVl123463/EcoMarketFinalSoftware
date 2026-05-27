package pe.ecomarket.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotNull(message = "El ID del proveedor es obligatorio.")
    private UUID providerId;

    @NotBlank(message = "El nombre del producto es obligatorio.")
    @Size(max = 255, message = "El nombre del producto no puede exceder los 255 caracteres.")
    private String name;

    private String description;

    @NotNull(message = "El precio es obligatorio.")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor que cero.")
    private BigDecimal price;

    @NotNull(message = "El stock es obligatorio.")
    private Integer stock;

    private String unit;
    private String category;
    private Integer ecoScore;
    private String[] images;
    private BigDecimal originLat;
    private BigDecimal originLng;
    private String originName;

    // Campos de trazabilidad
    @NotNull(message = "La fecha de producción es obligatoria.")
    private LocalDate fechaProduccion;

    @NotBlank(message = "La región de origen es obligatoria.")
    private String origenRegion;

    private LocalDate fechaVencimiento;

    @NotBlank(message = "La URL del PDF de certificación es obligatoria.")
    private String certificacionPdfUrl;
}
