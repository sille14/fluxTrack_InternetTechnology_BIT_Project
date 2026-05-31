package ch.fluxed.fluxtrack.data.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import ch.fluxed.fluxtrack.data.domain.Order;

/** JpaSpecificationExecutor enables dynamic filtering + pagination in OrderService. */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByPartnerID(Long partnerID);
}