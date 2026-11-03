package com.example.investment_portfolio.service;

import com.example.investment_portfolio.api.EtfPriceApiClient;
import com.example.investment_portfolio.api.dto.EtfPriceResponse;
import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.repository.StockProductRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ETF 종목명(정확히 일치)으로 ISIN을 조회해 stock_products.isin_cd에 저장하는 1회성 도구.
 * 정확히 일치하는 종목이 없으면 이름 포함 검색 결과를 후보로 보여주기만 하고 저장하지 않음.
 */
@Service
public class EtfIsinLookupService {

    private final StockProductRepository productRepository;
    private final EtfPriceApiClient etfPriceApiClient;

    public EtfIsinLookupService(StockProductRepository productRepository, EtfPriceApiClient etfPriceApiClient) {
        this.productRepository = productRepository;
        this.etfPriceApiClient = etfPriceApiClient;
    }

    public record Result(String name, String status, String isinCd, List<String> candidates) {}

    public List<Result> lookupAndSave() {
        List<Result> results = new ArrayList<>();
        for (StockProduct p : productRepository.findByCategoryTypeIn(List.of(CategoryType.LISTED, CategoryType.SINGLE))) {
            results.add(lookupOne(p));
        }
        return results;
    }

    private Result lookupOne(StockProduct p) {
        try {
            if (p.getIsinCd() != null) {
                return new Result(p.getName(), "ALREADY", p.getIsinCd(), List.of());
            }

            Map<String, String> exact = distinctIsin(etfPriceApiClient.fetchByExactName(p.getName()));
            if (exact.size() == 1) {
                String isin = exact.keySet().iterator().next();
                p.updateIsinCd(isin);
                productRepository.save(p);
                return new Result(p.getName(), "OK", isin, List.of());
            }
            if (exact.size() > 1) {
                return new Result(p.getName(), "AMBIGUOUS", null, toCandidates(exact));
            }

            Map<String, String> like = distinctIsin(etfPriceApiClient.fetchByLikeName(p.getName(), 50));
            return new Result(p.getName(), "NOT_FOUND (정확히 일치하는 종목명 없음)", null, toCandidates(like));

        } catch (Exception e) {
            return new Result(p.getName(), "ERROR: " + e.getMessage(), null, List.of());
        }
    }

    private Map<String, String> distinctIsin(EtfPriceResponse res) {
        Map<String, String> m = new LinkedHashMap<>();
        if (res == null || res.response() == null || res.response().body() == null
                || res.response().body().items() == null
                || res.response().body().items().item() == null) {
            return m;
        }
        for (EtfPriceResponse.Item it : res.response().body().items().item()) {
            m.putIfAbsent(it.isinCd(), it.itmsNm());
        }
        return m;
    }

    private List<String> toCandidates(Map<String, String> m) {
        List<String> list = new ArrayList<>();
        for (Map.Entry<String, String> e : m.entrySet()) {
            list.add(e.getValue() + " | " + e.getKey());
        }
        return list;
    }
}