package com.example.investment_portfolio.service;

import com.example.investment_portfolio.entity.User;
import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 설문 결과(투자성향 유형 + 운용방식) 저장 / 초기화.
 * 두 값을 모두 보내면 저장, 둘 다 null이면 초기화. 한쪽만 있으면 거부한다.
 */
@Service
public class UserProfileService {

    private final UserRepository userRepository;

    public UserProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * @return 갱신된 사용자. 사용자가 없으면 빈 값
     * @throws IllegalArgumentException 값 조합이나 운용방식이 잘못된 경우
     */
    @Transactional
    public Optional<User> updateInvestorProfile(Long userId, InvestorType investorType, String preferredEngine) {
        String engine = normalizeEngine(preferredEngine);

        if ((investorType == null) != (engine == null)) {
            throw new IllegalArgumentException("investorType과 preferredEngine은 함께 보내거나 둘 다 비워야 합니다.");
        }

        Optional<User> user = userRepository.findById(userId);
        user.ifPresent(u -> u.updateInvestorProfile(investorType, engine));
        return user;
    }

    private String normalizeEngine(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String upper = value.trim().toUpperCase();
        if (!upper.equals("ETF") && !upper.equals("STOCK")) {
            throw new IllegalArgumentException("preferredEngine은 ETF 또는 STOCK 이어야 합니다: " + value);
        }
        return upper;
    }
}