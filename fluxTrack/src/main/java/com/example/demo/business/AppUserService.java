package com.example.demo.business;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.data.domain.AppUser;
import com.example.demo.data.repository.AppUserRepository;

/**
 * Handles user authentication and lookups. Implements Spring Security's
 * UserDetailsService so the DaoAuthenticationProvider picks it up automatically.
 */
@Service
public class AppUserService implements UserDetailsService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AppUserService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Spring Security hook — maps our AppUser entity to a Spring UserDetails object
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_PARTNER")); // every user needs this for POST /token
        if ("ADMIN".equals(user.getRole())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        return User.withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities(authorities)
                .build();
    }

    // CRUD operations

    public List<AppUser> getAllUsers() {
        return appUserRepository.findAll();
    }

    public AppUser findByUsername(String username) {
        return appUserRepository.findByUsername(username).orElse(null);
    }

    public AppUser findById(Long id) {
        return appUserRepository.findById(id).orElse(null);
    }

    public boolean existsByUsername(String username) {
        return appUserRepository.existsByUsername(username);
    }

    /** Creates a user with a raw password — BCrypt encoding happens here. */
    public AppUser seedUser(String username, String rawPassword, String role,
                            Long partnerID, String displayName, String logoPath) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setPartnerID(partnerID);
        user.setDisplayName(displayName);
        user.setLogoPath(logoPath);
        return appUserRepository.save(user);
    }

    public AppUser saveUser(AppUser user) {
        return appUserRepository.save(user);
    }

    public void deleteUser(Long id) {
        appUserRepository.deleteById(id);
    }

    // Shared helpers — used by ProductService, OrderService, SupportTicketService
    // to avoid duplicating username→role / username→partnerID logic

    public boolean isAdminUser(String username) {
        AppUser user = appUserRepository.findByUsername(username).orElse(null);
        return user != null && "ADMIN".equals(user.getRole());
    }

    public Long getPartnerIdForUsername(String username) {
        AppUser user = appUserRepository.findByUsername(username).orElse(null);
        return user != null ? user.getPartnerID() : null;
    }
}