package com.lpg.retail.config;

import com.lpg.retail.repository.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.stereotype.Component;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import lombok.RequiredArgsConstructor;
import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtils jwt;
    private final UserRepository users;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                var c = jwt.parse(header.substring(7));
                var u = users.findById(Long.valueOf(c.getSubject())).orElse(null);
                if (u != null && Boolean.TRUE.equals(u.getActive())
                        && ((Number) c.get("version")).longValue() == u.getTokenVersion())
                    SecurityContextHolder.getContext()
                            .setAuthentication(new UsernamePasswordAuthenticationToken(u.getUserId().toString(), null,
                                    List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()))));
            } catch (io.jsonwebtoken.JwtException | IllegalArgumentException | NullPointerException
                    | ClassCastException e) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(req, res);
    }
}
