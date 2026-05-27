package pe.ecomarket.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.ecomarket.auth.model.Provider;

import java.util.Optional;
import java.util.UUID;

public interface ProviderRepository extends JpaRepository<Provider, UUID> {
    Optional<Provider> findByRuc(String ruc);
    Optional<Provider> findByCorporateEmail(String corporateEmail);
}
