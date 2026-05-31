package ch.fluxed.fluxtrack.data.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ch.fluxed.fluxtrack.data.domain.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
}
