package pe.ecomarket.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RegisterProducerRequest extends RegisterRequest {

    @NotBlank(message = "El RUC es obligatorio.")
    @Size(min = 11, max = 11, message = "El RUC debe tener 11 dígitos.")
    @Pattern(regexp = "^[0-9]+$", message = "El RUC debe contener solo números.")
    private String ruc;

    @NotBlank(message = "La razón social es obligatoria.")
    private String businessName;

    @NotBlank(message = "La dirección fiscal es obligatoria.")
    private String fiscalAddress;

    @NotBlank(message = "El teléfono corporativo es obligatorio.")
    private String corporatePhone;

    @NotBlank(message = "El email empresarial es obligatorio.")
    @Email(message = "El email empresarial debe ser válido.")
    private String corporateEmail;

    @NotBlank(message = "El nombre del representante legal es obligatorio.")
    private String legalRepresentativeName;
}
