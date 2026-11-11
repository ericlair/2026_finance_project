package com.example.investment_portfolio.api;

import com.example.investment_portfolio.entity.User;
import com.example.investment_portfolio.service.AuthService;
import com.example.investment_portfolio.service.SocialProfile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

/**
 * 로그인한 사용자 정보 조회 / 탈퇴. (로그아웃은 SecurityConfig의 POST /api/auth/logout)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record MeResponse(Long id, String name, String email,
                             String investorType, String preferredEngine) {
        static MeResponse from(User u) {
            return new MeResponse(
                    u.getId(), u.getName(), u.getEmail(),
                    u.getInvestorType() == null ? null : u.getInvestorType().name(),
                    u.getPreferredEngine());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication,
                                HttpServletRequest request, HttpServletResponse response) {
        Optional<User> user = currentUser(authentication);
        if (user.isEmpty()) {
            // 세션은 있는데 DB에 사용자가 없는 경우(탈퇴 직후 등) → 세션 정리
            clearSession(request, response, authentication);
            return unauthorized();
        }
        return ResponseEntity.ok(MeResponse.from(user.get()));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> withdraw(Authentication authentication,
                                      HttpServletRequest request, HttpServletResponse response) {
        Optional<User> user = currentUser(authentication);
        if (user.isEmpty()) {
            clearSession(request, response, authentication);
            return unauthorized();
        }
        authService.withdraw(user.get());
        clearSession(request, response, authentication);
        return ResponseEntity.noContent().build();
    }

    private Optional<User> currentUser(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken token) {
            return authService.find(SocialProfile.from(token));
        }
        return Optional.empty();
    }

    private void clearSession(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        SecurityContextHolder.clearContext();
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }
}