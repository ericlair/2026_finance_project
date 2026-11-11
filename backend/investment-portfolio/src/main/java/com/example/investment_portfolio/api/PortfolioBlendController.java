package com.example.investment_portfolio.api;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.service.PortfolioBlendService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** ETF + 배당주 합산 포트폴리오를 실데이터로 확인하는 임시 컨트롤러 (나중에 정식 API로 대체). */
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@RestController
public class PortfolioBlendController {

    private final PortfolioBlendService portfolioBlendService;

    public PortfolioBlendController(PortfolioBlendService portfolioBlendService) {
        this.portfolioBlendService = portfolioBlendService;
    }

    /**
     * 예) /demo/portfolio-blend?etfType=DIVIDEND&stockType=PRINCIPAL&etfRatio=70
     *     /demo/portfolio-blend?etfType=BALANCED&etfRatio=100   (배당주 쪽 유형 불필요)
     *     /demo/portfolio-blend?stockType=BALANCED&etfRatio=0    (ETF 쪽 유형 불필요)
     */
    @GetMapping("/demo/portfolio-blend")
    public ResponseEntity<?> blend(@RequestParam(name = "etfType", required = false) String etfType,
                                   @RequestParam(name = "stockType", required = false) String stockType,
                                   @RequestParam(name = "etfRatio", defaultValue = "50") int etfRatio) {
        try {
            return ResponseEntity.ok(portfolioBlendService.blend(parseType(etfType), parseType(stockType), etfRatio));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private InvestorType parseType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return InvestorType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유형은 PRINCIPAL, BALANCED, DIVIDEND 중 하나여야 합니다: " + value);
        }
    }
}