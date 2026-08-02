package pe.ecomarket.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {
    @NotEmpty(message = "La orden debe tener al menos un producto")
    @Valid
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        @NotBlank(message = "El identificador del producto es obligatorio")
        private String productId;

        // La cantidad debe ser un entero positivo. Antes se admitían cantidades
        // negativas, que eludían la comprobación de stock e incrementaban el
        // inventario, además de generar totales negativos.
        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        private Integer quantity;
    }
}
