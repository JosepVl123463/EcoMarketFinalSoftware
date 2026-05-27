package pe.ecomarket.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.ecomarket.product.model.Order;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
