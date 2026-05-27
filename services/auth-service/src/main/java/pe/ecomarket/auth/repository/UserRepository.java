package pe.ecomarket.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.ecomarket.auth.model.User;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO providers (user_id, business_name, ruc, direccion_fiscal, telefono_corporativo, email_empresarial, representante_legal, status) " +
                   "VALUES (:userId, :businessName, :ruc, :direccionFiscal, :telefonoCorporativo, :emailEmpresarial, :representanteLegal, :status)", 
           nativeQuery = true)
    void insertProvider(
        @Param("userId") UUID userId,
        @Param("businessName") String businessName,
        @Param("ruc") String ruc,
        @Param("direccionFiscal") String direccionFiscal,
        @Param("telefonoCorporativo") String telefonoCorporativo,
        @Param("emailEmpresarial") String emailEmpresarial,
        @Param("representanteLegal") String representanteLegal,
        @Param("status") String status
    );
}
