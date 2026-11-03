package com.example.investment_portfolio.service;

import com.example.investment_portfolio.entity.User;
import com.example.investment_portfolio.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private static final String DEFAULT_NAME = "사용자";
    private static final int NAME_MAX = 50;
    private static final int EMAIL_MAX = 255;

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** 이미 가입한 사용자면 그대로, 처음이면 새로 저장한다. */
    @Transactional
    public User loginOrRegister(SocialProfile profile) {
        return userRepository.findByProviderAndProviderId(profile.provider(), profile.providerId())
                .orElseGet(() -> userRepository.save(User.create(
                        profile.provider(),
                        profile.providerId(),
                        usableEmail(profile.email()),
                        usableName(profile.name()))));
    }

    @Transactional(readOnly = true)
    public Optional<User> find(SocialProfile profile) {
        return userRepository.findByProviderAndProviderId(profile.provider(), profile.providerId());
    }

    /** 탈퇴. 저장 이력은 DB의 ON DELETE CASCADE로 함께 지워진다. */
    @Transactional
    public void withdraw(User user) {
        userRepository.delete(user);
    }

    private String usableName(String name) {
        if (name == null || name.isBlank()) {
            return DEFAULT_NAME;
        }
        String trimmed = name.trim();
        return trimmed.length() > NAME_MAX ? trimmed.substring(0, NAME_MAX) : trimmed;
    }

    /**
     * 이메일이 없거나 너무 길거나, 다른 계정이 이미 쓰는 이메일이면 null로 저장한다.
     * (users.email에 UNIQUE가 남아 있어도 로그인이 실패하지 않게 하는 방어 코드)
     */
    private String usableEmail(String email) {
        if (email == null || email.isBlank() || email.length() > EMAIL_MAX) {
            return null;
        }
        return userRepository.existsByEmail(email) ? null : email;
    }
}