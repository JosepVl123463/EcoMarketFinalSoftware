package pe.ecomarket.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.ecomarket.product.model.OrderItem;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrderId(UUID orderId);
}
