SET NAMES utf8mb4;
-- 인컴레시피(IncomeRecipe) 전체 스키마: 7개 테이블. DB: investment_portfolio (MySQL 8.0, InnoDB, utf8mb4)
-- 기준: 2026-10-25~28에 실제 DB에서 확인한 SHOW CREATE TABLE 결과 (users, price_history, dividend_history,
--       portfolio_selections, stock_products, recommendations)
-- 주의: 이 파일은 테이블만 만든다 (DROP 없음, 이미 있으면 건너뜀). 종목 시드·가격·분배 데이터는 포함하지 않는다.
--       application.properties가 ddl-auto=validate라서 서버를 켜기 전에 이 테이블들이 먼저 있어야 한다.

CREATE DATABASE IF NOT EXISTS investment_portfolio DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE investment_portfolio;

-- 1. users: 소셜 로그인 전용. 사용자는 (provider, provider_id)로 식별.
--    password는 자체 로그인 확장용으로 컬럼만 남김(자바 엔티티에는 매핑하지 않음).
--    investor_type / preferred_engine: 설문 결과 최신 1건 (NULL = 결과 없음)
CREATE TABLE IF NOT EXISTS users (
    user_id          BIGINT       NOT NULL AUTO_INCREMENT,
    email            VARCHAR(255) NULL,
    password         VARCHAR(255) NULL,
    name             VARCHAR(50)  NOT NULL,
    created_at       DATETIME     NOT NULL,
    investor_type    VARCHAR(20)  NULL,
    preferred_engine VARCHAR(10)  NULL,
    provider         VARCHAR(20)  NULL,
    provider_id      VARCHAR(255) NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_provider (provider, provider_id),
    CONSTRAINT chk_users_investor_type CHECK (investor_type IS NULL OR investor_type IN ('PRINCIPAL', 'BALANCED', 'DIVIDEND')),
    CONSTRAINT chk_users_preferred_engine CHECK (preferred_engine IS NULL OR preferred_engine IN ('ETF', 'STOCK'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. stock_products: 배당주 27 + ETF 16 통합 (총 43종목)
--    category / category_type은 enum 이름 문자열로 저장
--    (category_type: SELECTIVE=배당주 그룹, LISTED=지수추종·다우존스배당, SINGLE=커버드콜 등)
--    dividend_rate / price / volatility는 배치가 채우는 캐시값이라 NULL 허용
CREATE TABLE IF NOT EXISTS stock_products (
    product_id          BIGINT        NOT NULL AUTO_INCREMENT,
    name                VARCHAR(100)  NOT NULL,
    isin_cd             VARCHAR(12)   NULL,
    category            VARCHAR(50)   NOT NULL,
    category_type       VARCHAR(20)   NOT NULL,
    dividend_rate       DECIMAL(5,2)  NULL,
    price               DECIMAL(15,2) NULL,
    volatility          DECIMAL(5,2)  NULL,
    payments_per_year   TINYINT       NULL,
    data_source         VARCHAR(10)   NOT NULL,
    updated_at          DATETIME      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    corp_reg_no         VARCHAR(13)   NULL,
    dividend_checked_at DATE          NULL,
    PRIMARY KEY (product_id),
    UNIQUE KEY uk_stock_products_isin (isin_cd),
    CONSTRAINT chk_payments_per_year CHECK (payments_per_year BETWEEN 1 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. price_history: 일별 종가 (배당주 종목당 최신 60행, ETF 최대 800행 유지)
CREATE TABLE IF NOT EXISTS price_history (
    price_history_id BIGINT        NOT NULL AUTO_INCREMENT,
    product_id       BIGINT        NOT NULL,
    bas_dt           DATE          NOT NULL,
    close_price      DECIMAL(15,2) NOT NULL,
    PRIMARY KEY (price_history_id),
    UNIQUE KEY uk_price_history_product_date (product_id, bas_dt),
    CONSTRAINT fk_price_history_product FOREIGN KEY (product_id) REFERENCES stock_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. dividend_history: ETF 분배금 이력 (수동 입력, 삭제 없이 누적)
CREATE TABLE IF NOT EXISTS dividend_history (
    dividend_history_id BIGINT        NOT NULL AUTO_INCREMENT,
    product_id          BIGINT        NOT NULL,
    pay_date            DATE          NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    rate                DECIMAL(5,2)  NOT NULL,
    PRIMARY KEY (dividend_history_id),
    UNIQUE KEY uk_dividend_history_product_date (product_id, pay_date),
    CONSTRAINT fk_dividend_history_product FOREIGN KEY (product_id) REFERENCES stock_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. portfolio_selections: 사용자가 저장한 포트폴리오 헤더 (회원 삭제 시 함께 삭제)
--    etf_ratio는 0~100의 10단위. 0이면 etf_type, 100이면 stock_type은 NULL 허용
CREATE TABLE IF NOT EXISTS portfolio_selections (
    selection_id BIGINT      NOT NULL AUTO_INCREMENT,
    user_id      BIGINT      NOT NULL,
    etf_type     VARCHAR(20) NULL,
    stock_type   VARCHAR(20) NULL,
    etf_ratio    TINYINT     NOT NULL,
    created_at   DATETIME    NOT NULL,
    PRIMARY KEY (selection_id),
    KEY idx_selection_user_created (user_id, created_at DESC),
    CONSTRAINT fk_selection_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT chk_etf_ratio CHECK (etf_ratio BETWEEN 0 AND 100 AND MOD(etf_ratio, 10) = 0),
    CONSTRAINT chk_type_present CHECK ((etf_ratio = 0 OR etf_type IS NOT NULL) AND (etf_ratio = 100 OR stock_type IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. recommendations: 저장된 포트폴리오의 종목별 비중·저장 당시 배당률 (상품 단위, 스냅샷)
--    selection 쪽 FK만 ON DELETE CASCADE. product 쪽 FK는 연쇄 삭제 없음(상품 데이터 보호)
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id BIGINT       NOT NULL AUTO_INCREMENT,
    selection_id      BIGINT       NOT NULL,
    product_id        BIGINT       NOT NULL,
    ratio             DECIMAL(5,2) NOT NULL,
    dividend_rate     DECIMAL(5,2) NULL,   -- 저장 당시 연 배당률(%). 스냅샷용. 컬럼 추가 전 저장분은 NULL
    PRIMARY KEY (recommendation_id),
    UNIQUE KEY uk_recommendations_selection_product (selection_id, product_id),
    KEY fk_recommendations_product (product_id),
    CONSTRAINT fk_recommendations_selection FOREIGN KEY (selection_id) REFERENCES portfolio_selections (selection_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_product FOREIGN KEY (product_id) REFERENCES stock_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. data_refresh_log: 데이터 자동 갱신(스케줄러)이 끝날 때마다 한 줄씩 쌓는 기록. 화면의 "마지막 갱신" 표시용.
--    JPA 엔티티는 없고 JdbcTemplate으로만 읽고 쓴다(ddl-auto=validate 영향 없음).
--    ok = 4단계가 모두 쓸 만하게 끝났고 문제 종목이 0건일 때 1
CREATE TABLE IF NOT EXISTS data_refresh_log (
    refresh_id    BIGINT     NOT NULL AUTO_INCREMENT,
    started_at    DATETIME   NOT NULL,
    finished_at   DATETIME   NOT NULL,
    ok            TINYINT(1) NOT NULL,
    problem_count INT        NOT NULL,
    PRIMARY KEY (refresh_id),
    KEY idx_refresh_log_finished (finished_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
