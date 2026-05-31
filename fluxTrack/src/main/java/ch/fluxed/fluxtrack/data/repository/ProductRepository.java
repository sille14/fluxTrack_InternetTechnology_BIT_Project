package ch.fluxed.fluxtrack.data.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import ch.fluxed.fluxtrack.data.domain.Product;

/** JpaSpecificationExecutor enables dynamic filtering + pagination in ProductService. */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByProductPartnerID(Long productPartnerID);
}