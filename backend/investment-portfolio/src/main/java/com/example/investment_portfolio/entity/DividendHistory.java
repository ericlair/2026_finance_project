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
 * dividend_history 테이블 매핑 (ETF 전용, SEIBro 분배금지급현황을 수동 입력).
 * pay_date = 지급기준일, amount = 주당분배금(원), rate = 시가대비분배율(%).
 */
@Entity
@Table(name = "dividend_history")
public class DividendHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dividend_history_id")
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "pay_date", nullable = false)
    private LocalDate payDate;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal rate;

    protected DividendHistory() {
        // JPA용 기본 생성자
    }

    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public LocalDate getPayDate() { return payDate; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getRate() { return rate; }
}