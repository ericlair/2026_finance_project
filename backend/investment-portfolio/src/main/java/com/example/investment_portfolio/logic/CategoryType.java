package com.example.investment_portfolio.logic;

public enum CategoryType {
    SELECTIVE, // 후보 중 일부만 스코어링으로 선택 (그룹A/B 배당주)
    LISTED,    // 카테고리 비중만 계산, 상품 전부 나열 (S&P500, 나스닥100, 다우존스배당)
    SINGLE     // 카테고리 = 상품 1:1 (커버드콜 각 종목, PLUS고배당 등)
}
