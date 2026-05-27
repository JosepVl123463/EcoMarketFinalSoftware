package pe.ecomarket.product.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.ecomarket.product.dto.AuditProductRequest;
import pe.ecomarket.product.dto.CreateProductRequest;
import pe.ecomarket.product.dto.UpdateProductRequest;
import pe.ecomarket.product.model.Product;
import pe.ecomarket.product.repository.ProductRepository;

import java.util.UUID;

/**
 * Business logic for product catalog operations.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final org.springframework.web.client.RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${services.audit.url:http://audit-service:8084}")
    private String auditServiceUrl;

    /**
     * Get paginated products with optional filters.
     * Only returns APPROVED products for public access.
     */
    public Page<Product> getProducts(String category, String search, Integer minEcoScore, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ecoScore"));

        // For public access, only APPROVED products are visible
        if (search != null && !search.isBlank()) {
            return productRepository.searchByNameAndStatus(search.trim(), "APPROVED", pageable);
        }
        if (category != null && !category.isBlank()) {
            return productRepository.findByCategoryAndStatus(category, "APPROVED", pageable);
        }
        if (minEcoScore != null) {
            return productRepository.findByMinEcoScoreAndStatus(minEcoScore, "APPROVED", pageable);
        }
        return productRepository.findByStatus("APPROVED", pageable);
    }

    /**
     * Get a single product by ID.
     */
    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + id));
    }

    /**
     * Atomically decrement stock after payment confirmation.
     */
    @Transactional
    public void decrementStock(UUID productId, int quantity) {
        var product = getProductById(productId);
        if (product.getStock() < quantity) {
            throw new IllegalStateException("Stock insuficiente para " + product.getName());
        }
        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
    }

    /**
     * Create a new product (for providers).
     */
    @Transactional
    public Product createProduct(CreateProductRequest request) {
        Product product = Product.builder()
                .providerId(request.getProviderId())
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .unit(request.getUnit())
                .category(request.getCategory())
                .ecoScore(request.getEcoScore())
                .images(request.getImages())
                .originLat(request.getOriginLat())
                .originLng(request.getOriginLng())
                .originName(request.getOriginName())
                .fechaProduccion(request.getFechaProduccion())
                .origenRegion(request.getOrigenRegion())
                .fechaVencimiento(request.getFechaVencimiento())
                .certificacionPdfUrl(request.getCertificacionPdfUrl())
                .status("PENDING") // New products start as PENDING for audit
                .build();

        Product saved = productRepository.save(product);
        // triggerAudit(saved); // Audit will be triggered by admin action
        return saved;
    }

    /**
     * Update an existing product.
     */
    @Transactional
    public Product updateProduct(UUID id, UpdateProductRequest request) {
        var existing = getProductById(id);

        if (request.getName() != null) existing.setName(request.getName());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getPrice() != null) existing.setPrice(request.getPrice());
        if (request.getStock() != null) existing.setStock(request.getStock());
        if (request.getUnit() != null) existing.setUnit(request.getUnit());
        if (request.getCategory() != null) existing.setCategory(request.getCategory());
        if (request.getEcoScore() != null) existing.setEcoScore(request.getEcoScore());
        if (request.getImages() != null) existing.setImages(request.getImages());
        if (request.getOriginLat() != null) existing.setOriginLat(request.getOriginLat());
        if (request.getOriginLng() != null) existing.setOriginLng(request.getOriginLng());
        if (request.getOriginName() != null) existing.setOriginName(request.getOriginName());
        if (request.getFechaProduccion() != null) existing.setFechaProduccion(request.getFechaProduccion());
        if (request.getOrigenRegion() != null) existing.setOrigenRegion(request.getOrigenRegion());
        if (request.getFechaVencimiento() != null) existing.setFechaVencimiento(request.getFechaVencimiento());
        if (request.getCertificacionPdfUrl() != null) existing.setCertificacionPdfUrl(request.getCertificacionPdfUrl());
        
        // Status and motivoRechazo are managed by audit process, not by product update
        
        Product saved = productRepository.save(existing);
        // triggerAudit(saved); // Audit will be triggered by admin action
        return saved;
    }

    /**
     * Audit a product (approve or reject).
     */
    @Transactional
    public Product auditProduct(UUID productId, AuditProductRequest auditRequest) {
        var product = getProductById(productId);

        product.setStatus(auditRequest.getStatus().name()); // Set status to APPROVED or REJECTED
        if (auditRequest.getStatus() == AuditProductRequest.AuditStatus.REJECTED) {
            if (auditRequest.getMotivoRechazo() == null || auditRequest.getMotivoRechazo().isBlank()) {
                throw new IllegalArgumentException("El motivo de rechazo es obligatorio cuando el producto es rechazado.");
            }
            product.setMotivoRechazo(auditRequest.getMotivoRechazo());
        } else {
            product.setMotivoRechazo(null); // Clear rejection reason if approved
        }

        Product saved = productRepository.save(product);
        // Here, you would typically interact with the audit-service to log the audit decision
        // and potentially generate a certificate if approved.
        // For now, we just update the product status.
        return saved;
    }

    // The original triggerAudit method is no longer directly used for product creation/update
    // as audit is now an explicit admin action.
    // private void triggerAudit(Product product) {
    //     try {
    //         var request = java.util.Map.of(
    //             "product_id", product.getId().toString(),
    //             "ingredients", java.util.List.of("Simulated Ingredient"), // In real, extract from description
    //             "provider_id", product.getProviderId() != null ? product.getProviderId().toString() : UUID.randomUUID().toString()
    //         );
    //         restTemplate.postForEntity(auditServiceUrl + "/api/audit/analyze", request, String.class);
    //     } catch (Exception e) {
    //         System.err.println("⚠️ Could not trigger audit: " + e.getMessage());
    //     }
    // }
}
