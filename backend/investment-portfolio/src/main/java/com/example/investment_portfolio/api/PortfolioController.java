package com.example.investment_portfolio.api;

import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.service.PortfolioBlendService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** 프론트용 정식 포트폴리오 API. (/demo/portfolio-blend 는 배포 전 삭제 예정) */
@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioBlendService portfolioBlendService;

    public PortfolioController(PortfolioBlendService portfolioBlendService) {
        this.portfolioBlendService = portfolioBlendService;
    }

    /**
     * 예) /api/portfolio/blend?etfType=BALANCED&stockType=PRINCIPAL&etfRatio=50
     *     /api/portfolio/blend?etfType=BALANCED&etfRatio=100   (배당주 유형 불필요)
     *     /api/portfolio/blend?stockType=BALANCED&etfRatio=0    (ETF 유형 불필요)
     */
    @GetMapping("/blend")
    public ResponseEntity<?> blend(@RequestParam(name = "etfType", required = false) String etfType,
                                   @RequestParam(name = "stockType", required = false) String stockType,
                                   @RequestParam(name = "etfRatio", defaultValue = "50") int etfRatio) {
        try {
            PortfolioBlendService.BlendResult result =
                    portfolioBlendService.blend(parseType(etfType), parseType(stockType), etfRatio);
            return ResponseEntity.ok(PortfolioBlendResponse.from(result));
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