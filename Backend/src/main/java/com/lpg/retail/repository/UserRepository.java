package com.lpg.retail.repository;

import com.lpg.retail.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRole(User.Role role);

    List<User> findByActive(Boolean active);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from User e where e.userId = :id")
    java.util.Optional<User> lockById(@org.springframework.data.repository.query.Param("id") Long id);
}
