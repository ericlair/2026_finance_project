package com.example.investment_portfolio.service;

import com.example.investment_portfolio.entity.PortfolioSelection;
import com.example.investment_portfolio.entity.Recommendation;
import com.example.investment_portfolio.entity.StockProduct;
import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.logic.InvestorType;
import com.example.investment_portfolio.repository.PortfolioSelectionRepository;
import com.example.investment_portfolio.repository.RecommendationRepository;
import com.example.investment_portfolio.repository.StockProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 포트폴리오 저장 / 목록 / 삭제.
 * - 저장: 프론트가 보낸 비중을 믿지 않고, 서버가 PortfolioBlendService로 다시 계산한 종목·비중을 저장한다.
 * - 모든 조회·삭제는 로그인한 사용자 본인 것만 대상으로 한다.
 */
@Service
public class PortfolioSelectionService {

    private final PortfolioBlendService blendService;
    private final PortfolioSelectionRepository selectionRepository;
    private final RecommendationRepository recommendationRepository;
    private final StockProductRepository productRepository;

    public PortfolioSelectionService(PortfolioBlendService blendService,
                                     PortfolioSelectionRepository selectionRepository,
                                     RecommendationRepository recommendationRepository,
                                     StockProductRepository productRepository) {
        this.blendService = blendService;
        this.selectionRepository = selectionRepository;
        this.recommendationRepository = recommendationRepository;
        this.productRepository = productRepository;
    }

    /** 저장 직후 응답용: 저장된 헤더 + 방금 계산한 결과 */
    public record Saved(PortfolioSelection selection, PortfolioBlendService.BlendResult result) {}

    /** 목록 한 줄. 종목 수는 recommendations 행 수 */
    public record SelectionSummary(Long id, LocalDateTime createdAt, String etfType, String stockType,
                                   int etfRatio, int stockRatio, int holdingCount) {}

    /**
     * 저장된 항목 상세의 종목 한 줄. weight는 구간(ETF 또는 배당주) 안에서의 비중이고 구간별 합이 100.
     * rate는 저장 당시의 연 배당률(옛 저장분은 null)
     */
    public record DetailItem(String name, String category, String kind, double weight, Double rate) {}

    /** 구간 하나(ETF 또는 배당주). 비율이 0이면 null. avgRate는 저장 당시 배당률의 가중평균(배당률이 없는 행이 있으면 null) */
    public record DetailSection(int ratio, Double avgRate, List<DetailItem> holdings) {}

    public record Detail(PortfolioSelection selection, int holdingCount, Double avgRate,
                         DetailSection etf, DetailSection stock) {}

    /**
     * 저장된 포트폴리오를 저장 당시 종목·비중·배당률 그대로 조회 (현재 데이터로 다시 계산하지 않음).
     * 가격·시가총액·거래대금은 저장하지 않으므로 돌려주지 않는다. 종목 상세는 별도 종목 화면에서 다룬다.
     * 남의 id거나 없는 id면 빈 값.
     */
    @Transactional(readOnly = true)
    public Optional<Detail> detail(Long userId, Long selectionId) {
        Optional<PortfolioSelection> found = selectionRepository.findByIdAndUserId(selectionId, userId);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        PortfolioSelection selection = found.get();

        List<Recommendation> rows = recommendationRepository.findBySelectionId(selection.getId());
        Map<Long, StockProduct> products = new HashMap<>();
        productRepository.findAllById(rows.stream().map(Recommendation::getProductId).toList())
                .forEach(p -> products.put(p.getId(), p));

        List<Row> etfRows = new ArrayList<>();
        List<Row> stockRows = new ArrayList<>();
        for (Recommendation r : rows) {
            StockProduct p = products.get(r.getProductId());
            if (p == null) {
                continue;
            }
            boolean isStock = p.getCategoryType() == CategoryType.SELECTIVE;
            Double rate = r.getDividendRate() == null ? null : r.getDividendRate().doubleValue();
            Row row = new Row(p.getName(), p.getCategory().name(), isStock ? "STOCK" : "ETF",
                    r.getRatio().doubleValue(), rate);
            (isStock ? stockRows : etfRows).add(row);
        }

        int etfRatio = selection.getEtfRatio();
        List<Row> all = new ArrayList<>(etfRows);
        all.addAll(stockRows);
        return Optional.of(new Detail(selection, all.size(), weightedRate(all, 100),
                section(etfRows, etfRatio), section(stockRows, 100 - etfRatio)));
    }

    private record Row(String name, String category, String kind, double ratio, Double rate) {}

