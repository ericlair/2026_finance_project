package com.example.investment_portfolio.logic;

import java.util.ArrayList;
import java.util.List;

/**
 * ETF 엔진: LISTED(지수추종2+다우존스배당1=3개) 카테고리는 유형과 무관하게 항상 포함,
 * 비중만 유형별로 다름(70:30/50:50/30:70). SINGLE(커버드콜 등 10개)은 점수기반으로
 * 유형별 개수(2~3/3~4/4~5)만큼 선정, 남은 비중을 나눠 가짐.
 */
public class EtfPortfolioOptimizer {

    // ===== 유형별 LISTED:SINGLE 비중(%) =====
    private static int[] weightSplit(InvestorType type) {
        return switch (type) { // {listedPercent, singlePercent}
            case PRINCIPAL -> new int[]{70, 30};
            case BALANCED -> new int[]{50, 50};
            case DIVIDEND -> new int[]{30, 70};
        };
    }

    // ===== 유형별 SINGLE 선정 개수 범위 =====
    private static int[] singleCountRange(InvestorType type) {
        return switch (type) {
            case PRINCIPAL -> new int[]{2, 3};
            case BALANCED -> new int[]{3, 4};
            case DIVIDEND -> new int[]{4, 5};
        };
    }

    // ===== ETF 엔진 목표 배당률 구간 =====
    private static double[] etfTargetRange(InvestorType type) {
        return switch (type) {
            case PRINCIPAL -> new double[]{3.0, 6.0};
            case BALANCED -> new double[]{6.0, 10.0};
            case DIVIDEND -> new double[]{10.0, 15.0};
        };
    }

    /**
     * @param listedCategories LISTED 카테고리 대표값 3개 (지수추종2 + 다우존스배당1)
     * @param singleCategories SINGLE 카테고리 대표값 10개 (커버드콜 등)
     */
    public static List<ScoredProduct> optimizeEtf(List<Product> listedCategories,
                                                  List<Product> singleCategories,
                                                  InvestorType type) {
        int[] split = weightSplit(type);
        double listedPercent = split[0];
        double singlePercent = split[1];
        int[] range = singleCountRange(type);
        double[] target = etfTargetRange(type);

        double bestPenalty = Double.MAX_VALUE;
        List<ScoredProduct> best = null;

        for (int count = range[0]; count <= range[1]; count++) {
            if (count > singleCategories.size()) continue;

            // SINGLE: 점수기반 선정 (RecommendationEngine이 비중까지 100%로 배분해줌)
            List<ScoredProduct> selectedSingle = RecommendationEngine.selectTop(singleCategories, count, type);

            // LISTED: 스코어링 없이 균등 배분 (3개 고정 포함)
            List<ScoredProduct> listedAllocated = allocateListedEqually(listedCategories, listedPercent);

            // SINGLE 비중을 singlePercent 스케일로 축소
            List<ScoredProduct> singleAllocated = rescaleRatio(selectedSingle, singlePercent);

            List<ScoredProduct> merged = new ArrayList<>();
            merged.addAll(listedAllocated);
            merged.addAll(singleAllocated);
            merged = finalizeRounding(merged);

            double weightedDividend = weightedAverageDividend(merged);
            double penalty = distanceFromRange(weightedDividend, target);

            if (penalty < bestPenalty) {
                bestPenalty = penalty;
                best = merged;
            }
        }
        return best;
    }

    /** LISTED 3개를 listedPercent 안에서 균등 배분 (예: 70% / 3개 = 각 23.33%) */
    private static List<ScoredProduct> allocateListedEqually(List<Product> listedCategories, double listedPercent) {
        List<ScoredProduct> result = new ArrayList<>();
        double each = listedPercent / listedCategories.size();
        for (Product p : listedCategories) {
            result.add(new ScoredProduct(p, 0, 0, 0, round2(each)));
        }
        return result;
    }

    /** selectTop이 준 100% 기준 비중을 targetPercent 스케일로 축소 */
    private static List<ScoredProduct> rescaleRatio(List<ScoredProduct> selected, double targetPercent) {
        List<ScoredProduct> result = new ArrayList<>();
        for (ScoredProduct s : selected) {
            double newRatio = round2(s.ratio() * (targetPercent / 100.0));
            result.add(new ScoredProduct(s.product(), s.stabilityScore(), s.profitScore(), s.totalScore(), newRatio));
        }
        return result;
    }

    /** 전체 병합 리스트의 비중 합이 정확히 100%가 되도록 마지막 항목만 보정 */
    private static List<ScoredProduct> finalizeRounding(List<ScoredProduct> merged) {
        List<ScoredProduct> result = new ArrayList<>();
        double ratioSum = 0.0;
        for (int i = 0; i < merged.size(); i++) {
            ScoredProduct s = merged.get(i);
            double ratio = (i == merged.size() - 1) ? round2(100.0 - ratioSum) : s.ratio();
            if (i != merged.size() - 1) ratioSum += ratio;
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

    private static double distanceFromRange(double value, double[] range) {
        if (value < range[0]) return range[0] - value;
        if (value > range[1]) return value - range[1];
        return 0.0;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}