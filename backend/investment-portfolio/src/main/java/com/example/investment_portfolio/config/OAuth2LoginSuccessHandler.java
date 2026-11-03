package com.example.investment_portfolio.config;

import com.example.investment_portfolio.service.AuthService;
import com.example.investment_portfolio.service.SocialProfile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 소셜 로그인에 성공하면 users에 사용자를 저장(처음일 때)하고 프론트 화면으로 돌려보낸다.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(AuthService authService,
                                     @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.authService = authService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        try {
            if (!(authentication instanceof OAuth2AuthenticationToken token)) {
                throw new IllegalStateException("소셜 로그인 인증이 아닙니다.");
            }
            authService.loginOrRegister(SocialProfile.from(token));
            response.sendRedirect(frontendUrl + "/");
        } catch (RuntimeException e) {
            // 저장에 실패하면 로그인 상태로 남기지 않는다.
            new SecurityContextLogoutHandler().logout(request, response, authentication);
            SecurityContextHolder.clearContext();
            response.sendRedirect(frontendUrl + "/?loginError=true");
        }
    }
}