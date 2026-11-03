package com.example.investment_portfolio.service;

import com.example.investment_portfolio.entity.AuthProvider;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import java.util.Map;

/**
 * 소셜 로그인 제공자가 내려준 사용자 정보를 우리 서비스 기준으로 정리한 값.
 * 제공자마다 응답 구조가 달라서 이 클래스에서만 변환한다.
 */
public record SocialProfile(AuthProvider provider, String providerId, String email, String name) {

    public static SocialProfile from(OAuth2AuthenticationToken token) {
        String registrationId = token.getAuthorizedClientRegistrationId();
        Map<String, Object> attrs = token.getPrincipal().getAttributes();

        return switch (registrationId) {
            case "google" -> {
                String sub = asString(attrs.get("sub"));
                if (sub == null) {
                    throw new IllegalArgumentException("구글 응답에 sub가 없습니다.");
                }
                yield new SocialProfile(AuthProvider.GOOGLE, sub,
                        asString(attrs.get("email")), asString(attrs.get("name")));
            }
            // 카카오는 등록 후 여기에 case "kakao" 를 추가한다.
            default -> throw new IllegalArgumentException("지원하지 않는 로그인 방식: " + registrationId);
        };
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}