# DB 테이블 설계 명세서

투자성향 기반 금융상품 추천 웹서비스 — 테이블 4개 구성

---

## 1. users (사용자)

**설계 의도**: 서비스 이용자의 기본 정보와 인증 정보를 저장

| 컬럼 | 타입 | 제약조건 | 설계 이유 |
|---|---|---|---|
| user_id | BIGINT | PK, AUTO_INCREMENT | 사용자를 고유하게 식별하는 값. 이메일 대신 별도 숫자 ID를 PK로 둔 이유는, 다른 테이블(investment_profiles, recommendations)에서 참조(FK)할 때 문자열보다 정수형이 조회 속도와 저장 공간 면에서 효율적이기 때문 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 로그인 아이디로 사용. UNIQUE 제약으로 중복 가입 방지 |
| password | VARCHAR(255) | NOT NULL | 로그인 인증용. Spring Security의 BCrypt로 암호화되어 저장 (평문 저장 금지) |
| name | VARCHAR(50) | NOT NULL | 사용자 이름, 화면 표시용 |
| created_at | DATETIME | NOT NULL | 가입일시 기록. 가입 추이 등 부가 통계에 활용 가능 |

---

## 2. investment_profiles (투자성향 검사 이력)

**설계 의도**: 사용자가 투자성향 설문을 볼 때마다 결과를 이력으로 남기기 위한 테이블

| 컬럼 | 타입 | 제약조건 | 설계 이유 |
|---|---|---|---|
| profile_id | BIGINT | PK, AUTO_INCREMENT | **별도 PK를 둔 이유**: 한 사용자(user_id)가 투자성향 검사를 여러 번 볼 수 있다고 설계했기 때문에, user_id만으로는 각 검사 기록을 구분할 수 없음. profile_id로 검사 회차 하나하나를 고유하게 식별 |
| user_id | BIGINT | FK → users.user_id | 이 검사 결과가 누구의 것인지 연결 |
| score | INT | NOT NULL | 설문 응답을 점수화한 값. 점수 구간에 따라 유형(type)을 분류하는 기준 데이터로 사용 |
| type | VARCHAR(20) | NOT NULL | 분류된 투자성향 유형("원금집중형"/"균형형"/"배당집중형"). 추천 로직에서 이 값을 기준으로 상품 필터링 |
| tested_at | DATETIME | NOT NULL | 검사 시점 기록. 이력 관리 목적(예: 성향이 시간에 따라 어떻게 바뀌었는지 추적 가능) |

**1:N 관계**: users(1) : investment_profiles(N) — 한 사용자가 여러 번 검사 가능

---

## 3. stock_products (금융상품)

**설계 의도**: 추천 대상이 되는 배당주/ETF 상품 정보와, 자동 수집 데이터와 수동 조사 데이터를 구분해서 관리

| 컬럼 | 타입 | 제약조건 | 설계 이유 |
|---|---|---|---|
| product_id | BIGINT | PK, AUTO_INCREMENT | 상품 고유 식별자 |
| name | VARCHAR(100) | NOT NULL | 상품명 (예: "삼성전자", "KODEX 200타겟위클리커버드콜") |
| category | VARCHAR(20) | - | "개별주식" / "ETF" 구분. 유형별 추천 로직에서 상품군을 나눠 처리하기 위함 |
| suitable_type | VARCHAR(20) | - | 이 상품이 어떤 투자성향에 적합한지 미리 태깅. 추천 시 investment_profiles.type과 매칭하는 데 사용 |
| dividend_rate | DECIMAL(5,2) | - | 배당률/분배율. 안정성·수익성 분석의 핵심 지표 |
| price | DECIMAL(15,2) | - | 현재가. API로 자동 갱신되는 값 |
| volatility | DECIMAL(5,2) | - | 변동성 지표. 안정성 판단 기준으로 활용 |
| data_source | VARCHAR(10) | - | **핵심 설계 포인트**: "API" 또는 "MANUAL" 값으로 이 데이터가 자동 수집인지 수동 조사인지 구분. 배당주(개별기업)는 공공데이터 API로 자동화되지만, ETF 분배금은 API가 없어 수동 조사로 보완했기 때문에 이 둘을 같은 테이블·같은 로직으로 처리하면서도 출처를 명확히 구분하기 위해 추가 |
| updated_at | DATETIME | - | 마지막 갱신 시각. data_source가 MANUAL인 경우 "언제 기준 데이터인지" 명시하는 용도로도 활용 |

---

## 4. recommendations (추천 결과)

**설계 의도**: 특정 사용자에게 특정 시점에 어떤 상품을 얼마의 비중으로 추천했는지 기록

| 컬럼 | 타입 | 제약조건 | 설계 이유 |
|---|---|---|---|
| recommendation_id | BIGINT | PK, AUTO_INCREMENT | 추천 결과 각 건을 고유하게 식별 |
| user_id | BIGINT | FK → users.user_id | 누구에게 한 추천인지 연결 |
| product_id | BIGINT | FK → stock_products.product_id | 어떤 상품을 추천했는지 연결 |
| ratio | DECIMAL(5,2) | - | 포트폴리오 내 해당 상품의 추천 비중(%). 여러 상품이 조합된 포트폴리오를 표현하기 위해 하나의 추천에 여러 행(row)이 생기는 구조 |
| created_at | DATETIME | - | 추천이 생성된 시점. 가격/변동성 데이터가 배치 주기(주 단위)로 갱신되면서 추천 결과도 시점에 따라 달라질 수 있어, 언제 생성된 추천인지 구분하기 위함 |

**1:N 관계**:
- users(1) : recommendations(N) — 한 사용자에게 여러 상품이 추천됨(포트폴리오 구성)
- stock_products(1) : recommendations(N) — 한 상품이 여러 사용자에게 추천될 수 있음

---

## 설계 시 고려한 원칙

1. **이력 관리**: 투자성향(investment_profiles)과 추천 결과(recommendations)는 매번 새로운 행으로 쌓이는 구조로 설계하여, 사용자가 시간에 따라 어떻게 변화했는지 추적 가능
2. **데이터 출처 구분**: stock_products의 data_source 컬럼으로 자동/수동 데이터를 명확히 구분해, 서로 다른 방식으로 수집된 데이터를 하나의 일관된 구조로 관리
3. **네이밍 규칙**: 테이블명은 복수형 snake_case(users, investment_profiles 등)로 통일하여 Spring Data JPA의 자동 매핑 관례를 따름