package com.example.investment_portfolio.service;

import com.example.investment_portfolio.api.StockPriceApiClient;
import com.example.investment_portfolio.api.dto.StockPriceResponse;
import com.example.investment_portfolio.entity.PriceHistory;
import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.logic.VolatilityCalculator;
import com.example.investment_portfolio.repository.PriceHistoryRepository;
import com.example.investment_portfolio.repository.StockProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 배당주(SELECTIVE) 종목의 종가를 API에서 받아 price_history에 쌓고,
 * 최근 60영업일 종가로 변동성을 계산해 stock_products의 price/volatility를 갱신.
 */
@Service
public class StockPriceBatchService {

    private static final int KEEP = 60;
    private static final DateTimeFormatter F = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final StockProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final StockPriceApiClient stockPriceApiClient;

    public StockPriceBatchService(StockProductRepository productRepository,
                                  PriceHistoryRepository priceHistoryRepository,
                                  StockPriceApiClient stockPriceApiClient) {
        this.productRepository = productRepository;
        this.priceHistoryRepository = priceHistoryRepository;
        this.stockPriceApiClient = stockPriceApiClient;
    }

    public record Result(String name, int newRows, int keptRows, String lastDate,
                         BigDecimal price, BigDecimal volatility, String status) {}

    public List<Result> refreshStocks() {
        String end = LocalDate.now().format(F);
        String begin = LocalDate.now().minusDays(110).format(F); // 60영업일이 들어오도록 넉넉하게

        List<Result> results = new ArrayList<>();
        for (StockProduct p : productRepository.findByCategoryType(CategoryType.SELECTIVE)) {
            results.add(refreshOne(p, begin, end));
        }
        return results;
    }

    private Result refreshOne(StockProduct p, String begin, String end) {
        try {
            StockPriceResponse res = stockPriceApiClient.fetchPriceHistory(begin, end, p.getName(), 100);
            List<StockPriceResponse.Item> items = extractItems(res);
            if (items.isEmpty()) {
                return new Result(p.getName(), 0, 0, null, null, null, "NO_DATA (종목명 불일치 가능)");
            }

            // 1) 새 종가만 저장 (product_id + bas_dt 중복은 건너뜀)
            int newRows = 0;
            for (StockPriceResponse.Item it : items) {
                LocalDate d = LocalDate.parse(it.basDt(), F);
                if (!priceHistoryRepository.existsByProductIdAndBasDt(p.getId(), d)) {
                    priceHistoryRepository.save(new PriceHistory(p.getId(), d, new BigDecimal(it.clpr())));
                    newRows++;
                }
            }

            // 2) 최신 60행만 유지
            List<PriceHistory> all = priceHistoryRepository.findByProductIdOrderByBasDtDesc(p.getId());
            if (all.size() > KEEP) {
                List<PriceHistory> excess = new ArrayList<>(all.subList(KEEP, all.size()));
                priceHistoryRepository.deleteAll(excess);
                all = new ArrayList<>(all.subList(0, KEEP));
            }

            // 3) 오래된 → 최신 순 종가로 변동성 계산
            List<Double> closes = new ArrayList<>();
            for (int i = all.size() - 1; i >= 0; i--) {
                closes.add(all.get(i).getClosePrice().doubleValue());
            }
            double vol = VolatilityCalculator.calculate(closes);

            // 4) stock_products 갱신
            PriceHistory latest = all.get(0);
            BigDecimal volatility = BigDecimal.valueOf(vol).setScale(2, RoundingMode.HALF_UP);
            p.updateMarketData(latest.getClosePrice(), volatility);
            productRepository.save(p);

            return new Result(p.getName(), newRows, all.size(), latest.getBasDt().toString(),
                    latest.getClosePrice(), volatility, "OK");

        } catch (Exception e) {
            return new Result(p.getName(), 0, 0, null, null, null, "ERROR: " + e.getMessage());
        }
    }

    private List<StockPriceResponse.Item> extractItems(StockPriceResponse res) {
        if (res == null || res.response() == null || res.response().body() == null
                || res.response().body().items() == null
                || res.response().body().items().item() == null) {
            return List.of();
        }
        return res.response().body().items().item();
    }
}