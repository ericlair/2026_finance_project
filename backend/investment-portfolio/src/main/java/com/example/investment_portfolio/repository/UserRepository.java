package com.example.investment_portfolio.repository;

import com.example.investment_portfolio.entity.AuthProvider;
import com.example.investment_portfolio.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByEmail(String email);
}