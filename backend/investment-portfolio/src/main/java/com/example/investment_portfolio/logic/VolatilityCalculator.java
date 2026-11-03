package com.example.investment_portfolio.logic;


import java.util.ArrayList;
import java.util.List;

public class VolatilityCalculator {

    public static double calculate(List<Double> closingPricesInDateOrder) {
        if (closingPricesInDateOrder == null || closingPricesInDateOrder.size() < 2) {
            throw new IllegalArgumentException("변동성 계산에는 최소 2개 이상의 종가 데이터가 필요합니다.");
        }

        List<Double> dailyReturns = new ArrayList<>();
        for (int i = 1; i < closingPricesInDateOrder.size(); i++) {
            double prev = closingPricesInDateOrder.get(i - 1);
            double curr = closingPricesInDateOrder.get(i);
            if (prev == 0) continue; // 방어적 처리 (종가 0은 데이터 이상)
            dailyReturns.add((curr - prev) / prev);
        }

        if (dailyReturns.isEmpty()) {
            throw new IllegalArgumentException("유효한 일별수익률을 계산할 수 없습니다.");
        }

        double mean = dailyReturns.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        double variance = dailyReturns.stream()
                .mapToDouble(r -> Math.pow(r - mean, 2))
                .sum() / (dailyReturns.size() - 1 == 0 ? 1 : dailyReturns.size() - 1); // 표본표준편차

        return round2(Math.sqrt(variance) * 100.0);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}