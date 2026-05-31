package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.business.ProductService;
import com.example.demo.data.domain.Product;

@RestController
@RequestMapping("/product")
public class ProductController {

    @Autowired
    private ProductService productService;

    // Full list (role-scoped) — used by Dashboard, Reports, Partners pages
    @GetMapping("/")
    public List<Product> getAllProducts(Authentication auth) {
        return productService.getProductsForUser(auth);
    }

    // Paginated list with search (name/SKU) and stock filter — used by Products page
    @GetMapping(path = "/page", produces = "application/json")
    public PagedResponse<Product> getProductsPage(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filter) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "productID"));
        Page<Product> result = productService.getProductsPaged(auth, search, filter, pageable);
        return PagedResponse.from(result);
    }

    @GetMapping(path = "/{id}", produces = "application/json")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id);
        }
        return ResponseEntity.ok(product);
    }

    @PostMapping(path = "/add", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Product> addProduct(@RequestBody Product product, Authentication auth) {
        // Partners can only create products under their own partnerID
        Long forcedPartnerId = productService.resolvePartnerIdForUser(auth);
        if (forcedPartnerId != null) {
            product.setProductPartnerID(forcedPartnerId);
        } else if (product.getProductPartnerID() == null) {
            product.setProductPartnerID(1L);
        }

        return ResponseEntity.ok(productService.addProduct(product));
    }

    // Ownership-protected: partners can only edit their own, admin can edit any
    @PutMapping(path = "/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestBody Product product,
            Authentication auth) {
        Product updated = productService.updateProductForUser(id, product, auth);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update this product");
    }

    // Ownership-protected delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id, Authentication auth) {
        boolean deleted = productService.deleteProductForUser(id, auth);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this product");
    }
}