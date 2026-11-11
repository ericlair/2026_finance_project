package com.example.investment_portfolio.api;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import com.example.investment_portfolio.service.EtfPortfolioDemoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** ETF 3유형 포트폴리오를 실데이터로 실행해 보는 임시 컨트롤러 (나중에 정식 API로 대체). */
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@RestController
public class EtfPortfolioDemoController {

    private final EtfPortfolioDemoService etfPortfolioDemoService;

    public EtfPortfolioDemoController(EtfPortfolioDemoService etfPortfolioDemoService) {
        this.etfPortfolioDemoService = etfPortfolioDemoService;
    }

    /** http://localhost:8080/demo/portfolio-etf */
    @GetMapping("/demo/portfolio-etf")
    public List<EtfPortfolioDemoService.PortfolioResult> portfolioEtf() {
        return etfPortfolioDemoService.runAllTypes();
    }
}