// 투자성향 3유형 — 백엔드 응답 규약과 동일한 값 사용 (PRINCIPAL / BALANCED / DIVIDEND)
export const TYPE_NAMES = {
  PRINCIPAL: "원금집중형",
  BALANCED: "균형형",
  DIVIDEND: "배당집중형",
};

// 유형별 안정성:수익성 고정 비율 (SurveyResult 표시용)
export const TYPE_RATIOS = {
  PRINCIPAL: { stability: 70, profitability: 30 },
  BALANCED: { stability: 50, profitability: 50 },
  DIVIDEND: { stability: 30, profitability: 70 },
};

// 선택 UI(RatioSetting 등)에서 순서대로 뿌릴 때 쓰는 리스트
// "추천" 표시는 더 이상 여기 고정값이 아니라 설문 결과(surveyResult.type)를 따라 RatioSetting에서 동적으로 계산함
export const TYPE_LIST = [
  { key: "PRINCIPAL", name: TYPE_NAMES.PRINCIPAL },
  { key: "BALANCED", name: TYPE_NAMES.BALANCED },
  { key: "DIVIDEND", name: TYPE_NAMES.DIVIDEND },
];

// Landing의 "포트폴리오 만들기"에서 쓰는 설문 결과 임시 저장 키
// 서버 저장이 없으므로 localStorage만 사용 — try/catch로 감싸서 사용할 것
export const SURVEY_RESULT_STORAGE_KEY = "latestSurveyResult";