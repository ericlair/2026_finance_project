package com.example.investment_portfolio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * price_history 테이블 매핑. 종목당 최신 60행만 유지(변동성 계산용).
 * 단순하게 product_id를 Long으로 들고 있음(FK는 DB가 보장).
 */
@Entity
@Table(name = "price_history")
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_history_id")
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "bas_dt", nullable = false)
    private LocalDate basDt;

    @Column(name = "close_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal closePrice;

    protected PriceHistory() {
        // JPA용 기본 생성자
    }

    public PriceHistory(Long productId, LocalDate basDt, BigDecimal closePrice) {
        this.productId = productId;
        this.basDt = basDt;
        this.closePrice = closePrice;
    }

    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public LocalDate getBasDt() { return basDt; }
    public BigDecimal getClosePrice() { return closePrice; }
}