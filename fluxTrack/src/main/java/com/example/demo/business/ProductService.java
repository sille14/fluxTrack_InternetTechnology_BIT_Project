package com.example.demo.business;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.demo.data.domain.Product;
import com.example.demo.data.repository.ProductRepository;

/**
 * Product business logic — handles role-based filtering, ownership checks
 * on updates/deletes, and server-side pagination with search + stock filters.
 */
@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AppUserService appUserService;

    // UC 301: admins see everything, partners only see their own products
    public List<Product> getProductsForUser(Authentication auth) {
        if (auth == null) return List.of();
        String username = auth.getName();
        if (appUserService.isAdminUser(username)) {
            return productRepository.findAll();
        }
        Long partnerId = appUserService.getPartnerIdForUsername(username);
        if (partnerId == null) return List.of();
        return productRepository.findByProductPartnerID(partnerId);
    }

    public Long resolvePartnerIdForUser(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        if (appUserService.isAdminUser(username)) return null;
        return appUserService.getPartnerIdForUsername(username);
    }

    // UC 5: only the owning partner (or admin) can delete a product
    public boolean deleteProductForUser(Long productId, Authentication auth) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || auth == null) return false;

        String username = auth.getName();
        if (appUserService.isAdminUser(username)) {
            productRepository.deleteById(productId);
            return true;
        }

        Long callerPartnerId = appUserService.getPartnerIdForUsername(username);
        if (callerPartnerId == null) return false;
        if (!callerPartnerId.equals(product.getProductPartnerID())) return false;
        productRepository.deleteById(productId);
        return true;
    }

    // Ownership-protected update — same logic as delete: admin bypass, partner ownership check.
    // Also forces productPartnerID back to the caller's value to prevent reassignment.
    public Product updateProductForUser(Long id, Product updated, Authentication auth) {
        if (auth == null) return null;
        Product existing = productRepository.findById(id).orElse(null);
        if (existing == null) return null;

        String username = auth.getName();
        if (!appUserService.isAdminUser(username)) {
            Long callerPartnerId = appUserService.getPartnerIdForUsername(username);
            if (callerPartnerId == null) return null;
            if (!callerPartnerId.equals(existing.getProductPartnerID())) return null;
            updated.setProductPartnerID(callerPartnerId);
        }
        return updateProduct(id, updated);
    }

    // Server-side pagination with optional search (name/SKU) and stock filter
    public Page<Product> getProductsPaged(Authentication auth, String search, String filter, Long partnerFilter, Pageable pageable) {
        if (auth == null) return Page.empty(pageable);
        String username = auth.getName();

        Specification<Product> spec = (root, query, cb) -> cb.conjunction();

        // scope to partner's own products unless admin
        if (!appUserService.isAdminUser(username)) {
            Long partnerId = appUserService.getPartnerIdForUsername(username);
            if (partnerId == null) return Page.empty(pageable);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("productPartnerID"), partnerId));
        } else if (partnerFilter != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("productPartnerID"), partnerFilter));
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("productName")), pattern),
                cb.like(cb.lower(root.get("productSKU")), pattern)
            ));
        }

        if ("instock".equalsIgnoreCase(filter)) {
            spec = spec.and((root, query, cb) -> cb.greaterThan(root.get("productQuantity"), 0));
        } else if ("outofstock".equalsIgnoreCase(filter)) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("productQuantity"), 0));
        }

        return productRepository.findAll(spec, pageable);
    }

    // Validation

    private void validateProduct(Product product) {
        if (product == null) {
            throw new IllegalArgumentException("Product payload is required");
        }
        if (product.getProductPrice() != null && product.getProductPrice() < 0) {
            throw new IllegalArgumentException("Product price cannot be negative");
        }
        if (product.getProductQuantity() != null && product.getProductQuantity() < 0) {
            throw new IllegalArgumentException("Product quantity cannot be negative");
        }
    }

    // CRUD methods

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    public Product addProduct(Product product) {
        validateProduct(product);
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product updated) {
        Product existing = productRepository.findById(id).orElse(null);
        if (existing == null) return null;
        validateProduct(updated);
        existing.setProductName(updated.getProductName());
        existing.setProductSKU(updated.getProductSKU());
        existing.setProductPrice(updated.getProductPrice());
        existing.setProductQuantity(updated.getProductQuantity());
        if (updated.getProductPartnerID() != null) {
            existing.setProductPartnerID(updated.getProductPartnerID());
        }
        return productRepository.save(existing);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}