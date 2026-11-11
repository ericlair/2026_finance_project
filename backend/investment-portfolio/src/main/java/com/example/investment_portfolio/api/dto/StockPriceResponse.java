package com.example.investment_portfolio.api.dto;

import java.util.List;

public record StockPriceResponse(Response response) {
    public record Response(Header header, Body body) {}
    public record Header(String resultCode, String resultMsg) {}
    public record Body(int numOfRows, int pageNo, int totalCount, Items items) {}
    public record Items(List<Item> item) {}

    public record Item(
            String basDt,      // 기준일자
            String srtnCd,     // 단축코드
            String isinCd,     // ISIN코드
            String itmsNm,     // 종목명
            String mrktCtg,    // 시장구분
            String clpr,       // 종가
            String vs,         // 대비
            String fltRt,      // 등락률
            String mkp,        // 시가
            String hipr,       // 고가
            String lopr,       // 저가
            String trqu,       // 거래량
            String trPrc       // 거래대금
    ) {}
}