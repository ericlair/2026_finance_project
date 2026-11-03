package com.example.investment_portfolio.service;

import com.example.investment_portfolio.api.EtfPriceApiClient;
import com.example.investment_portfolio.api.dto.EtfPriceResponse;
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
 * ETF(LISTED, SINGLE) 종가를 ISIN으로 조회해 price_history에 쌓고(최대 KEEP행, 약 3년 보관),
 * 최근 VOL_WINDOW(60)영업일 종가로 변동성을 계산해 stock_products의 price/volatility를 갱신.
 * 최근 구간 종가가 MIN_POINTS건 미만이면 가격만 갱신하고 변동성은 계산하지 않음(PARTIAL).
 */
@Service
public class EtfPriceBatchService {

    private static final int KEEP = 800;       // 보관할 종가 행 수(약 3년). 얼마나 밀지는 이 값만 바꾸면 됨
    private static final int VOL_WINDOW = 60;  // 변동성은 보관 기간과 별개로 항상 최근 60영업일로 계산
    private static final int MIN_POINTS = 20;
    private static final DateTimeFormatter F = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final StockProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final EtfPriceApiClient etfPriceApiClient;

    public EtfPriceBatchService(StockProductRepository productRepository,
                                PriceHistoryRepository priceHistoryRepository,
                                EtfPriceApiClient etfPriceApiClient) {
        this.productRepository = productRepository;
        this.priceHistoryRepository = priceHistoryRepository;
        this.etfPriceApiClient = etfPriceApiClient;
    }

    public record Result(String name, String isinCd, int newRows, int keptRows, String lastDate,
                         BigDecimal price, BigDecimal volatility, String status) {}

    public List<Result> refreshEtfs() {
        String end = LocalDate.now().format(F);
        String begin = LocalDate.now().minusYears(3).format(F);

        List<Result> results = new ArrayList<>();
        for (StockProduct p : productRepository.findByCategoryTypeIn(List.of(CategoryType.LISTED, CategoryType.SINGLE))) {
            results.add(refreshOne(p, begin, end));
        }
        return results;
    }

    private Result refreshOne(StockProduct p, String begin, String end) {
        try {
            if (p.getIsinCd() == null) {
                return new Result(p.getName(), null, 0, 0, null, null, null, "NO_ISIN (먼저 /demo/etf-isin 실행)");
            }

            EtfPriceResponse res = etfPriceApiClient.fetchPriceHistoryByIsin(begin, end, p.getIsinCd(), 1000);
            List<EtfPriceResponse.Item> items = extractItems(res);
            if (items.isEmpty()) {
                return new Result(p.getName(), p.getIsinCd(), 0, 0, null, null, null,
                        "NO_DATA (ISIN 확인 또는 API 데이터 갱신 여부 확인)");
            }

            int newRows = 0;
            for (EtfPriceResponse.Item it : items) {
                LocalDate d = LocalDate.parse(it.basDt(), F);
                if (!priceHistoryRepository.existsByProductIdAndBasDt(p.getId(), d)) {
                    priceHistoryRepository.save(new PriceHistory(p.getId(), d, new BigDecimal(it.clpr())));
                    newRows++;
                }
            }

            List<PriceHistory> all = priceHistoryRepository.findByProductIdOrderByBasDtDesc(p.getId());
            if (all.size() > KEEP) {
                List<PriceHistory> excess = new ArrayList<>(all.subList(KEEP, all.size()));
                priceHistoryRepository.deleteAll(excess);
                all = new ArrayList<>(all.subList(0, KEEP));
            }

            PriceHistory latest = all.get(0);
            BigDecimal volatility = p.getVolatility();
            String status = "OK";
            int window = Math.min(VOL_WINDOW, all.size());
            if (window >= MIN_POINTS) {
                List<Double> closes = new ArrayList<>();
                for (int i = window - 1; i >= 0; i--) {   // all은 최신순이라 최근 window개를 오래된 순으로 담음
                    closes.add(all.get(i).getClosePrice().doubleValue());
                }
                volatility = BigDecimal.valueOf(VolatilityCalculator.calculate(closes))
                        .setScale(2, RoundingMode.HALF_UP);
            } else {
                status = "PARTIAL (종가 " + all.size() + "건 — 변동성 미계산)";
            }

            p.updateMarketData(latest.getClosePrice(), volatility);
            productRepository.save(p);

            return new Result(p.getName(), p.getIsinCd(), newRows, all.size(), latest.getBasDt().toString(),
                    latest.getClosePrice(), volatility, status);

        } catch (Exception e) {
            return new Result(p.getName(), p.getIsinCd(), 0, 0, null, null, null, "ERROR: " + e.getMessage());
        }
    }

    private List<EtfPriceResponse.Item> extractItems(EtfPriceResponse res) {
        if (res == null || res.response() == null || res.response().body() == null
                || res.response().body().items() == null
                || res.response().body().items().item() == null) {
            return List.of();
        }
        return res.response().body().items().item();
    }
}