package com.example.investment_portfolio.logic;

public enum InvestorType {
    PRINCIPAL(0.7, 0.3),   // 원금집중형
    BALANCED(0.5, 0.5),    // 균형형
    DIVIDEND(0.3, 0.7);    // 배당집중형

    public final double stabilityWeight;
    public final double profitWeight;

    InvestorType(double stabilityWeight, double profitWeight) {
        this.stabilityWeight = stabilityWeight;
        this.profitWeight = profitWeight;
    }
}
