package pe.ecomarket.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "providers")
public class Provider {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "ruc", unique = true, nullable = false, length = 11)
    private String ruc;

    @Column(name = "verified")
    private Boolean verified;

    @Column(name = "eco_certified")
    private Boolean ecoCertified;

    @Column(name = "certification", columnDefinition = "jsonb")
    private String certification; // Storing as JSONB string

    @Column(name = "bank_account")
    private String bankAccount; // AES-256 cifrado

    @Column(name = "direccion_fiscal")
    private String fiscalAddress;

    @Column(name = "telefono_corporativo")
    private String corporatePhone;

    @Column(name = "email_empresarial", unique = true)
    private String corporateEmail;

    @Column(name = "representante_legal")
    private String legalRepresentativeName;

    @Column(name = "status")
    private String status; // 'PENDING', 'APPROVED', 'REJECTED'

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
