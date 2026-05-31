package ch.fluxed.fluxtrack.business;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import ch.fluxed.fluxtrack.data.domain.Order;
import ch.fluxed.fluxtrack.data.domain.Product;
import ch.fluxed.fluxtrack.data.repository.OrderRepository;
import ch.fluxed.fluxtrack.data.repository.ProductRepository;

/**
 * Order business logic — recording sales (stock deduction + order creation
 * in one go) and paginated/filtered order retrieval scoped by role.
 */
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AppUserService appUserService;

    // UC 304: admins see all orders, partners only see their own
    public List<Order> getOrdersForUser(Authentication auth) {
        if (auth == null) return List.of();
        String username = auth.getName();
        if (appUserService.isAdminUser(username)) {
            return orderRepository.findAll();
        }
        Long partnerId = appUserService.getPartnerIdForUsername(username);
        if (partnerId == null) return List.of();
        return orderRepository.findByPartnerID(partnerId);
    }

    // Record-a-Sale: validates stock, checks ownership, creates the order
    // and deducts quantity atomically
    public Order createOrderForSale(Long productId, Integer quantity, Authentication auth) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            throw new IllegalArgumentException("Product not found");
        }
        if (product.getProductQuantity() == null || product.getProductQuantity() < quantity) {
            throw new IllegalStateException("Not enough stock");
        }

        // partners can only sell their own products, admins can sell any
        if (auth != null) {
            String username = auth.getName();
            if (!appUserService.isAdminUser(username)) {
                Long callerPartnerId = appUserService.getPartnerIdForUsername(username);
                if (callerPartnerId == null
                    || !callerPartnerId.equals(product.getProductPartnerID())) {
                    throw new SecurityException("Cannot record sale for another partner's product");
                }
            }
        }

        Order order = new Order(
            product.getProductID(),
            product.getProductName(),
            product.getProductPartnerID(),
            quantity,
            product.getProductPrice() * quantity,
            LocalDateTime.now()
        );
        orderRepository.save(order);

        product.setProductQuantity(product.getProductQuantity() - quantity);
        productRepository.save(product);

        return order;
    }

    // Paginated order list with optional search, date range, and partner filter
    public Page<Order> getOrdersPaged(Authentication auth, String search, String dateFrom,
                                      String dateTo, Long partnerFilter, Pageable pageable) {
        Specification<Order> spec = buildOrderSpec(auth, search, dateFrom, dateTo, partnerFilter);
        if (spec == null) return Page.empty(pageable);
        return orderRepository.findAll(spec, pageable);
    }

    // Summary stats for the orders header (count, total units, total revenue)
    public OrderSummary getOrdersSummary(Authentication auth, String search, String dateFrom,
                                         String dateTo, Long partnerFilter) {
        Specification<Order> spec = buildOrderSpec(auth, search, dateFrom, dateTo, partnerFilter);
        if (spec == null) return new OrderSummary(0L, 0L, 0.0);

        List<Order> matching = orderRepository.findAll(spec);
        long count = matching.size();
        long totalUnits = matching.stream()
            .mapToLong(o -> o.getQuantity() != null ? o.getQuantity() : 0L)
            .sum();
        double totalRevenue = matching.stream()
            .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
            .sum();
        return new OrderSummary(count, totalUnits, totalRevenue);
    }

    // Builds a JPA Specification combining role scoping, text search, and date range
    private Specification<Order> buildOrderSpec(Authentication auth, String search, String dateFrom,
                                                String dateTo, Long partnerFilter) {
        if (auth == null) return null;
        String username = auth.getName();
        boolean isAdmin = appUserService.isAdminUser(username);

        Specification<Order> spec = (root, query, cb) -> cb.conjunction();

        if (!isAdmin) {
            Long partnerId = appUserService.getPartnerIdForUsername(username);
            if (partnerId == null) return null;
            spec = spec.and((root, query, cb) -> cb.equal(root.get("partnerID"), partnerId));
        } else if (partnerFilter != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("partnerID"), partnerFilter));
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                cb.like(cb.lower(root.get("productName")), pattern)
            );
        }

        if (dateFrom != null && !dateFrom.isBlank()) {
            LocalDateTime fromTime = LocalDate.parse(dateFrom).atStartOfDay();
            spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("orderDate"), fromTime)
            );
        }
        if (dateTo != null && !dateTo.isBlank()) {
            LocalDateTime toTime = LocalDate.parse(dateTo).atTime(23, 59, 59);
            spec = spec.and((root, query, cb) ->
                cb.lessThanOrEqualTo(root.get("orderDate"), toTime)
            );
        }

        return spec;
    }

    // Used by fluxTrackApplication.initTestData() to seed demo orders
    public Order seedOrder(Product product, Integer quantity, LocalDateTime when) {
        Order order = new Order(
            product.getProductID(),
            product.getProductName(),
            product.getProductPartnerID(),
            quantity,
            product.getProductPrice() * quantity,
            when
        );
        return orderRepository.save(order);
    }

    public record OrderSummary(long count, long totalUnits, double totalRevenue) {}
}