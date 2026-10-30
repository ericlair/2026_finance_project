// 백엔드 확정 스펙(2026-10-30) — 같은 카테고리 ETF를 한 줄로 묶는 공용 함수.
// 포트폴리오 결과 화면(fetchBlend), 저장 항목 보기(getSelection), 리밸런싱 계산기에서 공통으로 사용.
// 입력: etf.holdings 또는 stock.holdings ({name, category, kind, weight, rate})
// - ETF는 category로 묶고(상품 개수 무관), 배당주와 상품이 1개뿐인 카테고리(커버드콜 등)는 그대로(count=1)
// - 연배당(rate)은 단순평균, 묶인 것 중 하나라도 null이면 null(화면에서 "-")
export function groupHoldings(holdings) {
  const map = new Map();
  for (const h of holdings) {
    const key = h.kind === "ETF" ? `ETF:${h.category}` : `STOCK:${h.name}`;
    const g = map.get(key) ?? { kind: h.kind, category: h.category, names: [], weight: 0, rates: [] };
    g.names.push(h.name);
    g.weight += h.weight;
    g.rates.push(h.rate);
    map.set(key, g);
  }
  return [...map.values()].map((g) => ({
    kind: g.kind,
    category: g.category,
    name: g.names.join(" / "),
    count: g.names.length,
    weight: Math.round(g.weight * 100) / 100,
    rate: g.rates.some((r) => r == null)
      ? null
      : Math.round((g.rates.reduce((a, b) => a + b, 0) / g.rates.length) * 100) / 100,
  }));
}

// count가 2 이상인(여러 상품이 한 줄로 묶인) 줄에 붙이는 안내 문구
export const MERGED_HOLDING_NOTE = "같은 지수를 추종하는 상품이에요. 한 상품에 몰아서 사도, 나눠서 사도 돼요.";