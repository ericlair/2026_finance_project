package com.example.investment_portfolio.service;

import com.example.investment_portfolio.api.DividendInfoApiClient;
import com.example.investment_portfolio.api.dto.DividendInfoResponse;
import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.repository.StockProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 배당주(SELECTIVE)의 배당률 계산.
 * 배당률(%) = 최근 지급일부터 역순으로 합산한 보통주 현금배당금 ÷ 저장된 종가 × 100
 *  - 합산 개수의 상한은 종목별 payments_per_year(연 지급횟수)
 *  - 직전 지급과의 간격이 MAX_GAP_DAYS를 넘으면(누락) 상한 전에 중단
 *  - 최근 지급일로부터 MAX_SPAN_DAYS보다 먼 건은 합산하지 않음
 *  - 가장 최근 지급일이 STALE_DAYS보다 오래됐으면 배당이 끊긴 것으로 보고 0%
 * API의 배당률(stckGenrCashDvdnRt)은 액면가 기준이라 사용하지 않고, 금액이 비어 있는 행만 액면가 × 비율로 환산.
 * 가격 배치(/demo/refresh-stocks)가 먼저 실행되어 price가 채워져 있어야 함.
 */
@Service
public class StockDividendBatchService {

    private static final DateTimeFormatter F = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private static final int STALE_DAYS = 370;     // 최근 지급이 이보다 오래되면 배당 중단으로 판단
    private static final int MAX_GAP_DAYS = 250;   // 직전 지급과의 간격이 이보다 벌어지면 누락으로 보고 합산 중단
    private static final int MAX_SPAN_DAYS = 400;  // 최근 지급일로부터 이보다 먼 지급은 합산하지 않음(전체 이력 합산 방지)

    private final StockProductRepository productRepository;
    private final DividendInfoApiClient dividendInfoApiClient;

    public StockDividendBatchService(StockProductRepository productRepository,
                                     DividendInfoApiClient dividendInfoApiClient) {
        this.productRepository = productRepository;
        this.dividendInfoApiClient = dividendInfoApiClient;
    }

    public record Result(String name, int rowsTotal, int rowsUsed, BigDecimal sumAmount,
                         BigDecimal price, BigDecimal dividendRate, String status) {}

    public List<Result> refreshDividendRates() {
        List<Result> results = new ArrayList<>();
        for (StockProduct p : productRepository.findByCategoryType(CategoryType.SELECTIVE)) {
            results.add(refreshOne(p));
        }
        return results;
    }

