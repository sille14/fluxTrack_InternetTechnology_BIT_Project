package com.example.demo.data.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "product_id", nullable = false)
    private Long productID;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_partner_id", nullable = false)
    private Long productPartnerID;

    @Column(name = "product_SKU", nullable = false, unique = true)
    private String productSKU;

    @Column(name = "product_price", nullable = false)
    private Double productPrice;

    @Column(name = "product_quantity", nullable = false)
    private Integer productQuantity;

    @ManyToOne
    @JoinColumn(name = "product_partner_id", insertable = false, updatable = false)
    private Partner partner;

    public Product() {}

    public Product(Long productID, String productName, Long productPartnerID,
                   String productSKU, Double productPrice, Integer productQuantity) {
        this.productID = productID;
        this.productName = productName;
        this.productPartnerID = productPartnerID;
        this.productSKU = productSKU;
        this.productPrice = productPrice;
        this.productQuantity = productQuantity;
    }

    public Long getProductID() { return productID; }
    public void setProductID(Long productID) { this.productID = productID; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Long getProductPartnerID() { return productPartnerID; }
    public void setProductPartnerID(Long productPartnerId) { this.productPartnerID = productPartnerId; }

    public String getProductSKU() { return productSKU; }
    public void setProductSKU(String productSKU) { this.productSKU = productSKU; }

    public Double getProductPrice() { return productPrice; }
    public void setProductPrice(Double productPrice) { this.productPrice = productPrice; }

    public Integer getProductQuantity() { return productQuantity; }
    public void setProductQuantity(Integer productQuantity) { this.productQuantity = productQuantity; }
}