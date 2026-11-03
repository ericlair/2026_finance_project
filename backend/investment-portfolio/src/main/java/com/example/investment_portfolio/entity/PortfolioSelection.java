package com.example.investment_portfolio.entity;

import com.example.investment_portfolio.logic.InvestorType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * portfolio_selections 테이블 매핑 (사용자가 저장한 포트폴리오 헤더).
 * - etf_ratio가 0이면 etf_type, 100이면 stock_type은 NULL (DB CHECK 제약)
 * - 종목별 비중은 recommendations 테이블에 저장
 * - 회원 삭제 시 DB의 ON DELETE CASCADE로 함께 삭제됨
 */
@Entity
@Table(name = "portfolio_selections")
public class PortfolioSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "selection_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "etf_type", length = 20)
    private InvestorType etfType;

    @Enumerated(EnumType.STRING)
    @Column(name = "stock_type", length = 20)
    private InvestorType stockType;

    @Column(name = "etf_ratio", nullable = false)
    private Byte etfRatio;   // TINYINT는 Byte로 매핑해야 validate를 통과함

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected PortfolioSelection() {
        // JPA용 기본 생성자
    }

    public static PortfolioSelection create(Long userId, InvestorType etfType, InvestorType stockType, int etfRatio) {
        PortfolioSelection s = new PortfolioSelection();
        s.userId = userId;
        s.etfType = etfRatio == 0 ? null : etfType;
        s.stockType = etfRatio == 100 ? null : stockType;
        s.etfRatio = (byte) etfRatio;
        s.createdAt = LocalDateTime.now();
        return s;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public InvestorType getEtfType() { return etfType; }
    public InvestorType getStockType() { return stockType; }
    public int getEtfRatio() { return etfRatio; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}