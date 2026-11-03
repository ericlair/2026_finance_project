package com.example.investment_portfolio.service;

import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.logic.Product;
import com.example.investment_portfolio.logic.ProductCategory;
import com.example.investment_portfolio.logic.ScoredProduct;
import com.example.investment_portfolio.logic.StockPortfolioOptimizer;
import com.example.investment_portfolio.repository.StockProductRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * DB에 저장된 실데이터(stock_products)를 로직 입력(Product)으로 변환해
 * StockPortfolioOptimizer를 실제로 실행. ETF는 아직 데이터가 없어 배당주만 가능.
 */
@Service
public class StockPortfolioDemoService {

    private final StockProductRepository productRepository;

    public StockPortfolioDemoService(StockProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public record PortfolioResult(String investorType, int countA, int countB,
                                  double weightedDividendRate, List<ScoredProduct> selected) {}

    public List<PortfolioResult> runAllTypes() {
        List<Product> groupA = toProducts(productRepository.findByCategory(ProductCategory.GROUP_A_HIGH_DIVIDEND));
        List<Product> groupB = toProducts(productRepository.findByCategory(ProductCategory.GROUP_B_LARGE_STABLE));

        List<PortfolioResult> results = new ArrayList<>();
        for (InvestorType type : InvestorType.values()) {
            StockPortfolioOptimizer.StockPlan plan = StockPortfolioOptimizer.optimizeStock(groupA, groupB, type);
            double weighted = plan.selected().stream()
                    .mapToDouble(s -> s.product().dividendRate() * (s.ratio() / 100.0))
                    .sum();
            results.add(new PortfolioResult(type.name(), plan.countA(), plan.countB(),
                    Math.round(weighted * 100.0) / 100.0, plan.selected()));
        }
        return results;
    }

    /** dividendRate·volatility가 아직 없는 종목(예: 배치 미실행)은 후보에서 제외 */
    private List<Product> toProducts(List<StockProduct> entities) {
        List<Product> result = new ArrayList<>();
        for (StockProduct e : entities) {
            if (e.getDividendRate() == null || e.getVolatility() == null) continue;
            result.add(new Product(
                    String.valueOf(e.getId()),
                    e.getName(),
                    e.getCategory(),
                    e.getDividendRate().doubleValue(),
                    e.getVolatility().doubleValue()
            ));
        }
        return result;
    }
}