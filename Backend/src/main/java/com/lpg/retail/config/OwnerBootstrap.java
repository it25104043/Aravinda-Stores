package com.lpg.retail.config;

import com.lpg.retail.entity.User;
import com.lpg.retail.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.bootstrap.enabled", havingValue = "true")
public class OwnerBootstrap implements CommandLineRunner {
    private final UserRepository users;
    private final BCryptPasswordEncoder encoder;
    
    @Value("${BOOTSTRAP_OWNER_EMAIL}")
    private String email;
    
    @Value("${BOOTSTRAP_OWNER_PASSWORD}")
    private String password;
    
    @Value("${BOOTSTRAP_OWNER_PHONE}")
    private String phone;

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() != 0)
            throw new IllegalStateException("Owner bootstrap requires an empty user table");
        if (password.length() < 12 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Invalid bootstrap password length");
        var u = new User();
        u.setFullName("Store Owner");
        u.setEmail(email.trim().toLowerCase(java.util.Locale.ROOT));
        u.setPhone(phone);
        u.setRole(User.Role.OWNER);
        u.setActive(true);
        u.setPasswordHash(encoder.encode(password));
        users.save(u);
    }
}
