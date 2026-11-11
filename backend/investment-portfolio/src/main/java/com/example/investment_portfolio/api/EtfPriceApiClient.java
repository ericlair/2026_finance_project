package com.example.investment_portfolio.api;

import com.example.investment_portfolio.api.dto.EtfPriceResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 금융위원회_증권상품시세정보(getETFPriceInfo_V2) 호출 클라이언트.
 * RestTemplate(HttpURLConnection, HTTP/1.1) 기반 — 다른 클라이언트와 동일하게 통일.
 */
@Component
public class EtfPriceApiClient {

    private static final String BASE_URL =
            "https://apis.data.go.kr/1160100/GetSecuritiesProductInfoService_V2/getETFPriceInfo_V2";

    private final RestTemplate restTemplate;

    @Value("${publicdata.api.service-key}")
    private String serviceKey;

    public EtfPriceApiClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private EtfPriceResponse call(URI uri) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36");
        headers.set("Accept", "application/json, text/plain, */*");
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(uri, HttpMethod.GET, entity, EtfPriceResponse.class).getBody();
    }

    /** 공백은 %20으로 인코딩(종목명에 공백이 있어서 '+'로 가면 안 될 수 있음) */
    private static String encName(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    /** ISIN(정확히 일치)으로 기간 시세 조회 */
    public EtfPriceResponse fetchPriceHistoryByIsin(String beginBasDt, String endBasDt, String isinCd, int numOfRows) {
        URI uri = URI.create(BASE_URL
                + "?serviceKey=" + serviceKey
                + "&resultType=json"
                + "&numOfRows=" + numOfRows
                + "&pageNo=1"
                + "&beginBasDt=" + enc(beginBasDt)
                + "&endBasDt=" + enc(endBasDt)
                + "&isinCd=" + enc(isinCd));
        return call(uri);
    }

    /** 종목명 정확히 일치 조회 (ISIN 확인용) */
    public EtfPriceResponse fetchByExactName(String itmsNm) {
        URI uri = URI.create(BASE_URL
                + "?serviceKey=" + serviceKey
                + "&resultType=json&numOfRows=5&pageNo=1"
                + "&itmsNm=" + encName(itmsNm));
        return call(uri);
    }

    /** 종목명 포함 검색 (후보 확인용) */
    public EtfPriceResponse fetchByLikeName(String likeItmsNm, int numOfRows) {
        URI uri = URI.create(BASE_URL
                + "?serviceKey=" + serviceKey
                + "&resultType=json&numOfRows=" + numOfRows + "&pageNo=1"
                + "&likeItmsNm=" + encName(likeItmsNm));
        return call(uri);
    }
}