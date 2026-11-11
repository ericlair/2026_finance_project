package com.example.investment_portfolio.api;

import com.example.investment_portfolio.entity.User;
import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.service.AuthService;
import com.example.investment_portfolio.service.SocialProfile;
import com.example.investment_portfolio.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

/**
 * 로그인 사용자의 설문 결과 저장 / 초기화.
 * 로그인하지 않은 요청은 SecurityConfig가 401로 막는다.
 */
@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final AuthService authService;
    private final UserProfileService userProfileService;

    public UserController(AuthService authService, UserProfileService userProfileService) {
        this.authService = authService;
        this.userProfileService = userProfileService;
    }

    /** 초기화는 둘 다 null(또는 생략)로 보낸다. */
    public record UpdateRequest(InvestorType investorType, String preferredEngine) {}

    /** 응답은 GET /api/auth/me와 같은 모양 */
    @PutMapping("/investor-type")
    public ResponseEntity<?> updateInvestorType(@RequestBody UpdateRequest body, Authentication authentication,
                                                HttpServletRequest request, HttpServletResponse response) {
        Optional<User> current = currentUser(authentication);
        if (current.isEmpty()) {
            return unauthorized(request, response, authentication);
        }
        try {
            Optional<User> updated = userProfileService.updateInvestorProfile(
                    current.get().getId(), body.investorType(), body.preferredEngine());
            if (updated.isEmpty()) {
                return unauthorized(request, response, authentication);
            }
            return ResponseEntity.ok(AuthController.MeResponse.from(updated.get()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Optional<User> currentUser(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken token) {
            return authService.find(SocialProfile.from(token));
        }
        return Optional.empty();
    }

    private ResponseEntity<Map<String, String>> unauthorized(HttpServletRequest request, HttpServletResponse response,
                                                             Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        SecurityContextHolder.clearContext();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }
}