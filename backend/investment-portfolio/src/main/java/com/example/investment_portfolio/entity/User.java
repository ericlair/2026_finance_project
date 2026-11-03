package com.example.investment_portfolio.entity;

import com.example.investment_portfolio.logic.InvestorType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * users 테이블 매핑 (소셜 로그인 전용).
 * password 컬럼은 나중에 자체 로그인을 붙일 때를 위해 DB에만 남겨 두고 여기서는 매핑하지 않는다.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", length = 20)
    private AuthProvider provider;

    @Column(name = "provider_id", length = 255)
    private String providerId;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "investor_type", length = 20)
    private InvestorType investorType;

    @Column(name = "preferred_engine", length = 10)
    private String preferredEngine;   // "ETF" / "STOCK" (DB CHECK 제약으로 보장)

    protected User() {
    }

    public static User create(AuthProvider provider, String providerId, String email, String name) {
        User u = new User();
        u.provider = provider;
        u.providerId = providerId;
        u.email = email;
        u.name = name;
        u.createdAt = LocalDateTime.now();
        return u;
    }

    public Long getId() { return id; }
    public AuthProvider getProvider() { return provider; }
    public String getProviderId() { return providerId; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getPreferredEngine() { return preferredEngine; }
    public InvestorType getInvestorType() { return investorType; }    public void updateInvestorProfile(InvestorType investorType, String preferredEngine) {
        this.investorType = investorType;
        this.preferredEngine = preferredEngine;
    }
}