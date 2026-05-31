package ch.fluxed.fluxtrack.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ch.fluxed.fluxtrack.business.AppUserService;
import ch.fluxed.fluxtrack.business.PartnerService;
import ch.fluxed.fluxtrack.data.domain.AppUser;
import ch.fluxed.fluxtrack.data.domain.Partner;

/**
 * User management endpoints. Profile lookup is open to all authenticated users;
 * CRUD and avatar management are admin-only.
 */
@RestController
public class UserController {

    private final AppUserService appUserService;
    private final PartnerService partnerService;
    private final PasswordEncoder passwordEncoder;

    public UserController(AppUserService appUserService,
                          PartnerService partnerService,
                          PasswordEncoder passwordEncoder) {
        this.appUserService = appUserService;
        this.partnerService = partnerService;
        this.passwordEncoder = passwordEncoder;
    }

    private boolean isAdmin(Authentication auth) {
        return appUserService.isAdminUser(auth.getName());
    }

    // Builds the JSON response for a user, enriching it with partner name and avatar URL
    private Map<String, Object> toDto(AppUser u) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", u.getId());
        dto.put("username", u.getUsername());
        dto.put("displayName", u.getDisplayName());
        dto.put("role", u.getRole());
        dto.put("partnerID", u.getPartnerID());
        dto.put("logoPath", u.getLogoPath());

        if (u.getPartnerID() != null) {
            Partner partner = partnerService.getPartnerById(u.getPartnerID());
            dto.put("partnerName", partner != null ? partner.getPartnerName() : null);
        } else {
            dto.put("partnerName", null);
        }

        if (u.getAvatar() != null && u.getAvatar().length > 0) {
            dto.put("avatarUrl", "/user/" + u.getId() + "/avatar");
        } else {
            dto.put("avatarUrl", u.getLogoPath());
        }

        return dto;
    }

    // Profile — any authenticated user can fetch their own profile
    @GetMapping("/user/profile")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication auth) {
        AppUser user = appUserService.findByUsername(auth.getName());
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(user));
    }

    // Admin-only CRUD

    @GetMapping("/user/")
    public ResponseEntity<?> getAllUsers(Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (AppUser u : appUserService.getAllUsers()) {
            result.add(toDto(u));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/user/add")
    public ResponseEntity<?> addUser(@RequestBody Map<String, Object> body,
                                     Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        String username = (String) body.get("username");
        String password = (String) body.get("password");
        String role     = (String) body.get("role");

        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required."));
        }
        if (password == null || password.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 4 characters."));
        }
        if (role == null || (!"ADMIN".equals(role) && !"PARTNER".equals(role))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role must be ADMIN or PARTNER."));
        }
        if (appUserService.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username '" + username + "' is already taken."));
        }

        Long partnerID = body.get("partnerID") != null
                ? ((Number) body.get("partnerID")).longValue()
                : null;

        if ("PARTNER".equals(role) && partnerID == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Partner users must be linked to a partner."));
        }

        String displayName = (String) body.getOrDefault("displayName", username);
        String logoPath    = (String) body.get("logoPath");

        AppUser user = appUserService.seedUser(username, password, role, partnerID, displayName, logoPath);
        return ResponseEntity.ok(toDto(user));
    }

    @PutMapping("/user/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody Map<String, Object> body,
                                        Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        AppUser user = appUserService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();

        String password = (String) body.get("password");
        if (password != null && !password.isBlank()) {
            if (password.length() < 4) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 4 characters."));
            }
            user.setPassword(passwordEncoder.encode(password));
        }

        String role = (String) body.get("role");
        if (role != null && ("ADMIN".equals(role) || "PARTNER".equals(role))) {
            user.setRole(role);
        }

        Long partnerID = body.get("partnerID") != null
                ? ((Number) body.get("partnerID")).longValue()
                : null;
        user.setPartnerID(partnerID);

        if ("PARTNER".equals(user.getRole()) && user.getPartnerID() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Partner users must be linked to a partner."));
        }

        String displayName = (String) body.get("displayName");
        if (displayName != null) user.setDisplayName(displayName);

        String logoPath = (String) body.get("logoPath");
        user.setLogoPath(logoPath);

        appUserService.saveUser(user);
        return ResponseEntity.ok(toDto(user));
    }

    @DeleteMapping("/user/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        AppUser user = appUserService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();

        // Safety checks: can't delete yourself or the last remaining admin
        if (user.getUsername().equals(auth.getName())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot delete your own account."));
        }
        if ("ADMIN".equals(user.getRole())) {
            long adminCount = appUserService.getAllUsers().stream()
                    .filter(u -> "ADMIN".equals(u.getRole()))
                    .count();
            if (adminCount <= 1) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete the last admin user."));
            }
        }

        appUserService.deleteUser(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    // Avatar endpoints

    @PostMapping("/user/{id}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable Long id,
                                          @RequestParam("file") MultipartFile file,
                                          Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        AppUser user = appUserService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed."));
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size must be under 2 MB."));
        }

        try {
            user.setAvatar(file.getBytes());
            user.setAvatarContentType(contentType);
            appUserService.saveUser(user);
            return ResponseEntity.ok(toDto(user));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save avatar."));
        }
    }

    // Serve avatar image — permitAll so <img> tags work without a token
    @GetMapping("/user/{id}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long id) {
        AppUser user = appUserService.findById(id);
        if (user == null || user.getAvatar() == null || user.getAvatar().length == 0) {
            return ResponseEntity.notFound().build();
        }
        String ct = user.getAvatarContentType() != null ? user.getAvatarContentType() : "image/png";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ct))
                .body(user.getAvatar());
    }

    @DeleteMapping("/user/{id}/avatar")
    public ResponseEntity<?> deleteAvatar(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        AppUser user = appUserService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();

        user.setAvatar(null);
        user.setAvatarContentType(null);
        appUserService.saveUser(user);
        return ResponseEntity.ok(toDto(user));
    }
}