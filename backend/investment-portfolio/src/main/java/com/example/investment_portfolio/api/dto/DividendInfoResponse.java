package com.example.investment_portfolio.api.dto;

import java.util.List;

public record DividendInfoResponse(Response response) {
    public record Response(Header header, Body body) {}
    public record Header(String resultCode, String resultMsg) {}
    public record Body(int numOfRows, int pageNo, int totalCount, Items items) {}
    public record Items(List<Item> item) {}

    public record Item(
            String basDt,               // 조회 기준일(배당일 아님)
            String crno,                // 법인등록번호
            String stckIssuCmpyNm,      // 주식발행회사명
            String scrsItmsKcdNm,       // 보통주/우선주 구분
            String stckDvdnRcdNm,       // 배당 구분(현금배당 등)
            String dvdnBasDt,           // 배당기준일자
            String cashDvdnPayDt,       // 현금배당지급일자
            String stckGenrDvdnAmt,     // 1주당 현금배당금액(원)
            String stckGenrCashDvdnRt,  // 현금배당률(액면가 기준 %)
            String stckGenrDvdnRt,      // 주식배당률
            String stckParPrc,          // 액면가
            String stckStacMd           // 결산월
    ) {}
}