package com.lpg.retail.config;

import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.cors.*;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import java.util.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    BCryptPasswordEncoder encoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    FilterRegistrationBean<JwtAuthFilter> disableServletRegistration(JwtAuthFilter filter) {
        var r = new FilterRegistrationBean<>(filter);
        r.setEnabled(false);
        return r;
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, JwtAuthFilter jwt, CorsConfigurationSource cors) throws Exception {
        return http.cors(c -> c.configurationSource(cors)).csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/login", "/api/users/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/{id}",
                                "/api/products/{id}/image", "/api/delivery-zones",
                                "/actuator/health")
                        .permitAll().requestMatchers("/api/reports/**", "/api/users/staff/**", "/api/drivers/**")
                        .hasRole("OWNER")
                        .requestMatchers("/api/delivery-zones/manage").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/delivery-zones").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/delivery-zones/**").hasRole("OWNER")
                        .requestMatchers("/api/inventory/**", "/api/sales/**").hasAnyRole("OWNER", "STORE_STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/products", "/api/products/{id}/image")
                        .hasAnyRole("OWNER", "STORE_STAFF")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAnyRole("OWNER", "STORE_STAFF")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAnyRole("OWNER", "STORE_STAFF")
                        .requestMatchers("/api/**").authenticated().anyRequest().denyAll())
                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"status\":401,\"message\":\"Sign in required\"}");
                }).accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(403);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"status\":403,\"message\":\"Permission denied\"}");
                })).addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class).build();
    }

    @Bean
    CorsConfigurationSource cors(@Value("${app.cors.origins}") String origins) {
        var c = new CorsConfiguration();
        var list = Arrays.stream(origins.split(",")).map(String::trim).toList();
        if (list.stream().anyMatch(x -> x.isBlank() || x.contains("*")))
            throw new IllegalArgumentException("Explicit CORS origins required");
        c.setAllowedOrigins(list);
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        c.setAllowCredentials(false);
        c.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", c);
        return source;
    }
}
