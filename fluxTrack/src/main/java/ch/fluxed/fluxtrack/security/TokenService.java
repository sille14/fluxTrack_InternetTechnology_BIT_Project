package ch.fluxed.fluxtrack.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/** Generates signed JWT tokens for authenticated users. */
@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;

    public TokenService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateToken(Authentication authentication) {
        Instant now = Instant.now();

        // Build the JWT scope from non-role authorities. If none exist
        // (which is the case for our users), fall back to "READ" so the
        // token satisfies SecurityConfig's SCOPE_READ requirement.
        String scope = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(a -> !a.startsWith("ROLE") && !a.startsWith("FACTOR_"))
            .collect(Collectors.joining(" "));
        if (scope.isBlank()) {
            scope = "READ";
        }

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("self")
            .issuedAt(now)
            .expiresAt(now.plus(1, ChronoUnit.HOURS))
            .subject(authentication.getName())
            .claim("scope", scope)
            .build();

        var encoderParameters = JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS512).build(), claims);

        return this.jwtEncoder.encode(encoderParameters).getTokenValue();
    }
}