    /** 저장 당시 배당률의 가중평균 = Σ(비중 × 배당률) ÷ 기준 비중. 배당률이 없는 행이 있으면 null */
    private Double weightedRate(List<Row> rows, int baseRatio) {
        if (rows.isEmpty() || baseRatio <= 0) {
            return null;
        }
        double total = 0.0;
        for (Row r : rows) {
            if (r.rate() == null) {
                return null;
            }
            total += r.ratio() * r.rate();
        }
        return Math.round(total / baseRatio * 100.0) / 100.0;
    }

    private DetailSection section(List<Row> rows, int sectionRatio) {
        if (sectionRatio <= 0 || rows.isEmpty()) {
            return null;
        }
        rows.sort(Comparator.comparingDouble(Row::ratio).reversed().thenComparing(Row::name));
        Double sectionAvg = weightedRate(rows, sectionRatio);

        List<DetailItem> items = new ArrayList<>();
        double sum = 0.0;
        for (Row r : rows) {
            double weight = Math.round(r.ratio() * 100.0 / sectionRatio * 100.0) / 100.0;
            items.add(new DetailItem(r.name(), r.category(), r.kind(), weight, r.rate()));
            sum += weight;
        }
        // 반올림 오차 보정: 구간 비중 합이 100이 되도록 마지막 항목만 조정
        double diff = Math.round((100.0 - sum) * 100.0) / 100.0;
        if (diff != 0.0 && Math.abs(diff) <= 0.5) {
            int last = items.size() - 1;
            DetailItem l = items.get(last);
            items.set(last, new DetailItem(l.name(), l.category(), l.kind(),
                    Math.round((l.weight() + diff) * 100.0) / 100.0, l.rate()));
        }
        return new DetailSection(sectionRatio, sectionAvg, items);
    }

    /**
     * @throws IllegalArgumentException 비율·유형이 잘못된 경우 (blend()가 검증)
     * @throws IllegalStateException    추천 결과가 비어 저장할 종목이 없는 경우
     */
    @Transactional
    public Saved save(Long userId, InvestorType etfType, InvestorType stockType, int etfRatio) {
        PortfolioBlendService.BlendResult result = blendService.blend(etfType, stockType, etfRatio);
        if (result.holdings().isEmpty()) {
            throw new IllegalStateException("추천 결과가 비어 있어 저장할 수 없습니다.");
        }

        PortfolioSelection selection = selectionRepository.save(
                PortfolioSelection.create(userId, etfType, stockType, etfRatio));

        List<Recommendation> rows = new ArrayList<>();
        for (PortfolioBlendService.BlendHolding h : result.holdings()) {
            rows.add(Recommendation.create(
                    selection.getId(),
                    h.productId(),
                    BigDecimal.valueOf(h.ratio()).setScale(2, RoundingMode.HALF_UP),
                    h.dividendRate() == null ? null
                            : BigDecimal.valueOf(h.dividendRate()).setScale(2, RoundingMode.HALF_UP)));
        }
        recommendationRepository.saveAll(rows);

        return new Saved(selection, result);
    }

    /** 내 저장 목록, 최신순 */
    @Transactional(readOnly = true)
    public List<SelectionSummary> list(Long userId) {
        List<PortfolioSelection> selections = selectionRepository.findByUserIdOrderByCreatedAtDescIdDesc(userId);
        if (selections.isEmpty()) {
            return List.of();
        }

        List<Long> ids = selections.stream().map(PortfolioSelection::getId).toList();
        Map<Long, Long> counts = new HashMap<>();
        for (RecommendationRepository.SelectionCount c : recommendationRepository.countBySelectionIds(ids)) {
            counts.put(c.getSelectionId(), c.getCnt());
        }

        List<SelectionSummary> result = new ArrayList<>();
        for (PortfolioSelection s : selections) {
            result.add(new SelectionSummary(
                    s.getId(),
                    s.getCreatedAt(),
                    s.getEtfType() == null ? null : s.getEtfType().name(),
                    s.getStockType() == null ? null : s.getStockType().name(),
                    s.getEtfRatio(),
                    100 - s.getEtfRatio(),
                    counts.getOrDefault(s.getId(), 0L).intValue()));
        }
        return result;
    }

    /**
     * 내 것만 삭제. 남의 id거나 없는 id면 false (둘을 구분하지 않아 존재 여부가 드러나지 않게 한다).
     * 종목 행(recommendations)은 DB의 ON DELETE CASCADE로 함께 삭제된다.
     */
    @Transactional
    public boolean delete(Long userId, Long selectionId) {
        Optional<PortfolioSelection> selection = selectionRepository.findByIdAndUserId(selectionId, userId);
        if (selection.isEmpty()) {
            return false;
        }
        selectionRepository.delete(selection.get());
        return true;
    }
}