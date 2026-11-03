package com.example.investment_portfolio.service;

import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.logic.ScoredProduct;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 배당주 엔진 결과와 ETF 엔진 결과를 사용자가 정한 비율(ETF 비중 0~100, 10% 단위)로 합침.
 * - ETF와 배당주의 투자성향 유형은 서로 달라도 됨.
 * - etfRatio == 0 이면 ETF 쪽, 100 이면 배당주 쪽은 계산하지 않고 해당 유형 값도 필요 없음.
 */
@Service
public class PortfolioBlendService {

    private final StockPortfolioDemoService stockPortfolioDemoService;
    private final EtfPortfolioDemoService etfPortfolioDemoService;

    public PortfolioBlendService(StockPortfolioDemoService stockPortfolioDemoService,
                                 EtfPortfolioDemoService etfPortfolioDemoService) {
        this.stockPortfolioDemoService = stockPortfolioDemoService;
        this.etfPortfolioDemoService = etfPortfolioDemoService;
    }

    /** 합산 후 상품 단위 한 줄. source는 ETF / STOCK */
    public record BlendHolding(String source, Long productId, String name, String category,
                               Double dividendRate, Double volatility, double ratio) {}

    public record BlendResult(String etfType, String stockType, int etfRatio, int stockRatio,
                              double weightedDividendRate, Double etfDividendRate, Double stockDividendRate,
                              double ratioSum, List<String> warnings, List<BlendHolding> holdings) {}

    public BlendResult blend(InvestorType etfType, InvestorType stockType, int etfRatio) {
        if (etfRatio < 0 || etfRatio > 100 || etfRatio % 10 != 0) {
            throw new IllegalArgumentException("etfRatio는 0~100 사이의 10 단위 값이어야 합니다.");
        }
        if (etfRatio > 0 && etfType == null) {
            throw new IllegalArgumentException("etfRatio가 0보다 크면 etfType이 필요합니다.");
        }
        if (etfRatio < 100 && stockType == null) {
            throw new IllegalArgumentException("etfRatio가 100보다 작으면 stockType이 필요합니다.");
        }
        int stockRatio = 100 - etfRatio;

        List<String> warnings = new ArrayList<>();
        List<BlendHolding> holdings = new ArrayList<>();
        Double etfRate = null;
        Double stockRate = null;

        if (etfRatio > 0) {
            EtfPortfolioDemoService.PortfolioResult etf = etfPortfolioDemoService.runAllTypes().stream()
                    .filter(r -> r.investorType().equals(etfType.name()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("ETF 결과를 찾지 못했습니다: " + etfType));
            warnings.addAll(etf.warnings());
            if (etf.holdings().isEmpty()) {
                warnings.add("ETF 결과가 비어 있습니다.");
            }
            etfRate = etf.weightedDividendRate();
            for (EtfPortfolioDemoService.Holding h : etf.holdings()) {
                holdings.add(new BlendHolding("ETF", h.productId(), h.name(), h.category(), h.dividendRate(), h.volatility(),
                        round2(h.ratio() * etfRatio / 100.0)));
            }
        }

        if (etfRatio < 100) {
            StockPortfolioDemoService.PortfolioResult stock = stockPortfolioDemoService.runAllTypes().stream()
                    .filter(r -> r.investorType().equals(stockType.name()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("배당주 결과를 찾지 못했습니다: " + stockType));
            if (stock.selected().isEmpty()) {
                warnings.add("배당주 결과가 비어 있습니다.");
            }
            stockRate = stock.weightedDividendRate();
            for (ScoredProduct s : stock.selected()) {
                holdings.add(new BlendHolding("STOCK", Long.valueOf(s.product().id()), s.product().name(), s.product().category().name(),
                        s.product().dividendRate(), s.product().volatility(),
                        round2(s.ratio() * stockRatio / 100.0)));
            }
        }

        // 반올림 오차 보정: 비중 합이 정확히 100%가 되도록 마지막 항목만 조정
        double sum = sumRatio(holdings);
        double diff = round2(100.0 - sum);
        if (!holdings.isEmpty() && diff != 0.0) {
            if (Math.abs(diff) <= 0.5) {
                int last = holdings.size() - 1;
                BlendHolding l = holdings.get(last);
                holdings.set(last, new BlendHolding(l.source(), l.productId(), l.name(), l.category(),
                        l.dividendRate(), l.volatility(), round2(l.ratio() + diff)));
                sum = sumRatio(holdings);
            } else {
                warnings.add("비중 합계가 100%가 아닙니다: " + round2(sum));
            }
        }

        double weighted = 0.0;
        for (BlendHolding h : holdings) {
            weighted += h.dividendRate() * h.ratio() / 100.0;
        }

        return new BlendResult(
                etfType == null ? null : etfType.name(),
                stockType == null ? null : stockType.name(),
                etfRatio, stockRatio, round2(weighted), etfRate, stockRate, round2(sum), warnings, holdings);
    }

    private static double sumRatio(List<BlendHolding> holdings) {
        double sum = 0.0;
        for (BlendHolding h : holdings) {
            sum += h.ratio();
        }
        return sum;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}