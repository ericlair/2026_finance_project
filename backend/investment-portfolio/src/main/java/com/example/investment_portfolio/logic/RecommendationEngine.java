package com.example.investment_portfolio.logic;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 선택형(SELECTIVE) 카테고리 전용 스코어링 엔진.
 * 나열형/단일형 카테고리는 이 엔진을 거치지 않음 (PortfolioSlotOptimizer에서 별도 처리 예정).
 */
public class RecommendationEngine {

    public static List<ScoredProduct> selectTop(List<Product> pool, int slotCount, InvestorType type) {
        List<Product> valid = pool.stream()
                .filter(p -> p.dividendRate() != null && p.volatility() != null)
                .collect(Collectors.toList());
        if (valid.isEmpty()) return List.of();

        double minVol = valid.stream().mapToDouble(Product::volatility).min().orElse(0);
        double maxVol = valid.stream().mapToDouble(Product::volatility).max().orElse(0);
        double minDiv = valid.stream().mapToDouble(Product::dividendRate).min().orElse(0);
        double maxDiv = valid.stream().mapToDouble(Product::dividendRate).max().orElse(0);

        return scoreAndSelect(valid, slotCount, type, minVol, maxVol, minDiv, maxDiv);
    }

    /**
     * 전역 정규화 기준(globalMin/Max)을 외부에서 받는 버전.
     * 그룹A+그룹B처럼 서로 다른 후보군을 같은 점수 스케일로 비교/합산해야 할 때 사용.
     */
    public static List<ScoredProduct> selectTopWithGlobalNorm(List<Product> subPool, int slotCount, InvestorType type,
                                                              double globalMinVol, double globalMaxVol,
                                                              double globalMinDiv, double globalMaxDiv) {
        List<Product> valid = subPool.stream()
                .filter(p -> p.dividendRate() != null && p.volatility() != null)
                .collect(Collectors.toList());
        if (valid.isEmpty()) return List.of();

        return scoreAndSelect(valid, slotCount, type, globalMinVol, globalMaxVol, globalMinDiv, globalMaxDiv);
    }

    private static List<ScoredProduct> scoreAndSelect(List<Product> valid, int slotCount, InvestorType type,
                                                      double minVol, double maxVol, double minDiv, double maxDiv) {
        // 종목별 점수 계산
        List<ScoredProduct> scored = new ArrayList<>();
        for (Product p : valid) {
            double stability = 100.0 - normalize(p.volatility(), minVol, maxVol); // 변동성 낮을수록 높은 점수
            double profit = normalize(p.dividendRate(), minDiv, maxDiv);
            double total = stability * type.stabilityWeight + profit * type.profitWeight;
            scored.add(new ScoredProduct(p, stability, profit, total, 0.0));
        }

        // 4. 정렬: 종합점수 desc → 배당률 desc → id asc (동점 처리)
        scored.sort(
                Comparator.comparingDouble(ScoredProduct::totalScore).reversed()
                        .thenComparing(Comparator.comparingDouble((ScoredProduct s) -> s.product().dividendRate()).reversed())
                        .thenComparing(s -> s.product().id())
        );

        // 5. 상위 slotCount개 선정
        List<ScoredProduct> selected = scored.stream().limit(slotCount).collect(Collectors.toList());

        // 6. 점수 비례 비중 배분 (마지막 항목만 100에서 나머지 합을 뺀 값으로 보정)
        double totalScoreSum = selected.stream().mapToDouble(ScoredProduct::totalScore).sum();
        List<ScoredProduct> result = new ArrayList<>();
        double ratioSum = 0.0;
        for (int i = 0; i < selected.size(); i++) {
            ScoredProduct s = selected.get(i);
            double ratio;
            if (i == selected.size() - 1) {
                ratio = round2(100.0 - ratioSum);
            } else {
                ratio = totalScoreSum == 0
                        ? round2(100.0 / selected.size())
                        : round2((s.totalScore() / totalScoreSum) * 100.0);
                ratioSum += ratio;
            }
            result.add(new ScoredProduct(s.product(), s.stabilityScore(), s.profitScore(), s.totalScore(), ratio));
        }
        return result;
    }

    private static double normalize(double value, double min, double max) {
        if (max == min) return 50.0; // 후보군 내 값이 전부 동일할 때 예외 처리
        return (value - min) / (max - min) * 100.0;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}