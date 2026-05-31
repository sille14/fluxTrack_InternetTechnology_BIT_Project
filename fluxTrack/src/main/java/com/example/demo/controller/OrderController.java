package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.business.OrderService;
import com.example.demo.data.domain.Order;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // Full list (role-scoped) — used by Reports page for client-side aggregation
    @GetMapping("/")
    public List<Order> getAllOrders(Authentication auth) {
        return orderService.getOrdersForUser(auth);
    }

    // Paginated list with search, date range, and partner filter — used by Order History page
    @GetMapping(path = "/page", produces = "application/json")
    public PagedResponse<Order> getOrdersPage(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) Long partner) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "orderDate"));
        Page<Order> result = orderService.getOrdersPaged(auth, search, dateFrom, dateTo, partner, pageable);
        return PagedResponse.from(result);
    }

    // Summary stats (count, units, revenue) matching the same filters as /page
    @GetMapping(path = "/summary", produces = "application/json")
    public OrderService.OrderSummary getOrdersSummary(
            Authentication auth,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) Long partner) {
        return orderService.getOrdersSummary(auth, search, dateFrom, dateTo, partner);
    }

    // Record-a-Sale: creates an order and deducts stock in one go
    @PostMapping(path = "/sale", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Order> recordSale(@RequestBody SaleRequest request, Authentication auth) {
        Order order = orderService.createOrderForSale(
            request.getProductID(),
            request.getQuantity(),
            auth
        );
        return ResponseEntity.ok(order);
    }

    // Request DTO for POST /order/sale
    public static class SaleRequest {
        private Long productID;
        private Integer quantity;
        public Long getProductID() { return productID; }
        public void setProductID(Long productID) { this.productID = productID; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}