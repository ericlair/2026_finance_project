SET NAMES utf8mb4;
-- 인컴레시피(IncomeRecipe) 종목 시드: stock_products 43종목 (배당주 27 + ETF 16)
-- 기준: 2026-10-30에 실제 DB(stock_products)에서 내보낸 고정 정보
-- 실행 순서: schema_full.sql 다음에 실행 (Docker라면 01-schema.sql → 02-seed 순서)
--
-- 이 파일에 들어 있는 것: 종목명, ISIN, 카테고리, 지급 횟수, 데이터 출처, 법인등록번호 (바뀌지 않는 정보)
-- 이 파일에 없는 것: price, volatility, dividend_rate, updated_at, dividend_checked_at
--   → 가격·변동성·배당률은 갱신 배치(스케줄러)가 API로 채우는 캐시값이다. 시세 데이터는 재배포 금지라 포함하지 않는다.
--   → ETF 분배금 이력(dividend_history)도 포함하지 않는다. 비어 있으면 ETF 분배율이 계산되지 않아
--     ETF 추천이 나오지 않으므로, 별도로 입력하거나 시드를 만들어야 한다 (아래 주의 참고).
--
-- 다시 실행해도 안전하다: 같은 product_id가 이미 있으면 아무것도 바꾸지 않고 건너뛴다.
-- product_id는 개발 DB와 같게 유지했다 (20, 25는 제외된 종목이라 비어 있음).
--
-- 주의(초기 데이터): 새 DB는 가격·배당률이 비어 있다. 공공데이터 API 키를 환경변수로 넣고
--   갱신(스케줄러 또는 /demo/refresh-* )을 한 번 돌린 뒤에 추천이 정상적으로 나온다.

USE investment_portfolio;

INSERT INTO stock_products
    (product_id, name, isin_cd, category, category_type, payments_per_year, data_source, corp_reg_no)
VALUES
    (1, '한솔로지스틱스', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 2, 'API', NULL),
    (2, '한국특강', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 2, 'API', NULL),
    (3, 'HS애드', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 2, 'API', '1101110375398'),
    (4, 'SNT홀딩스', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 4, 'API', '1244110002907'),
    (5, '경농', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 1, 'API', NULL),
    (6, '교보증권', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 1, 'API', NULL),
    (7, 'SNT모티브', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 4, 'API', '1801110396069'),
    (8, '롯데쇼핑', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 2, 'API', NULL),
    (9, '한국철강', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 2, 'API', NULL),
    (10, '유안타증권', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 1, 'API', NULL),
    (11, '강원랜드', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 1, 'API', NULL),
    (12, '대신증권', NULL, 'GROUP_A_HIGH_DIVIDEND', 'SELECTIVE', 1, 'API', NULL),
    (13, 'KB금융', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 4, 'API', NULL),
    (14, '신한지주', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 4, 'API', '1101112322438'),
    (15, '하나금융지주', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 4, 'API', NULL),
    (16, '우리금융지주', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 4, 'API', NULL),
    (17, '기업은행', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 2, 'API', NULL),
    (18, '한국금융지주', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', '1101112691651'),
    (19, 'NH투자증권', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', NULL),
    (21, '삼성증권', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', NULL),
    (22, '키움증권', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', NULL),
    (23, '삼성화재', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', NULL),
    (24, '삼성생명', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', NULL),
    (26, 'DB손해보험', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', '1101110095285'),
    (27, 'KODEX 미국S&P500', 'KR7379800006', 'INDEX_SP500', 'LISTED', 4, 'MANUAL', NULL),
    (28, 'TIGER 미국S&P500', 'KR7360750004', 'INDEX_SP500', 'LISTED', 4, 'MANUAL', NULL),
    (29, 'KODEX 미국나스닥100', 'KR7379810005', 'INDEX_NASDAQ100', 'LISTED', 4, 'MANUAL', NULL),
    (30, 'TIGER 미국나스닥100', 'KR7133690008', 'INDEX_NASDAQ100', 'LISTED', 4, 'MANUAL', NULL),
    (31, 'TIGER 미국배당다우존스', 'KR7458730009', 'DOW_DIVIDEND', 'LISTED', 12, 'MANUAL', NULL),
    (32, 'SOL 미국배당다우존스', 'KR7446720005', 'DOW_DIVIDEND', 'LISTED', 12, 'MANUAL', NULL),
    (33, 'PLUS 고배당주', 'KR7161510003', 'DOMESTIC_HIGH_DIVIDEND', 'SINGLE', 12, 'MANUAL', NULL),
    (34, 'TIGER 미국배당다우존스타겟데일리커버드콜', 'KR70008S0004', 'COVERED_CALL_DOW', 'SINGLE', 12, 'MANUAL', NULL),
    (35, 'TIGER 미국S&P500타겟데일리커버드콜', 'KR7482730009', 'COVERED_CALL_SP500', 'SINGLE', 12, 'MANUAL', NULL),
    (36, 'TIGER 미국나스닥100타겟데일리커버드콜', 'KR7486290000', 'COVERED_CALL_NASDAQ100', 'SINGLE', 12, 'MANUAL', NULL),
    (37, 'SOL 200타겟위클리커버드콜', 'KR70167B0000', 'COVERED_CALL_KOSPI200', 'SINGLE', 12, 'MANUAL', NULL),
    (38, 'TIGER 배당커버드콜액티브', 'KR7472150002', 'COVERED_CALL_DOMESTIC_DIVIDEND', 'SINGLE', 12, 'MANUAL', NULL),
    (39, 'KODEX 미국배당커버드콜액티브', 'KR7441640000', 'COVERED_CALL_US_DIVIDEND_GROWTH', 'SINGLE', 12, 'MANUAL', NULL),
    (40, 'TIGER 반도체TOP10커버드콜액티브', 'KR70177R0000', 'COVERED_CALL_SEMICONDUCTOR', 'SINGLE', 12, 'MANUAL', NULL),
    (41, 'KODEX 금융고배당TOP10타겟위클리커버드콜', 'KR7498410000', 'COVERED_CALL_FINANCE', 'SINGLE', 12, 'MANUAL', NULL),
    (42, 'RISE 미국AI밸류체인데일리고정커버드콜', 'KR7490590007', 'COVERED_CALL_AI_VALUECHAIN', 'SINGLE', 12, 'MANUAL', NULL),
    (43, '삼성카드', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 1, 'API', '1101110346901'),
    (44, 'KT', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 4, 'API', '1101111468754'),
    (45, 'KT&G', NULL, 'GROUP_B_LARGE_STABLE', 'SELECTIVE', 2, 'API', '1601110067804')
ON DUPLICATE KEY UPDATE product_id = product_id;
