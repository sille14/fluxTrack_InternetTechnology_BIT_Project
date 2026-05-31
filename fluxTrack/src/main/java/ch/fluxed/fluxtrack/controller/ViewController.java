package ch.fluxed.fluxtrack.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves Thymeleaf views. Auth happens client-side in JS using the JWT
 * stored in localStorage (acquired via POST /token).
 */
@Controller
public class ViewController {

    @GetMapping("/")
    public String root() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }

    @GetMapping("/products")
    public String products() {
        return "products";
    }

    @GetMapping("/partners")
    public String partners() {
        return "partners";
    }

    @GetMapping("/users")
    public String users() { 
        return "users"; 
    }

    @GetMapping("/orders")
    public String orders() {
        return "orders";
    }

    @GetMapping("/tickets")
    public String tickets() {
        return "tickets";
    }

    @GetMapping("/reports")
    public String reports() {
        return "reports";
    }
}