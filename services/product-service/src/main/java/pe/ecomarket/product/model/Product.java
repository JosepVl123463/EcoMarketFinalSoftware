package pe.ecomarket.product.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate; // Importar LocalDate
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Product entity — maps to the 'products' table in PostgreSQL.
 * Includes eco-certification data and origin traceability.
 */
@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "provider_id")
    private UUID providerId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer stock;

    private String unit;
    private String category;

    @Column(name = "eco_score")
    private Integer ecoScore;

    @Column(columnDefinition = "TEXT[]")
    private String[] images;

    @Column(name = "origin_lat", precision = 9, scale = 6)
    private BigDecimal originLat;

    @Column(name = "origin_lng", precision = 9, scale = 6)
    private BigDecimal originLng;

    @Column(name = "origin_name")
    private String originName;

    // Nuevos campos de trazabilidad
    @Column(name = "fecha_produccion")
    private LocalDate fechaProduccion;

    @Column(name = "origen_region")
    private String origenRegion;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @Column(name = "certificacion_pdf_url")
    private String certificacionPdfUrl;

    // Campo de estado de auditoría
    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'PENDING'") // Actualizado a PENDING por defecto
    private String status; // 'PENDING', 'APPROVED', 'REJECTED'

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (status == null) status = "PENDING"; // Asegurar que el estado inicial sea PENDING
        if (stock == null) stock = 0;
    }

    // Transient field for badges (computed from ingredients)
    @Transient
    private List<String> badges;
}
