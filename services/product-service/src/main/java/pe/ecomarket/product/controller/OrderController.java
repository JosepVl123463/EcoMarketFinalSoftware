package pe.ecomarket.product.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.ecomarket.product.dto.CreateOrderRequest;
import pe.ecomarket.product.model.Order;
import pe.ecomarket.product.service.OrderService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for order management.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "https://ecomarket.pe"})
public class OrderController {

    private final OrderService orderService;

    // Secreto compartido entre el servicio de pagos y este servicio para
    // autenticar la confirmación de pago. Sin valor por defecto: fail-fast.
    @Value("${INTERNAL_SERVICE_SECRET:}")
    private String internalSecret;

    /**
     * POST /api/orders — create a new order from cart items.
     * In production, customerId comes from the JWT token.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(
            HttpServletRequest request,
            @Valid @RequestBody CreateOrderRequest createRequest
    ) {
        String userIdStr = (String) request.getAttribute("userId");
        if (userIdStr == null) {
            return ResponseEntity.status(401).build();
        }
        UUID customerId = UUID.fromString(userIdStr);
        Order order = orderService.createOrder(customerId, createRequest);
        return ResponseEntity.ok(Map.of(
                "orderId", order.getId().toString(),
                "totalAmount", order.getTotalAmount(),
                "status", order.getStatus()
        ));
    }

    /**
     * POST /api/orders/{orderId}/confirm — confirmación de pago (llamada interna
     * desde payment-service). Se autentica con un secreto compartido en la
     * cabecera X-Internal-Secret; no es un endpoint público a pesar de estar
     * permitAll en la configuración de seguridad (que solo desactiva el JWT).
     */
    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<?> confirmPayment(
            @PathVariable UUID orderId,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secretHeader
    ) {
        if (internalSecret == null || internalSecret.isBlank()
                || secretHeader == null || !constantTimeEquals(internalSecret, secretHeader)) {
            return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
        }
        orderService.confirmPayment(orderId);
        return ResponseEntity.ok(Map.of("status", "paid", "orderId", orderId.toString()));
    }

    /**
     * GET /api/orders/{orderId} — consulta interna del pedido (usada por
     * payment-service para obtener el importe autoritativo y el dueño). Se
     * autentica con el secreto interno compartido; no es un endpoint de usuario.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderInternal(
            @PathVariable UUID orderId,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secretHeader
    ) {
        if (internalSecret == null || internalSecret.isBlank()
                || secretHeader == null || !constantTimeEquals(internalSecret, secretHeader)) {
            return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
        }
        return ResponseEntity.ok(orderService.getOrder(orderId));
    }

    /**
     * GET /api/orders/customer/{customerId} — historial de pedidos.
     * Solo se puede consultar el historial propio (o siendo administrador),
     * evitando el acceso a pedidos de otros usuarios (IDOR).
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getCustomerOrders(
            HttpServletRequest request,
            @PathVariable UUID customerId
    ) {
        String userIdStr = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        if (userIdStr == null) {
            return ResponseEntity.status(401).build();
        }
        boolean isAdmin = "admin".equalsIgnoreCase(role);
        if (!isAdmin && !userIdStr.equals(customerId.toString())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(orderService.getCustomerOrders(customerId));
    }

    private boolean constantTimeEquals(String a, String b) {
        return java.security.MessageDigest.isEqual(
                a.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                b.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
