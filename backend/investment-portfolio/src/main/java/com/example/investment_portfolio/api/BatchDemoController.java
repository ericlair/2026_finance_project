package com.example.investment_portfolio.api;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import com.example.investment_portfolio.api.dto.DividendInfoResponse;
import com.example.investment_portfolio.service.StockDividendBatchService;
import com.example.investment_portfolio.service.StockPortfolioDemoService;
import com.example.investment_portfolio.service.StockPriceBatchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 배당주 배치 수동 실행 및 확인용 임시 컨트롤러. 나중에 스케줄러(@Scheduled)로 대체하고 삭제할 것.
 * 실행 순서: /demo/refresh-stocks (종가·변동성) → /demo/refresh-dividends (배당률, 저장된 종가 필요)
 */
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@RestController
public class BatchDemoController {

    private final StockPriceBatchService stockPriceBatchService;
    private final StockDividendBatchService stockDividendBatchService;
    private final DividendInfoApiClient dividendInfoApiClient;
    private final StockPortfolioDemoService stockPortfolioDemoService;

    public BatchDemoController(StockPriceBatchService stockPriceBatchService,
                               StockDividendBatchService stockDividendBatchService,
                               DividendInfoApiClient dividendInfoApiClient,
                               StockPortfolioDemoService stockPortfolioDemoService) {
        this.stockPriceBatchService = stockPriceBatchService;
        this.stockDividendBatchService = stockDividendBatchService;
        this.dividendInfoApiClient = dividendInfoApiClient;
        this.stockPortfolioDemoService = stockPortfolioDemoService;
    }

    // ===== 배치 수동 실행 =====

    @GetMapping("/demo/refresh-stocks")
    public List<StockPriceBatchService.Result> refreshStocks() {
        return stockPriceBatchService.refreshStocks();
    }

    @GetMapping("/demo/refresh-dividends")
    public List<StockDividendBatchService.Result> refreshDividends() {
        return stockDividendBatchService.refreshDividendRates();
    }

    // ===== 결과 확인 =====

    /** 실데이터로 배당주 3유형 포트폴리오 실행. http://localhost:8080/demo/portfolio-stock */
    @GetMapping("/demo/portfolio-stock")
    public List<StockPortfolioDemoService.PortfolioResult> portfolioStock() {
        return stockPortfolioDemoService.runAllTypes();
    }

    // ===== 종목 하나씩 배당 이력 원본 확인 (배당률이 이상할 때 디버깅용) =====

    /** 법인등록번호로 조회. http://localhost:8080/demo/dividend-by-crno?crno=1244110002907 */
    @GetMapping("/demo/dividend-by-crno")
    public DividendInfoResponse dividendByCrno(@RequestParam(name = "crno") String crno) {
        return dividendInfoApiClient.fetchByCrno(crno);
    }

    /** 회사명으로 조회(최근 이력 위주). http://localhost:8080/demo/dividend-by-name?name=삼성카드 */
    @GetMapping("/demo/dividend-by-name")
    public DividendInfoResponse dividendByName(@RequestParam(name = "name") String name) {
        return dividendInfoApiClient.fetchRecent(name, 100);
    }
}