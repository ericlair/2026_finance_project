package com.example.investment_portfolio.api;

import com.example.investment_portfolio.api.dto.StockPriceResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 금융위원회_주식시세정보(getStockPriceInfo_V2) 호출 클라이언트.
 * RestTemplate(HttpURLConnection, HTTP/1.1) 기반 — 다른 클라이언트와 동일하게 통일.
 */
@Component
public class StockPriceApiClient {

    private static final String BASE_URL =
            "https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2";

    private final RestTemplate restTemplate;

    @Value("${publicdata.api.service-key}")
    private String serviceKey;

    private static final int MAX_ATTEMPTS = 3;

    public StockPriceApiClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private StockPriceResponse call(URI uri) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36");
        headers.set("Accept", "application/json, text/plain, */*");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResourceAccessException last = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return restTemplate.exchange(uri, HttpMethod.GET, entity, StockPriceResponse.class).getBody();
            } catch (ResourceAccessException e) {   // 타임아웃, 연결 오류일 때만 다시 시도
                last = e;
                if (attempt < MAX_ATTEMPTS) {
                    try {
                        Thread.sleep(2000L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                }
            }
        }
        throw last;
    }
    public StockPriceResponse fetchPriceHistory(String beginBasDt, String endBasDt, String itmsNm, int numOfRows) {
        URI uri = URI.create(BASE_URL
                + "?serviceKey=" + serviceKey
                + "&resultType=json"
                + "&numOfRows=" + numOfRows
                + "&pageNo=1"
                + "&beginBasDt=" + enc(beginBasDt)
                + "&endBasDt=" + enc(endBasDt)
                + "&itmsNm=" + enc(itmsNm));
        return call(uri);
    }
}