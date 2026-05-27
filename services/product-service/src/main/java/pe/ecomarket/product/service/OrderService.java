package pe.ecomarket.product.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.ecomarket.product.dto.CreateOrderRequest;
import pe.ecomarket.product.model.Order;
import pe.ecomarket.product.model.OrderItem;
import pe.ecomarket.product.repository.OrderItemRepository;
import pe.ecomarket.product.repository.OrderRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Business logic for order creation and management.
 * Calculates totals, platform fees, and creates order items.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductService productService;

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.15"); // 15%

    /**
     * Create an order from the shopping cart.
     */
    @Transactional
    public Order createOrder(UUID customerId, CreateOrderRequest request) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();

        for (var itemReq : request.getItems()) {
            var product = productService.getProductById(UUID.fromString(itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                throw new IllegalStateException("Stock insuficiente para: " + product.getName());
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            items.add(OrderItem.builder()
                    .productId(product.getId())
                    .providerId(product.getProviderId())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build());
        }

        BigDecimal platformFee = totalAmount.multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP);

        var order = Order.builder()
                .customerId(customerId)
                .totalAmount(totalAmount)
                .platformFee(platformFee)
                .status("pending")
                .build();

        order = orderRepository.save(order);

        // Set orderId on all items and save
        for (var item : items) {
            item.setOrderId(order.getId());
        }
        orderItemRepository.saveAll(items);

        return order;
    }

    /**
     * Confirm payment: update order status, decrement stock.
     */
    @Transactional
    public void confirmPayment(UUID orderId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada: " + orderId));

        order.setStatus("paid");
        order.setPaidAt(java.time.OffsetDateTime.now());
        orderRepository.save(order);

        // Decrement stock for each item
        var items = orderItemRepository.findByOrderId(orderId);
        for (var item : items) {
            productService.decrementStock(item.getProductId(), item.getQuantity());
        }
    }

    public List<Order> getCustomerOrders(UUID customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }
}
