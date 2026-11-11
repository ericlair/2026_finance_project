package com.example.investment_portfolio.api.dto;

import java.util.List;

public record EtfPriceResponse(Response response) {
    public record Response(Header header, Body body) {}
    public record Header(String resultCode, String resultMsg) {}
    public record Body(int numOfRows, int pageNo, int totalCount, Items items) {}
    public record Items(List<Item> item) {}

    public record Item(
            String basDt,        // 기준일자
            String srtnCd,       // 단축코드
            String isinCd,       // ISIN코드
            String itmsNm,       // 종목명
            String clpr,         // 종가
            String vs,           // 대비
            String fltRt,        // 등락률
            String nav,          // 순자산가치(NAV)
            String bssIdxIdxNm,  // 기초지수명
            String bssIdxClpr    // 기초지수 종가
    ) {}
}