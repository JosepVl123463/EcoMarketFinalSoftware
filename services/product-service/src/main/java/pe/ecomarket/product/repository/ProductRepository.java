package pe.ecomarket.product.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.ecomarket.product.model.Product;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Page<Product> findByStatus(String status, Pageable pageable);

    Page<Product> findByCategoryAndStatus(String category, String status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.ecoScore >= :minScore")
    Page<Product> findByMinEcoScoreAndStatus(@Param("minScore") Integer minScore, @Param("status") String status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchByNameAndStatus(@Param("search") String search, @Param("status") String status, Pageable pageable);

    // Old methods, kept for reference or if still used elsewhere, but updated service uses new ones
    @Query("SELECT p FROM Product p WHERE p.status = 'active' AND p.ecoScore >= :minScore")
    Page<Product> findByMinEcoScore(@Param("minScore") Integer minScore, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = 'active' AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchByName(@Param("search") String search, Pageable pageable);
}
