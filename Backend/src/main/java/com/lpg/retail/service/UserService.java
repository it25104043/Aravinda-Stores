package com.lpg.retail.service;

import com.lpg.retail.entity.User;
import com.lpg.retail.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(User user) {
        // TODO: Implement proper password hashing (BCrypt)
        user.setPasswordHash(hashPassword(user.getPasswordHash()));
        return userRepository.save(user);
    }

    public Optional<User> authenticateUser(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && verifyPassword(password, user.get().getPasswordHash())) {
            return user;
        }
        return Optional.empty();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        user.setFullName(userDetails.getFullName());
        user.setPhone(userDetails.getPhone());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        user.setActive(false);
        userRepository.save(user);
    }

    private String hashPassword(String password) {
        // TODO: Implement proper password hashing (BCrypt)
        return password;
    }

    private boolean verifyPassword(String password, String hash) {
        // TODO: Implement proper password verification
        return password.equals(hash);
    }
}