    private Result refreshOne(StockProduct p) {
        try {
            if (p.getPrice() == null) {
                return new Result(p.getName(), 0, 0, null, null, null, "NO_PRICE (가격 배치를 먼저 실행)");
            }

            DividendInfoResponse res = (p.getCorpRegNo() != null)
                    ? dividendInfoApiClient.fetchByCrno(p.getCorpRegNo())
                    : dividendInfoApiClient.fetchRecent(p.getName(), 100);
            List<DividendInfoResponse.Item> items = extractItems(res);
            if (items.isEmpty()) {
                return new Result(p.getName(), 0, 0, null, p.getPrice(), null, "NO_DATA (회사명 불일치 가능)");
            }

            // 1) 유효한 현금배당(무배당 제외)만 날짜 내림차순으로 정렬
            List<DividendInfoResponse.Item> valid = new ArrayList<>();
            for (DividendInfoResponse.Item it : items) {
                if (!isCommonCashDividend(it)) continue;
                if (toDecimal(it.stckGenrDvdnAmt()).signum() == 0
                        && toDecimal(it.stckGenrCashDvdnRt()).signum() == 0) continue; // 무배당 등 제외
                if (parseDate(it.dvdnBasDt()) != null) valid.add(it);
            }
            valid.sort((a, b) -> parseDate(b.dvdnBasDt()).compareTo(parseDate(a.dvdnBasDt())));

            if (valid.isEmpty()) {
                p.updateDividendRate(BigDecimal.ZERO);
                productRepository.save(p);
                return new Result(p.getName(), items.size(), 0, BigDecimal.ZERO, p.getPrice(),
                        BigDecimal.ZERO, "ZERO (유효한 현금배당 이력 없음)");
            }

            // 2) 최신성 검사: 가장 최근 지급일이 오늘로부터 STALE_DAYS(370일) 넘게 지났으면 배당이 끊긴 것으로 보고 0 처리
            //    (간격 그룹핑과 별개 — "지금도 유효한 배당인지"는 오늘 날짜 기준으로만 판단)
            LocalDate mostRecent = parseDate(valid.get(0).dvdnBasDt());
            if (mostRecent.isBefore(LocalDate.now().minusDays(STALE_DAYS))) {
                p.updateDividendRate(BigDecimal.ZERO);
                productRepository.save(p);
                return new Result(p.getName(), items.size(), 0, BigDecimal.ZERO, p.getPrice(),
                        BigDecimal.ZERO, "ZERO (최근 " + STALE_DAYS + "일 내 지급 없음 — 배당 중단으로 판단)");
            }

            // 3) 상한은 payments_per_year(사람이 넣은 실제 연 지급횟수). 그 개수까지 채우되,
            //    가다가 지급 간격이 벌어지면(누락) 상한 전에 조기 종료 — 예: 연4회인데 1번 누락이면 3건에서 멈춤
            int expectedCount = (p.getPaymentsPerYear() != null) ? p.getPaymentsPerYear() : 1;

            BigDecimal sum = BigDecimal.ZERO;
            int used = 0;
            boolean usedParConversion = false;
            LocalDate prevDate = null;

            for (DividendInfoResponse.Item it : valid) {
                if (used >= expectedCount) break; // 연 지급횟수만큼 채웠으면 종료
                LocalDate baseDate = parseDate(it.dvdnBasDt());
                if (prevDate != null && prevDate.minusDays(MAX_GAP_DAYS).isAfter(baseDate)) break; // 직전 건과의 간격이 벌어지면 중단(누락)
                if (mostRecent.minusDays(MAX_SPAN_DAYS).isAfter(baseDate)) break; // 최근 지급일로부터 MAX_SPAN_DAYS 넘게 멀어지면 중단(전체 역사 합산 방지)
                prevDate = baseDate;

                BigDecimal amount = toDecimal(it.stckGenrDvdnAmt());
                if (amount.signum() == 0) {
                    BigDecimal ratePct = toDecimal(it.stckGenrCashDvdnRt());
                    BigDecimal par = toDecimal(it.stckParPrc());
                    if (ratePct.signum() > 0 && par.signum() > 0) {
                        amount = par.multiply(ratePct).divide(HUNDRED, 2, RoundingMode.HALF_UP);
                        usedParConversion = true;
                    }
                }
                if (amount.signum() > 0) {
                    sum = sum.add(amount);
                    used++;
                }
            }

            BigDecimal rate = sum.multiply(HUNDRED).divide(p.getPrice(), 2, RoundingMode.HALF_UP);
            p.updateDividendRate(rate);
            productRepository.save(p);

            String status;
            if (used == 0) status = "ZERO (합산할 유효한 현금배당 금액 없음 → 0%)";
            else if (usedParConversion) status = "OK (일부 행은 액면가×비율로 환산)";
            else status = "OK";

            return new Result(p.getName(), items.size(), used, sum, p.getPrice(), rate, status);

        } catch (Exception e) {
            return new Result(p.getName(), 0, 0, null, p.getPrice(), null, "ERROR: " + e.getMessage());
        }
    }

    private boolean isCommonCashDividend(DividendInfoResponse.Item it) {
        String kind = it.scrsItmsKcdNm();
        String type = it.stckDvdnRcdNm();
        boolean common = kind == null || kind.isBlank() || "보통주".equals(kind);
        // "동시배당"(주식+현금 동시지급)도 현금 지급액이 있으므로 포함, "주식배당"만 있는 건 제외
        boolean cash = type == null || type.isBlank() || type.contains("현금") || type.contains("동시");
        return common && cash;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s.trim(), F);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal toDecimal(String s) {
        if (s == null || s.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(s.trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private List<DividendInfoResponse.Item> extractItems(DividendInfoResponse res) {
        if (res == null || res.response() == null || res.response().body() == null
                || res.response().body().items() == null
                || res.response().body().items().item() == null) {
            return List.of();
        }
        return res.response().body().items().item();
    }
}