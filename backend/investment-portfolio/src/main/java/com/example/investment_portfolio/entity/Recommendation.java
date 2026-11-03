package com.example.investment_portfolio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * recommendations 테이블 매핑 (저장된 포트폴리오의 종목별 비중, 상품 단위).
 * - UNIQUE(selection_id, product_id)
 * - selection 삭제 시 DB의 ON DELETE CASCADE로 함께 삭제됨
 * - product FK는 연쇄 삭제 없음(상품 데이터 보호)
 */
@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recommendation_id")
    private Long id;

    @Column(name = "selection_id", nullable = false)
    private Long selectionId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "ratio", nullable = false, precision = 5, scale = 2)
    private BigDecimal ratio;

    /** 저장 당시의 연 배당률(%). 이 컬럼을 추가하기 전에 저장된 행은 NULL */
    @Column(name = "dividend_rate", precision = 5, scale = 2)
    private BigDecimal dividendRate;

    protected Recommendation() {
        // JPA용 기본 생성자
    }

    public static Recommendation create(Long selectionId, Long productId, BigDecimal ratio, BigDecimal dividendRate) {
        Recommendation r = new Recommendation();
        r.selectionId = selectionId;
        r.productId = productId;
        r.ratio = ratio;
        r.dividendRate = dividendRate;
        return r;
    }

    public Long getId() { return id; }
    public Long getSelectionId() { return selectionId; }
    public Long getProductId() { return productId; }
    public BigDecimal getRatio() { return ratio; }
    public BigDecimal getDividendRate() { return dividendRate; }
}