package pe.ecomarket.product.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pe.ecomarket.product.model.Product;
import pe.ecomarket.product.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the database with sample products on first startup.
 * Only runs if the products table is empty.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) return;

        var products = List.of(
            Product.builder().name("Shampoo Sólido de Verbena").description("Fórmula 100% natural sin sulfatos ni parabenos. Ideal para cabello graso y normal.")
                .price(new BigDecimal("14.50")).stock(50).category("Cuidado del Cabello").ecoScore(98).unit("80g").originName("Lima, Perú").build(),
            Product.builder().name("Proteína de Arveja Orgánica").description("Alta proteína vegetal certificada orgánica. 25g de proteína por porción.")
                .price(new BigDecimal("32.00")).stock(30).category("Alimentación").ecoScore(95).unit("500g").originName("Cusco, Perú").build(),
            Product.builder().name("Detergente Biodegradable").description("Limpieza efectiva con fórmula biodegradable al 100%. Compatible con aguas grises.")
                .price(new BigDecimal("18.90")).stock(100).category("Limpieza Hogar").ecoScore(92).unit("1L").originName("Arequipa, Perú").build(),
            Product.builder().name("Cepillo Bambú Moso").description("Cepillo de dientes de bambú certificado compostable. Cerdas de nylon reciclado.")
                .price(new BigDecimal("5.50")).stock(200).category("Higiene").ecoScore(99).unit("1 unidad").originName("Junín, Perú").build(),
            Product.builder().name("Aceite de Coco Virgen Extra").description("Extracción en frío, comercio justo certificado. Multi-uso: cocina, piel y cabello.")
                .price(new BigDecimal("22.00")).stock(60).category("Alimentación").ecoScore(96).unit("500ml").originName("San Martín, Perú").build(),
            Product.builder().name("Jabón de Avena Artesanal").description("Elaborado en frío con avena coloidal. Hidratante para piel sensible y atópica.")
                .price(new BigDecimal("8.90")).stock(150).category("Higiene").ecoScore(91).unit("120g").originName("Lima, Perú").build(),
            Product.builder().name("Bolsas Reutilizables Orgánicas").description("Set de 5 bolsas de algodón orgánico certificado GOTS. Lavables y duraderas.")
                .price(new BigDecimal("12.00")).stock(80).category("Hogar Eco").ecoScore(97).unit("Set x5").originName("Ica, Perú").build(),
            Product.builder().name("Té Verde Matcha Ceremonial").description("Grado ceremonial japonés, cultivo biológico. Antioxidante y energizante natural.")
                .price(new BigDecimal("38.00")).stock(40).category("Alimentación").ecoScore(94).unit("100g").originName("Importado - Japón").build(),
            Product.builder().name("Desodorante Natural de Coco").description("Sin aluminio ni parabenos. Protección 24h con ingredientes 100% naturales.")
                .price(new BigDecimal("16.50")).stock(75).category("Cuidado Personal").ecoScore(93).unit("60g").originName("Lima, Perú").build(),
            Product.builder().name("Pasta Dental de Carbón Activado").description("Blanqueamiento natural con carbón de cáscara de coco. Sin flúor añadido.")
                .price(new BigDecimal("11.00")).stock(120).category("Higiene").ecoScore(90).unit("100ml").originName("Cajamarca, Perú").build(),
            Product.builder().name("Miel de Abeja Orgánica").description("Miel cruda sin pasteurizar de apicultura regenerativa. Origen trazable.")
                .price(new BigDecimal("28.00")).stock(45).category("Alimentación").ecoScore(97).unit("500g").originName("Oxapampa, Perú").build(),
            Product.builder().name("Esponja Vegetal de Luffa").description("Cultivada sin pesticidas. 100% compostable al final de su vida útil.")
                .price(new BigDecimal("6.00")).stock(180).category("Hogar Eco").ecoScore(98).unit("1 unidad").originName("Lambayeque, Perú").build()
        );

        productRepository.saveAll(products);
        System.out.println("✅ DataSeeder: " + products.size() + " productos insertados en la base de datos.");
    }
}
