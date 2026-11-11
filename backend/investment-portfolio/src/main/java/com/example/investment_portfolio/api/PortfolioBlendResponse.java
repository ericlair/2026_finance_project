package com.example.investment_portfolio.api;

import com.example.investment_portfolio.service.PortfolioBlendService;

import java.util.ArrayList;
import java.util.List;

/**
 * 프론트(RatioSetting / PortfolioDetail)용 응답.
 * - etf / stock 구간으로 나뉘며, 해당 비율이 0이면 그 구간은 null.
 * - holdings[].weight 는 "구간 안에서의 비중"이고 구간별 합이 100.
 * - avgRate 는 평균 배당률(가중평균). 전체 avgRate + 구간별 avgRate.
 * - kind: "ETF" | "STOCK" (화면 표시용 한글 라벨은 프론트에서 매핑)
 */
public record PortfolioBlendResponse(String etfType, String stockType,
                                     int etfRatio, int stockRatio,
                                     double avgRate,
                                     Section etf, Section stock,
                                     List<String> warnings) {

    public record Section(int ratio, Double avgRate, List<Item> holdings) {}

    public record Item(String name, String category, String kind, double weight, Double rate) {}

    public static PortfolioBlendResponse from(PortfolioBlendService.BlendResult r) {
        return new PortfolioBlendResponse(
                r.etfType(), r.stockType(),
                r.etfRatio(), r.stockRatio(),
                r.weightedDividendRate(),
                section("ETF", r.etfRatio(), r.etfDividendRate(), r.holdings()),
                section("STOCK", r.stockRatio(), r.stockDividendRate(), r.holdings()),
                r.warnings());
    }

    private static Section section(String source, int sectionRatio, Double avgRate,
                                   List<PortfolioBlendService.BlendHolding> all) {
        if (sectionRatio <= 0) {
            return null;
        }
        List<Item> items = new ArrayList<>();
        double sum = 0.0;
        for (PortfolioBlendService.BlendHolding h : all) {
            if (!source.equals(h.source())) {
                continue;
            }
            double weight = round2(h.ratio() * 100.0 / sectionRatio);
            items.add(new Item(h.name(), h.category(), source, weight, h.dividendRate()));
            sum += weight;
        }
        // 반올림 오차 보정: 구간 비중 합이 100이 되도록 마지막 항목만 조정
        double diff = round2(100.0 - sum);
        if (!items.isEmpty() && diff != 0.0 && Math.abs(diff) <= 0.5) {
            int last = items.size() - 1;
            Item l = items.get(last);
            items.set(last, new Item(l.name(), l.category(), l.kind(), round2(l.weight() + diff), l.rate()));
        }
        return new Section(sectionRatio, avgRate, items);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}