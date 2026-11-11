package com.example.investment_portfolio.api;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import com.example.investment_portfolio.service.EtfDividendRateService;
import com.example.investment_portfolio.service.EtfIsinLookupService;
import com.example.investment_portfolio.service.EtfPriceBatchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * ETF 배치 수동 실행용 임시 컨트롤러 (나중에 스케줄러로 대체하고 삭제할 것).
 * 실행 순서: /demo/etf-isin → /demo/refresh-etf-prices → /demo/refresh-etf-dividends
 */
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@RestController
public class EtfDemoController {

    private final EtfIsinLookupService etfIsinLookupService;
    private final EtfPriceBatchService etfPriceBatchService;
    private final EtfDividendRateService etfDividendRateService;

    public EtfDemoController(EtfIsinLookupService etfIsinLookupService,
                             EtfPriceBatchService etfPriceBatchService,
                             EtfDividendRateService etfDividendRateService) {
        this.etfIsinLookupService = etfIsinLookupService;
        this.etfPriceBatchService = etfPriceBatchService;
        this.etfDividendRateService = etfDividendRateService;
    }

    @GetMapping("/demo/etf-isin")
    public List<EtfIsinLookupService.Result> etfIsin() {
        return etfIsinLookupService.lookupAndSave();
    }

    @GetMapping("/demo/refresh-etf-prices")
    public List<EtfPriceBatchService.Result> refreshEtfPrices() {
        return etfPriceBatchService.refreshEtfs();
    }

    @GetMapping("/demo/refresh-etf-dividends")
    public List<EtfDividendRateService.Result> refreshEtfDividends() {
        return etfDividendRateService.refreshEtfDividendRates();
    }
}