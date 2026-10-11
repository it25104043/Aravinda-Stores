package com.lpg.retail.config;

import com.lpg.retail.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.*;

@Component
public class JwtUtils {
    private final Key key;
    private final long ttl;

    public JwtUtils(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.ttl-seconds:1800}") long ttl) {
        byte[] bytes = Base64.getDecoder().decode(secret);
        if (bytes.length < 32)
            throw new IllegalArgumentException("JWT_SECRET must encode at least 32 random bytes");
        if (ttl < 60 || ttl > 86400)
            throw new IllegalArgumentException("Invalid JWT TTL");
        this.key = Keys.hmacShaKeyFor(bytes);
        this.ttl = ttl;
    }

    public long ttl() {
        return ttl;
    }

    public String generate(User u) {
        return Jwts.builder().setIssuer("aravinda-stores").setSubject(u.getUserId().toString())
                .claim("version", u.getTokenVersion()).setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ttl * 1000))
                .signWith(key, SignatureAlgorithm.HS256).compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder().requireIssuer("aravinda-stores").setSigningKey(key).build().parseClaimsJws(token)
                .getBody();
    }
}
