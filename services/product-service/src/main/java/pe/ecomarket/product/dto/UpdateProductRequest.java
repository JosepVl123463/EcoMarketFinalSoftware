package pe.ecomarket.product.dto;

import jakarta.validation.constraints.DecimalMin;
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
public class UpdateProductRequest {

    @Size(max = 255, message = "El nombre del producto no puede exceder los 255 caracteres.")
    private String name;

    private String description;

    @DecimalMin(value = "0.01", message = "El precio debe ser mayor que cero.")
    private BigDecimal price;

    private Integer stock;
    private String unit;
    private String category;
    private Integer ecoScore;
    private String[] images;
    private BigDecimal originLat;
    private BigDecimal originLng;
    private String originName;

    // Campos de trazabilidad
    private LocalDate fechaProduccion;
    private String origenRegion;
    private LocalDate fechaVencimiento;
    private String certificacionPdfUrl;
}
