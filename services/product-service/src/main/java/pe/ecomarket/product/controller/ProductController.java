package pe.ecomarket.product.controller;

import jakarta.servlet.http.HttpServletRequest;
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
        // Acceso público: solo productos APROBADOS. Los productos PENDING/REJECTED
        // (que incluyen motivos de rechazo) no deben ser visibles sin autorización.
        return ResponseEntity.ok(productService.getPublicProductById(id));
    }

    /**
     * POST /api/products — create a new product (providers only).
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(
            HttpServletRequest httpRequest,
            @Valid @RequestBody CreateProductRequest request
    ) {
        // El proveedor se deriva SIEMPRE del usuario autenticado (JWT), nunca del
        // cuerpo de la petición: así un proveedor no puede publicar productos a
        // nombre de otro (suplantación).
        String userIdStr = (String) httpRequest.getAttribute("userId");
        if (userIdStr == null) {
            return ResponseEntity.status(401).build();
        }
        request.setProviderId(UUID.fromString(userIdStr));
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
