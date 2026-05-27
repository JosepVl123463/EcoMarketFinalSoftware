package pe.ecomarket.product.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
     * POST /api/orders/{orderId}/confirm — confirm payment (webhook callback).
     */
    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<?> confirmPayment(@PathVariable UUID orderId) {
        orderService.confirmPayment(orderId);
        return ResponseEntity.ok(Map.of("status", "paid", "orderId", orderId.toString()));
    }

    /**
     * GET /api/orders/customer/{customerId} — get order history.
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable UUID customerId) {
        return ResponseEntity.ok(orderService.getCustomerOrders(customerId));
    }
}
