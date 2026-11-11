package com.example.investment_portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;

import java.nio.charset.StandardCharsets;

/**
 * 소셜 로그인(구글, 이후 카카오) + 세션 쿠키 방식.
 *
 * 배포 전에 정리할 것:
 *  - /demo/**, /api-test/** permitAll 제거 (배치 갱신 방법을 스케줄러 등으로 바꾼 뒤)
 *  - /api/** CSRF 제외 설정 다시 검토
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           OAuth2LoginSuccessHandler successHandler,
                                           @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl)
            throws Exception {
        http
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers( "/error").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/api/data-status").permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(oauth -> oauth
                        .successHandler(successHandler)
                        .failureHandler((request, response, exception) ->
                                response.sendRedirect(frontendUrl + "/?loginError=true")))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                // 로그인 안 한 요청은 로그인 페이지로 보내지 않고 401 JSON으로 알려준다 (fetch가 HTML을 받지 않게)
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    response.getWriter().write("{\"error\":\"로그인이 필요합니다.\"}");
                }));
        return http.build();
    }
}