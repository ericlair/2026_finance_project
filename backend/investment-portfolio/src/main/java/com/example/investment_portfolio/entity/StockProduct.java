package com.example.investment_portfolio.entity;

import com.example.investment_portfolio.logic.CategoryType;
import com.example.investment_portfolio.logic.ProductCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * stock_products 테이블 매핑. category / category_type은 DB에 enum 이름 문자열로 저장됨.
 */
@Entity
@Table(name = "stock_products")
public class StockProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "isin_cd", length = 12)
    private String isinCd;

    @Column(name = "corp_reg_no", length = 13)
    private String corpRegNo;   // 배당주 전용. 가격 API는 이름으로만 조회되어 name과 별도로 둠

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ProductCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_type", nullable = false, length = 20)
    private CategoryType categoryType;

    @Column(name = "dividend_rate", precision = 5, scale = 2)
    private BigDecimal dividendRate;

    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "volatility", precision = 5, scale = 2)
    private BigDecimal volatility;

    @Column(name = "payments_per_year")
    private Byte paymentsPerYear;   // TINYINT는 Byte로 매핑해야 validate를 통과함

    @Column(name = "data_source", nullable = false, length = 10)
    private String dataSource;

    @UpdateTimestamp
    public void updateIsinCd(String isinCd) { this.isinCd = isinCd; }

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    protected StockProduct() {
        // JPA용 기본 생성자
    }

    /** 배치가 종가와 변동성을 갱신할 때 사용 */
    public void updateMarketData(BigDecimal price, BigDecimal volatility) {
        this.price = price;
        this.volatility = volatility;
    }

    /** 배당률 배치가 계산 결과를 저장할 때 사용 */
    public void updateDividendRate(BigDecimal dividendRate) {
        this.dividendRate = dividendRate;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getIsinCd() { return isinCd; }
    public String getCorpRegNo() { return corpRegNo; }
    public ProductCategory getCategory() { return category; }
    public CategoryType getCategoryType() { return categoryType; }
    public BigDecimal getDividendRate() { return dividendRate; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getVolatility() { return volatility; }
    public Byte getPaymentsPerYear() { return paymentsPerYear; }
    public String getDataSource() { return dataSource; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}