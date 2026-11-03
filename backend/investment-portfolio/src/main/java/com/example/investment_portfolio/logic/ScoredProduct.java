package com.example.investment_portfolio.logic;

public record ScoredProduct(
        Product product,
        double stabilityScore,
        double profitScore,
        double totalScore,
        double ratio
) {}
