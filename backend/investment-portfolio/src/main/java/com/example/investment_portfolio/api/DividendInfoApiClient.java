package com.example.investment_portfolio.api;

import com.example.investment_portfolio.api.dto.DividendInfoResponse;
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
 * 금융위원회_주식배당정보(getDiviInfo_V2) 호출 클라이언트.
 * RestTemplate(HttpURLConnection, HTTP/1.1) 기반 — 다른 클라이언트와 동일하게 통일.
 */
@Component
public class DividendInfoApiClient {

    private static final String BASE_URL =
            "https://apis.data.go.kr/1160100/GetStocDiviInfoService_V2/getDiviInfo_V2";

    private final RestTemplate restTemplate;

    @Value("${publicdata.api.service-key}")
    private String serviceKey;

    public DividendInfoApiClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(factory);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private DividendInfoResponse call(URI uri) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36");
        headers.set("Accept", "application/json, text/plain, */*");
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(uri, HttpMethod.GET, entity, DividendInfoResponse.class).getBody();
    }

    /** 법인등록번호로 조회. 회사명 표기가 API와 다를 때(SNT 계열 등) 사용 */
    public DividendInfoResponse fetchByCrno(String crno) {
        URI uri = URI.create(BASE_URL
                + "?serviceKey=" + serviceKey
                + "&resultType=json"
                + "&numOfRows=100"
                + "&pageNo=1"
                + "&crno=" + enc(crno));
        return call(uri);
    }

    /**
     * 종목의 totalCount를 계산식(ceil(totalCount/pageSize))으로 마지막 페이지를 구해
     * 최근 이력만 받아오는 범용 메서드. 이력이 아무리 길어도(1000건 초과 포함) 모든 종목에 적용 가능.
     * 정렬이 오래된 것→최신 순으로 고정되어 있어, 마지막 페이지가 항상 최신 데이터를 담음.
     * 경계에서 최근 12개월치가 두 페이지에 걸칠 가능성에 대비해 마지막 2페이지를 합쳐서 반환.
     */
    public DividendInfoResponse fetchRecent(String stckIssuCmpyNm, int pageSize) {
        // 1) totalCount만 저렴하게 확인 (numOfRows=1)
        URI probeUri = URI.create(BASE_URL
                + "?serviceKey=" + serviceKey
                + "&resultType=json"
                + "&numOfRows=1"
                + "&pageNo=1"
                + "&stckIssuCmpyNm=" + enc(stckIssuCmpyNm));
        DividendInfoResponse probe = call(probeUri);
        int totalCount = (probe != null && probe.response() != null && probe.response().body() != null)
                ? probe.response().body().totalCount() : 0;

        if (totalCount <= pageSize) {
            // 전체가 한 페이지 안에 들어오면 그냥 다 받음
            URI uri = URI.create(BASE_URL
                    + "?serviceKey=" + serviceKey
                    + "&resultType=json"
                    + "&numOfRows=" + pageSize
                    + "&pageNo=1"
                    + "&stckIssuCmpyNm=" + enc(stckIssuCmpyNm));
            return call(uri);
        }

        // 2) 계산식으로 마지막 페이지 산출: ceil(totalCount / pageSize)
        int lastPage = (totalCount + pageSize - 1) / pageSize;
        // 12개월치가 페이지 경계에 걸릴 안전 여유분으로, 이전 페이지까지 포함해 2페이지 분량을 요청
        int startPage = Math.max(1, lastPage - 1);
        int rowsFromStart = pageSize * (lastPage - startPage + 1);

        URI uri = URI.create(BASE_URL
                + "?serviceKey=" + serviceKey
                + "&resultType=json"
                + "&numOfRows=" + rowsFromStart
                + "&pageNo=" + startPage
                + "&stckIssuCmpyNm=" + enc(stckIssuCmpyNm));
        return call(uri);
    }
}