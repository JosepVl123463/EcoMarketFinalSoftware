package pe.ecomarket.product.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.ecomarket.product.dto.AuditProductRequest; // Importar el nuevo DTO
import pe.ecomarket.product.dto.CreateProductRequest; // Importar el nuevo DTO
import pe.ecomarket.product.dto.UpdateProductRequest; // Importar el nuevo DTO
import pe.ecomarket.product.model.Product;
import pe.ecomarket.product.service.ProductService;

import java.util.UUID;

/**
 * REST controller for product catalog operations.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "https://ecomarket.pe"})
public class ProductController {

    private final ProductService productService;

    /**
     * GET /api/products — paginated list with optional filters.
     */
    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minEcoScore,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(productService.getProducts(category, search, minEcoScore, page, size));
    }

    /**
     * GET /api/products/{id} — single product detail.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    /**
     * POST /api/products — create a new product (providers only).
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    /**
     * PUT /api/products/{id} — update an existing product.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    /**
     * PATCH /api/products/{id}/stock — decrement stock (internal, called after payment).
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> decrementStock(@PathVariable UUID id, @RequestParam int quantity) {
        productService.decrementStock(id, quantity);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/products/{id}/audit — audit a product (admin only).
     */
    @PostMapping("/{id}/audit")
    public ResponseEntity<Product> auditProduct(@PathVariable UUID id, @Valid @RequestBody AuditProductRequest request) {
        return ResponseEntity.ok(productService.auditProduct(id, request));
    }
}
