package com.example.investment_portfolio.logic;

import java.util.List;

/**
 * 배당주 엔진 전용 슬롯(선정 개수) 최적화.
 * ETF는 EtfPortfolioOptimizer에서 별도로 다룸 (고정값 방식, 설계 예정).
 */
public class StockPortfolioOptimizer {

    // ===== 배당주 엔진 목표 배당률 구간 (원금/균형/배당집중) =====
    private static double[] stockTargetRange(InvestorType type) {
        return switch (type) {
            case PRINCIPAL -> new double[]{5.0, 6.5};
            case BALANCED -> new double[]{6.5, 8.0};
            case DIVIDEND -> new double[]{8.0, 9.5};
        };
    }

    // ===== total(8/9/10)별 후보 countA:countB 목록. 원금/배당집중형은 소수그룹을 2~3으로 통일 =====
    private static List<int[]> countCandidatesFor(InvestorType type, int total) {
        return switch (type) {
            case PRINCIPAL -> total == 8
                    ? List.of(new int[]{1, 7}, new int[]{2, 6}) // total=8은 1:7 또는 2:6
                    : List.of(
                    new int[]{1, total - 1},
                    new int[]{2, total - 2},
                    new int[]{3, total - 3}
            );
            case BALANCED -> List.of(switch (total) { // 반반에 가깝게, 후보 1개만
                case 8 -> new int[]{4, 4};
                case 9 -> new int[]{4, 5};
                default -> new int[]{5, 5}; // total=10
            });
            case DIVIDEND -> total == 8
                    ? List.of(new int[]{7, 1}, new int[]{6, 2}) // total=8은 7:1 또는 6:2
                    : List.of(
                    new int[]{total - 1, 1},
                    new int[]{total - 2, 2},
                    new int[]{total - 3, 3}
            );
        };
    }

    public record StockPlan(int countA, int countB, List<ScoredProduct> selected) {}

    /**
     * 그룹A+그룹B(26개)를 합쳐 1번만 전역 min-max 정규화.
     * total(8/9/10)별 후보 조합들 중, 배당률 가중평균이 목표구간에 가장 가까운(penalty 최소) 것을 채택.
     * 비중은 전역 종합점수 비례 배분.
     */
    public static StockPlan optimizeStock(List<Product> groupA, List<Product> groupB, InvestorType type) {
        List<Product> combined = new java.util.ArrayList<>(groupA);
        combined.addAll(groupB);

        List<Product> valid = combined.stream()
                .filter(p -> p.dividendRate() != null && p.volatility() != null)
                .toList();

        double minVol = valid.stream().mapToDouble(Product::volatility).min().orElse(0);
        double maxVol = valid.stream().mapToDouble(Product::volatility).max().orElse(0);
        double minDiv = valid.stream().mapToDouble(Product::dividendRate).min().orElse(0);
        double maxDiv = valid.stream().mapToDouble(Product::dividendRate).max().orElse(0);

        double[] target = stockTargetRange(type);

        double bestPenalty = Double.MAX_VALUE;
        StockPlan best = null;

        for (int total = 10; total >= 8; total--) {
            for (int[] counts : countCandidatesFor(type, total)) {
                int countA = counts[0];
                int countB = counts[1];
                if (countA < 1 || countB < 1 || countA > groupA.size() || countB > groupB.size()) continue;

                List<ScoredProduct> selA = RecommendationEngine.selectTopWithGlobalNorm(
                        groupA, countA, type, minVol, maxVol, minDiv, maxDiv);
                List<ScoredProduct> selB = RecommendationEngine.selectTopWithGlobalNorm(
                        groupB, countB, type, minVol, maxVol, minDiv, maxDiv);

                List<ScoredProduct> merged = mergeAndRebalance(selA, selB);
                double weightedDividend = weightedAverageDividend(merged);
                double penalty = distanceFromRange(weightedDividend, target);

                if (penalty < bestPenalty) {
                    bestPenalty = penalty;
                    best = new StockPlan(countA, countB, merged);
                }
            }
        }
        return best;
    }

    // ===== 공통 유틸 =====

    /** 두 그룹 선정 결과를 합치고, 합산 비중이 100%가 되도록 마지막 항목만 재보정 */
    private static List<ScoredProduct> mergeAndRebalance(List<ScoredProduct> a, List<ScoredProduct> b) {
        List<ScoredProduct> merged = new java.util.ArrayList<>();
        merged.addAll(a);
        merged.addAll(b);

        double totalScoreSum = merged.stream().mapToDouble(ScoredProduct::totalScore).sum();
        List<ScoredProduct> result = new java.util.ArrayList<>();
        double ratioSum = 0.0;
        for (int i = 0; i < merged.size(); i++) {
            ScoredProduct s = merged.get(i);
            double ratio;
            if (i == merged.size() - 1) {
                ratio = round2(100.0 - ratioSum);
            } else {
                ratio = totalScoreSum == 0
                        ? round2(100.0 / merged.size())
                        : round2((s.totalScore() / totalScoreSum) * 100.0);
                ratioSum += ratio;
            }
            result.add(new ScoredProduct(s.product(), s.stabilityScore(), s.profitScore(), s.totalScore(), ratio));
        }
        return result;
    }

    private static double weightedAverageDividend(List<ScoredProduct> list) {
        double sum = 0.0;
        for (ScoredProduct s : list) {
            sum += s.product().dividendRate() * (s.ratio() / 100.0);
        }
        return round2(sum);
    }

    /** 목표구간 안이면 0, 벗어나면 가까운 경계까지의 거리 */
    private static double distanceFromRange(double value, double[] range) {
        if (value < range[0]) return range[0] - value;
        if (value > range[1]) return value - range[1];
        return 0.0;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}