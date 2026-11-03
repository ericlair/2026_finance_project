package com.example.investment_portfolio.logic;

public record Product(
        String id,
        String name,
        ProductCategory category,
        Double dividendRate, // 3개월 평균값 등 이미 계산된 값. null 허용(데이터 미확보)
        Double volatility     // null 허용(데이터 미확보)
) {}
