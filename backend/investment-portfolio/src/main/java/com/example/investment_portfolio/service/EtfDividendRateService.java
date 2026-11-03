package com.example.investment_portfolio.service;

import com.example.investment_portfolio.entity.DividendHistory;
import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.repository.DividendHistoryRepository;
import com.example.investment_portfolio.repository.StockProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * ETF 연 분배율 계산: 종목별로 최근 payments_per_year건의 회차별 분배율(rate)을 합산해
 * stock_products.dividend_rate에 저장. 건수가 모자란 신규 상품은 (지급횟수 / 보유 건수)를 곱해 연환산.
 */
@Service
public class EtfDividendRateService {

    private final StockProductRepository productRepository;
    private final DividendHistoryRepository dividendHistoryRepository;

    public EtfDividendRateService(StockProductRepository productRepository,
                                  DividendHistoryRepository dividendHistoryRepository) {
        this.productRepository = productRepository;
        this.dividendHistoryRepository = dividendHistoryRepository;
    }

    public record Result(String name, Integer paymentsPerYear, int rowsAvailable, int rowsUsed,
                         String latestPayDate, BigDecimal sumRate, BigDecimal dividendRate, String status) {}

    public List<Result> refreshEtfDividendRates() {
        List<Result> results = new ArrayList<>();
        for (StockProduct p : productRepository.findByCategoryTypeIn(List.of(CategoryType.LISTED, CategoryType.SINGLE))) {
            results.add(refreshOne(p));
        }
        return results;
    }

    private Result refreshOne(StockProduct p) {
        try {
            Byte n = p.getPaymentsPerYear();
            if (n == null) {
                return new Result(p.getName(), null, 0, 0, null, null, null, "NO_FREQUENCY (payments_per_year 없음)");
            }

            List<DividendHistory> rows = dividendHistoryRepository.findByProductIdOrderByPayDateDesc(p.getId());
            if (rows.isEmpty()) {
                return new Result(p.getName(), n.intValue(), 0, 0, null, null, null, "NO_HISTORY (dividend_history 없음)");
            }

            int expected = n.intValue();
            int used = Math.min(expected, rows.size());
            BigDecimal sum = BigDecimal.ZERO;
            for (int i = 0; i < used; i++) {
                sum = sum.add(rows.get(i).getRate());
            }

            BigDecimal annual = sum;
            String status = "OK";
            if (used < expected) {
                annual = sum.multiply(BigDecimal.valueOf(expected))
                        .divide(BigDecimal.valueOf(used), 2, RoundingMode.HALF_UP);
                status = "ANNUALIZED (" + used + "/" + expected + "회 기준 연환산)";
            }
            annual = annual.setScale(2, RoundingMode.HALF_UP);

            p.updateDividendRate(annual);
            productRepository.save(p);

            return new Result(p.getName(), expected, rows.size(), used,
                    rows.get(0).getPayDate().toString(), sum, annual, status);

        } catch (Exception e) {
            return new Result(p.getName(), null, 0, 0, null, null, null, "ERROR: " + e.getMessage());
        }
    }
}