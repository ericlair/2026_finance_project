package com.example.investment_portfolio.service;

import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.logic.EtfPortfolioOptimizer;
import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.logic.Product;
import com.example.investment_portfolio.logic.ProductCategory;
import com.example.investment_portfolio.logic.ScoredProduct;
import com.example.investment_portfolio.repository.StockProductRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DB의 ETF 실데이터(stock_products)로 EtfPortfolioOptimizer를 실행.
 * - LISTED(지수추종·다우존스배당): 카테고리별로 묶어 대표값(소속 상품 단순평균)을 엔진에 넣고,
 *   결과의 카테고리 비중을 소속 상품 수로 균등분배해서 상품 단위로 펼침.
 * - SINGLE(커버드콜 등): 상품 1개 = 카테고리 1개라 그대로 엔진에 입력.
 */
@Service
public class EtfPortfolioDemoService {

    private static final int EXPECTED_LISTED_CATEGORIES = 3;
    private static final int EXPECTED_SINGLE_PRODUCTS = 10;

    private final StockProductRepository productRepository;

    public EtfPortfolioDemoService(StockProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /** 상품 단위 한 줄 (LISTED는 소속 상품으로 펼친 뒤의 값) */
    public record Holding(Long productId, String name, String category, Double dividendRate, Double volatility, double ratio) {}

    public record PortfolioResult(String investorType, int categoryCount, double weightedDividendRate,
                                  List<String> warnings, List<Holding> holdings) {}

    public List<PortfolioResult> runAllTypes() {
        List<StockProduct> listedProducts = valid(productRepository.findByCategoryType(CategoryType.LISTED));
        List<StockProduct> singleProducts = valid(productRepository.findByCategoryType(CategoryType.SINGLE));

        // LISTED: 카테고리별로 묶어 대표값(단순평균) 생성
        Map<ProductCategory, List<StockProduct>> listedByCategory = new LinkedHashMap<>();
        for (StockProduct p : listedProducts) {
            listedByCategory.computeIfAbsent(p.getCategory(), k -> new ArrayList<>()).add(p);
        }
        List<Product> listedReps = new ArrayList<>();
        for (Map.Entry<ProductCategory, List<StockProduct>> e : listedByCategory.entrySet()) {
            double div = e.getValue().stream().mapToDouble(p -> p.getDividendRate().doubleValue()).average().orElse(0);
            double vol = e.getValue().stream().mapToDouble(p -> p.getVolatility().doubleValue()).average().orElse(0);
            listedReps.add(new Product(e.getKey().name(), e.getKey().name(), e.getKey(), div, vol));
        }

        List<Product> singles = new ArrayList<>();
        for (StockProduct p : singleProducts) {
            singles.add(new Product(String.valueOf(p.getId()), p.getName(), p.getCategory(),
                    p.getDividendRate().doubleValue(), p.getVolatility().doubleValue()));
        }

        // 데이터가 비어 있는 종목이 조용히 빠지는 걸 막기 위한 경고
        List<String> warnings = new ArrayList<>();
        if (listedReps.size() != EXPECTED_LISTED_CATEGORIES) {
            warnings.add("LISTED 카테고리 " + listedReps.size() + "개만 사용됨 (기대 " + EXPECTED_LISTED_CATEGORIES + "개)");
        }
        if (singles.size() != EXPECTED_SINGLE_PRODUCTS) {
            warnings.add("SINGLE 상품 " + singles.size() + "개만 사용됨 (기대 " + EXPECTED_SINGLE_PRODUCTS + "개)");
        }

        List<PortfolioResult> results = new ArrayList<>();
        for (InvestorType type : InvestorType.values()) {
            List<ScoredProduct> plan = EtfPortfolioOptimizer.optimizeEtf(listedReps, singles, type);
            if (plan == null) {
                List<String> w = new ArrayList<>(warnings);
                w.add("엔진이 결과를 만들지 못함 (SINGLE 후보 부족)");
                results.add(new PortfolioResult(type.name(), 0, 0.0, w, List.of()));
                continue;
            }

            List<Holding> holdings = expand(plan, listedByCategory);
            double weighted = 0.0;
            for (Holding h : holdings) {
                weighted += h.dividendRate() * (h.ratio() / 100.0);
            }
            results.add(new PortfolioResult(type.name(), plan.size(), round2(weighted), warnings, holdings));
        }
        return results;
    }

    /** 엔진 결과(카테고리 단위)를 상품 단위로 펼침. LISTED는 카테고리 비중을 소속 상품 수로 균등분배 */
    private List<Holding> expand(List<ScoredProduct> plan, Map<ProductCategory, List<StockProduct>> listedByCategory) {
        List<Holding> holdings = new ArrayList<>();
        for (ScoredProduct s : plan) {
            ProductCategory cat = s.product().category();
            if (cat.categoryType == CategoryType.LISTED) {
                List<StockProduct> members = listedByCategory.get(cat);
                double each = round2(s.ratio() / members.size());
                double allocated = 0.0;
                for (int i = 0; i < members.size(); i++) {
                    StockProduct m = members.get(i);
                    // 마지막 상품이 나머지를 가져가서 카테고리 비중 합이 정확히 맞도록 보정
                    double ratio = (i == members.size() - 1) ? round2(s.ratio() - allocated) : each;
                    allocated += ratio;
                    holdings.add(new Holding(m.getId(), m.getName(), cat.name(),
                            m.getDividendRate().doubleValue(), m.getVolatility().doubleValue(), ratio));
                }
            } else {
                holdings.add(new Holding(Long.valueOf(s.product().id()), s.product().name(), cat.name(),
                        s.product().dividendRate(), s.product().volatility(), s.ratio()));
            }
        }
        return holdings;
    }

    /** 배당률·변동성이 아직 없는 종목은 후보에서 제외 */
    private List<StockProduct> valid(List<StockProduct> list) {
        List<StockProduct> result = new ArrayList<>();
        for (StockProduct p : list) {
            if (p.getDividendRate() != null && p.getVolatility() != null) {
                result.add(p);
            }
        }
        return result;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}