// 투자성향 설문 (초안) — 학습용 취향 설문이며 법적 투자자성향 진단이 아님.
//
// 구성: A(투자 성향) 7문항 + B(운용 방식) 3문항 = 총 10문항
//  - A: 선택지마다 score (1 = 원금집중형 쪽, 2 = 균형형 쪽, 3 = 배당집중형 쪽), 합계 7~21점
//  - B: 선택지마다 engine ("ETF" | "STOCK"), 3문항 다수결
//  - 결과: 유형(PRINCIPAL/BALANCED/DIVIDEND) × 운용 방식(ETF/STOCK) = 6가지 추천
// 선택지는 순서를 눈치채지 못하도록 질문마다 섞어서 배치함 (점수는 선택지에 붙어 있어 순서와 무관)

export const QUESTIONS = [
  {
    id: 1,
    part: "A",
    text: "포트폴리오로 이루고 싶은 가장 큰 목표는 무엇인가요?",
    options: [
      { label: "안정적으로 조금씩 불리는 것", score: 2 },
      { label: "정기적인 배당 현금흐름을 최대한 받는 것", score: 3 },
      { label: "내 돈을 잃지 않고 지키는 것", score: 1 },
    ],
  },
  {
    id: 2,
    part: "A",
    text: "이 돈을 얼마나 오래 투자해 둘 생각인가요?",
    options: [
      { label: "3년 이상", score: 3 },
      { label: "1년 이내", score: 1 },
      { label: "1~3년", score: 2 },
    ],
  },
  {
    id: 3,
    part: "A",
    text: "투자한 돈이 한 달 사이에 10% 줄었다면 어떻게 하시겠어요?",
    options: [
      { label: "더 줄기 전에 팔아서 손실을 줄인다", score: 1 },
      { label: "오히려 싸졌다고 보고 더 산다", score: 3 },
      { label: "일단 그대로 두고 지켜본다", score: 2 },
    ],
  },
  {
    id: 4,
    part: "A",
    text: "배당 수익률에 기대하는 수준은 어느 정도인가요?",
    options: [
      { label: "가능한 한 높은 배당을 원한다", score: 3 },
      { label: "적당히 높은 배당이면 좋다", score: 2 },
      { label: "은행 이자보다 조금 높으면 충분하다", score: 1 },
    ],
  },
  {
    id: 5,
    part: "A",
    text: "배당금을 받는 이유에 가장 가까운 것은 무엇인가요?",
    options: [
      { label: "배당과 안정성을 비슷하게 중요하게 본다", score: 2 },
      { label: "원금 안정이 먼저고 배당은 덤이다", score: 1 },
      { label: "용돈이나 생활비처럼 꾸준한 현금흐름이 필요하다", score: 3 },
    ],
  },
  {
    id: 6,
    part: "A",
    text: "주가가 크게 흔들리지만 배당이 높은 종목이 있다면 어떻게 하시겠어요?",
    options: [
      { label: "흔들림이 크면 피하고 싶다", score: 1 },
      { label: "일부만 담을 수 있다", score: 2 },
      { label: "배당이 높다면 괜찮다", score: 3 },
    ],
  },
  {
    id: 7,
    part: "A",
    text: "이 포트폴리오에 넣을 돈은 어떤 성격의 돈인가요?",
    options: [
      { label: "당분간 쓰지 않을 돈의 일부", score: 2 },
      { label: "오래 묵혀 둬도 되는 여유자금", score: 3 },
      { label: "생활에 필요할 수 있는 돈의 일부", score: 1 },
    ],
  },
  {
    id: 8,
    part: "B",
    text: "어떤 방식이 더 마음에 드나요?",
    options: [
      { label: "내가 아는 개별 기업의 배당을 직접 받는 것", engine: "STOCK" },
      { label: "여러 종목이 묶인 상품으로 분산해서 받는 것", engine: "ETF" },
    ],
  },
  {
    id: 9,
    part: "B",
    text: "배당금은 어떤 주기로 받고 싶나요?",
    options: [
      { label: "월 단위로 자주 받고 싶다", engine: "ETF" },
      { label: "분기나 연 단위로 받아도 괜찮다", engine: "STOCK" },
    ],
  },
  {
    id: 10,
    part: "B",
    text: "상품의 구조에 대해 어떻게 생각하나요?",
    options: [
      { label: "구조가 단순해서 이해하기 쉬운 것이 좋다", engine: "STOCK" },
      { label: "구조가 조금 복잡해도 배당과 분산이 좋다면 괜찮다", engine: "ETF" },
    ],
  },
];

// A 합계 7~21점: 7~12 원금집중형 / 13~15 균형형 / 16~21 배당집중형
// (무작위로 답했을 때 대략 25% / 50% / 25%로 나뉘도록 잡은 구간)
export const CUTOFFS = { PRINCIPAL_MAX: 12, BALANCED_MAX: 15 };

// 결과 화면에 표시할 안정성·수익성 % (유형별 고정값)
export const TYPE_RATIO = {
  PRINCIPAL: { stability: 70, profitability: 30 },
  BALANCED: { stability: 50, profitability: 50 },
  DIVIDEND: { stability: 30, profitability: 70 },
};

/**
 * answers: 질문 순서(QUESTIONS)와 같은 길이의 배열. 각 값은 그 질문에서 고른 선택지의 index.
 * 반환: { type: "PRINCIPAL"|"BALANCED"|"DIVIDEND", engine: "ETF"|"STOCK", scoreA, etfVotes }
 */
export function judgeResult(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length || answers.some((a) => a == null)) {
    throw new Error("모든 문항에 답해야 결과를 계산할 수 있습니다.");
  }
  let scoreA = 0;
  let etfVotes = 0;
  QUESTIONS.forEach((q, i) => {
    const opt = q.options[answers[i]];
    if (!opt) throw new Error(`잘못된 선택지입니다: 문항 ${q.id}`);
    if (q.part === "A") scoreA += opt.score;
    else if (opt.engine === "ETF") etfVotes += 1;
  });
  const type =
    scoreA <= CUTOFFS.PRINCIPAL_MAX ? "PRINCIPAL" : scoreA <= CUTOFFS.BALANCED_MAX ? "BALANCED" : "DIVIDEND";
  const engine = etfVotes >= 2 ? "ETF" : "STOCK";
  return { type, engine, scoreA, etfVotes };
}

// 설문 결과를 RatioSetting의 기본값(props)으로 변환
export function toRatioSettingProps({ type, engine }) {
  return {
    initialEtfType: type,
    initialStockType: type,
    initialMode: engine === "ETF" ? "etfOnly" : "stockOnly",
  };
}