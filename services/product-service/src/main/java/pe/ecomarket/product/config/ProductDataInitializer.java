package pe.ecomarket.product.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import pe.ecomarket.product.model.Product;
import pe.ecomarket.product.repository.ProductRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Siembra un catálogo inicial de productos APROBADOS si la tabla está vacía.
 *
 * Sin esto, la base de datos arranca sin productos y el frontend cae en su
 * catálogo simulado (MOCK_PRODUCTS con IDs ficticios), lo que impide crear
 * pedidos reales (el backend no encuentra esos IDs → el checkout falla).
 *
 * Se ejecuta una sola vez: si ya hay productos, no hace nada.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class ProductDataInitializer implements ApplicationRunner {

    private final ProductRepository productRepository;

    // Proveedor "EcoMarket" por defecto para el catálogo semilla.
    private static final UUID SEED_PROVIDER = UUID.fromString("00000000-0000-0000-0000-0000000000aa");

    @Override
    public void run(ApplicationArguments args) {
        if (productRepository.count() > 0) {
            log.info("Catálogo ya poblado ({} productos); no se siembra.", productRepository.count());
            return;
        }

        log.info("Base de datos de productos vacía: sembrando catálogo inicial...");

        seed("Shampoo Sólido de Verbena", "Fórmula 100% natural sin sulfatos ni parabenos.", "14.50", 50, "Cuidado Personal", 98, "/IMG/shampoo_solido.png", "Cusco, Perú");
        seed("Proteína de Arveja Orgánica", "Alta proteína vegetal certificada orgánica.", "32.00", 30, "Alimentación", 95, "/IMG/proteina_arveja.png", "Arequipa, Perú");
        seed("Detergente Biodegradable", "Limpieza efectiva con fórmula biodegradable al 100%.", "18.90", 100, "Limpieza Hogar", 92, "/IMG/detergente_bio.png", "Lima, Perú");
        seed("Cepillo Bambú Moso", "Cepillo de dientes de bambú certificado compostable.", "5.50", 200, "Cuidado Personal", 99, "/IMG/cepillo_bambu.png", "Junín, Perú");
        seed("Aceite de Coco Virgen", "Extracción en frío, comercio justo certificado.", "22.00", 60, "Alimentación", 96, "/IMG/aceite_coco.png", "San Martín, Perú");
        seed("Jabón de Avena Natural", "Hidratante y calmante para piel sensible.", "8.90", 150, "Cuidado Personal", 91, "/IMG/jabon_avena.png", "Lima, Perú");
        seed("Bolsas Reutilizables Orgánicas", "Bolsas de algodón orgánico certificado GOTS.", "12.00", 80, "Hogar Eco", 97, "/IMG/aceite_coco.png", "Ica, Perú");
        seed("Té Verde Matcha Ceremonial", "Grado ceremonial japonés, cultivo biológico.", "38.00", 40, "Alimentación", 94, "/IMG/proteina_arveja.png", "Cusco, Perú");
        seed("Desodorante Natural en Barra", "Desodorante orgánico libre de aluminio y plástico.", "16.90", 120, "Cuidado Personal", 97, "/IMG/desodorante_natural.png", "Lima, Perú");
        seed("Crema Facial Hidratante Aloe", "Crema hidratante de aloe vera biológico para el rostro.", "28.50", 75, "Cuidado Personal", 95, "/IMG/jabon_avena.png", "Arequipa, Perú");
        seed("Harina de Almendras Orgánica", "Harina fina de almendras orgánicas, ideal keto.", "24.00", 90, "Alimentación", 93, "/IMG/proteina_arveja.png", "Ica, Perú");
        seed("Esponja de Luffa Vegetal", "Esponja exfoliante 100% biodegradable.", "7.90", 110, "Hogar Eco", 100, "/IMG/cepillo_bambu.png", "Piura, Perú");

        log.info("Catálogo inicial sembrado: {} productos aprobados.", productRepository.count());
    }

    private void seed(String name, String desc, String price, int stock, String category, int ecoScore, String image, String region) {
        Product p = Product.builder()
                .providerId(SEED_PROVIDER)
                .name(name)
                .description(desc)
                .price(new BigDecimal(price))
                .stock(stock)
                .unit("unidad")
                .category(category)
                .ecoScore(ecoScore)
                .images(new String[]{image})
                .origenRegion(region)
                .fechaProduccion(LocalDate.now().minusMonths(2))
                .fechaVencimiento(LocalDate.now().plusYears(1))
                .certificacionPdfUrl("#")
                .status("APPROVED")
                .build();
        productRepository.save(p);
    }
}
