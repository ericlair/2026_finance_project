package com.example.investment_portfolio.api;

import com.example.investment_portfolio.entity.PortfolioSelection;
import com.example.investment_portfolio.entity.User;
import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.service.AuthService;
import com.example.investment_portfolio.service.PortfolioBlendService;
import com.example.investment_portfolio.service.PortfolioSelectionService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 로그인 사용자의 포트폴리오 저장 / 목록 / 삭제.
 * 로그인하지 않은 요청은 SecurityConfig가 401로 막는다.
 */
@RestController
@RequestMapping("/api/portfolio/selections")
public class PortfolioSelectionController {

    private final PortfolioSelectionService selectionService;
    private final AuthService authService;

    public PortfolioSelectionController(PortfolioSelectionService selectionService, AuthService authService) {
        this.selectionService = selectionService;
        this.authService = authService;
    }

    /** 저장 요청. 종목·비중은 서버가 다시 계산하므로 유형과 ETF 비중만 받는다. */
    public record SaveRequest(InvestorType etfType, InvestorType stockType, Integer etfRatio) {}

    /** 저장 직후 응답: /api/portfolio/blend 응답 형태 + id, createdAt, 종목 수 */
    public record SelectionResponse(Long id, LocalDateTime createdAt,
                                    String etfType, String stockType,
                                    int etfRatio, int stockRatio,
                                    int holdingCount, double avgRate,
                                    PortfolioBlendResponse.Section etf,
                                    PortfolioBlendResponse.Section stock,
                                    List<String> warnings) {}

    @PostMapping
    public ResponseEntity<?> save(@RequestBody SaveRequest body, Authentication authentication,
                                  HttpServletRequest request, HttpServletResponse response) {
        Optional<User> user = currentUser(authentication);
        if (user.isEmpty()) {
            return unauthorized(request, response, authentication);
        }
        if (body == null || body.etfRatio() == null) {
            return badRequest("etfRatio가 필요합니다.");
        }
        try {
            PortfolioSelectionService.Saved saved = selectionService.save(
                    user.get().getId(), body.etfType(), body.stockType(), body.etfRatio());
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication,
                                  HttpServletRequest request, HttpServletResponse response) {
        Optional<User> user = currentUser(authentication);
        if (user.isEmpty()) {
            return unauthorized(request, response, authentication);
        }
        return ResponseEntity.ok(selectionService.list(user.get().getId()));
    }

    /**
     * 저장된 항목 상세: 저장 당시 종목·비중·배당률 그대로 (현재 데이터로 다시 계산하지 않음).
     * 배당률 컬럼을 추가하기 전에 저장된 항목은 avgRate, rate가 null일 수 있다.
     */
    public record SelectionDetailResponse(Long id, LocalDateTime createdAt,
                                          String etfType, String stockType,
                                          int etfRatio, int stockRatio, int holdingCount,
                                          Double avgRate,
                                          PortfolioBlendResponse.Section etf,
                                          PortfolioBlendResponse.Section stock) {}

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable("id") Long id, Authentication authentication,
                                    HttpServletRequest request, HttpServletResponse response) {
        Optional<User> user = currentUser(authentication);
        if (user.isEmpty()) {
            return unauthorized(request, response, authentication);
        }
        Optional<PortfolioSelectionService.Detail> detail = selectionService.detail(user.get().getId(), id);
        if (detail.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "저장된 포트폴리오를 찾을 수 없습니다."));
        }
        PortfolioSelectionService.Detail d = detail.get();
        PortfolioSelection s = d.selection();
        return ResponseEntity.ok(new SelectionDetailResponse(
                s.getId(), s.getCreatedAt(),
                s.getEtfType() == null ? null : s.getEtfType().name(),
                s.getStockType() == null ? null : s.getStockType().name(),
                s.getEtfRatio(), 100 - s.getEtfRatio(), d.holdingCount(), d.avgRate(),
                toSection(d.etf()), toSection(d.stock())));
    }

    private PortfolioBlendResponse.Section toSection(PortfolioSelectionService.DetailSection section) {
        if (section == null) {
            return null;
        }
        List<PortfolioBlendResponse.Item> items = section.holdings().stream()
                .map(h -> new PortfolioBlendResponse.Item(h.name(), h.category(), h.kind(), h.weight(), h.rate()))
                .toList();
        return new PortfolioBlendResponse.Section(section.ratio(), section.avgRate(), items);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id, Authentication authentication,
                                    HttpServletRequest request, HttpServletResponse response) {
        Optional<User> user = currentUser(authentication);
        if (user.isEmpty()) {
            return unauthorized(request, response, authentication);
        }
        if (!selectionService.delete(user.get().getId(), id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "저장된 포트폴리오를 찾을 수 없습니다."));
        }
        return ResponseEntity.noContent().build();
    }

    private SelectionResponse toResponse(PortfolioSelectionService.Saved saved) {
        PortfolioSelection s = saved.selection();
        PortfolioBlendService.BlendResult r = saved.result();
        PortfolioBlendResponse view = PortfolioBlendResponse.from(r);
        return new SelectionResponse(
                s.getId(), s.getCreatedAt(),
                view.etfType(), view.stockType(),
                view.etfRatio(), view.stockRatio(),
                r.holdings().size(), view.avgRate(),
                view.etf(), view.stock(), view.warnings());
    }

    private Optional<User> currentUser(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken token) {
            return authService.find(SocialProfile.from(token));
        }
        return Optional.empty();
    }

    private ResponseEntity<Map<String, String>> unauthorized(HttpServletRequest request, HttpServletResponse response,
                                                             Authentication authentication) {
        // 세션은 있는데 DB에 사용자가 없는 경우(탈퇴 직후 등) → 세션 정리
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        SecurityContextHolder.clearContext();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "로그인이 필요합니다."));
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }
}