package ch.fluxed.fluxtrack.data.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Represents a recorded sale. partnerID and productName are denormalized
 * so the order history stays readable even if a product is later deleted.
 */
@Entity
@Table(name = "orders") // "order" is a reserved SQL keyword
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "order_id", nullable = false)
    private Long orderID;

    @Column(name = "product_id", nullable = false)
    private Long productID;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "partner_id", nullable = false)
    private Long partnerID;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    public Order() {}

    public Order(Long productID, String productName, Long partnerID,
                 Integer quantity, Double totalAmount, LocalDateTime orderDate) {
        this.productID = productID;
        this.productName = productName;
        this.partnerID = partnerID;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.orderDate = orderDate;
    }

    public Long getOrderID() { return orderID; }
    public void setOrderID(Long orderID) { this.orderID = orderID; }

    public Long getProductID() { return productID; }
    public void setProductID(Long productID) { this.productID = productID; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Long getPartnerID() { return partnerID; }
    public void setPartnerID(Long partnerID) { this.partnerID = partnerID; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
}