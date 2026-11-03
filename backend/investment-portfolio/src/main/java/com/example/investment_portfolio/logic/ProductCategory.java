package com.example.investment_portfolio.logic;

public enum ProductCategory {
    // 배당주 - 선택형
    GROUP_A_HIGH_DIVIDEND(CategoryType.SELECTIVE),
    GROUP_B_LARGE_STABLE(CategoryType.SELECTIVE),

    // ETF - 나열형 (동일 기초지수, 대표선정 없이 전부 나열)
    INDEX_SP500(CategoryType.LISTED),
    INDEX_NASDAQ100(CategoryType.LISTED),
    DOW_DIVIDEND(CategoryType.LISTED),

    // ETF - 단일형
    DOMESTIC_HIGH_DIVIDEND(CategoryType.SINGLE),       // PLUS 고배당주
    COVERED_CALL_DOW(CategoryType.SINGLE),
    COVERED_CALL_SP500(CategoryType.SINGLE),
    COVERED_CALL_NASDAQ100(CategoryType.SINGLE),
    COVERED_CALL_KOSPI200(CategoryType.SINGLE),
    COVERED_CALL_DOMESTIC_DIVIDEND(CategoryType.SINGLE),
    COVERED_CALL_US_DIVIDEND_GROWTH(CategoryType.SINGLE),
    COVERED_CALL_SEMICONDUCTOR(CategoryType.SINGLE),
    COVERED_CALL_FINANCE(CategoryType.SINGLE),
    COVERED_CALL_AI_VALUECHAIN(CategoryType.SINGLE);

    public final CategoryType categoryType;

    ProductCategory(CategoryType categoryType) {
        this.categoryType = categoryType;
    }
}
