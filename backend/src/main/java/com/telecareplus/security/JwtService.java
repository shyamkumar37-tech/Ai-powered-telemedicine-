package com.telecareplus.security;

import java.security.Key;
import java.util.Base64;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.telecareplus.config.AppProperties;
import com.telecareplus.entity.enums.RoleType;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final AppProperties appProperties;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String generateToken(Long userId, String username, String role, Long profileId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + appProperties.getJwt().getExpirationMs());
        var builder = Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry);

        if (profileId != null) {
            builder.claim("profileId", profileId);
        }

        return builder.signWith((SecretKey) getKey()).compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object claim = parseClaims(token).get("userId");
        if (claim instanceof Number number) {
            return number.longValue();
        }
        if (claim instanceof String value && !value.isBlank()) {
            return Long.parseLong(value);
        }
        return null;
    }

    public Long extractProfileId(String token) {
        Object claim = parseClaims(token).get("profileId");
        if (claim instanceof Number number) {
            return number.longValue();
        }
        if (claim instanceof String value && !value.isBlank()) {
            return Long.parseLong(value);
        }
        return null;
    }

    public RoleType extractRole(String token) {
        Object claim = parseClaims(token).get("role");
        if (claim == null) {
            return null;
        }
        return RoleType.valueOf(claim.toString());
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith((SecretKey) getKey()).build().parseSignedClaims(token).getPayload();
    }

    private Key getKey() {
        byte[] keyBytes = Decoders.BASE64.decode(Base64.getEncoder().encodeToString(appProperties.getJwt().getSecret().getBytes()));
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
