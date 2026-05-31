package com.example.demo.data.domain;

import jakarta.persistence.Embeddable;

/** Embeddable address used by the Partner entity. */
@Embeddable
public class Address {

    private String name;
    private String street;
    private String number;
    private Long zip;
    private String city;
    private String country;

    public Address() {}

    public Address(String name, String street, String number, Long zip, String city, String country) {
        this.name = name;
        this.street = street;
        this.number = number;
        this.zip = zip;
        this.city = city;
        this.country = country;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }

    public Long getZip() { return zip; }
    public void setZip(Long zip) { this.zip = zip; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}