package com.lpg.retail.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.*;

/**
 * Local bounded throttle; use a shared reverse-proxy limiter when deploying
 * multiple replicas.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private final Map<String, long[]> attempts = new LinkedHashMap<>();

    private synchronized boolean allowed(String address) {
        long now = System.currentTimeMillis();
        attempts.entrySet().removeIf(e -> now - e.getValue()[0] >= 60000);
        if (!attempts.containsKey(address) && attempts.size() >= 10000)
            return false;
        long[] count = attempts.computeIfAbsent(address, k -> new long[] { now, 0 });
        return ++count[1] <= 20;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if ("POST".equals(req.getMethod())
                && (req.getRequestURI().equals("/api/users/login") || req.getRequestURI().equals("/api/users/register")
                        || req.getRequestURI().equals("/api/users/me/change-password"))
                && !allowed(req.getRemoteAddr())) {
            res.setStatus(429);
            res.setHeader("Retry-After", "60");
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Too many attempts. Try again in one minute.\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
