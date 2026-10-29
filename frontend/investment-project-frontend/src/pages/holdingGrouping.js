// holdings(kind, category, weight, rate, name)를 받아서, 같은 카테고리에 묶인 ETF가 2개 이상이면 한 줄로 합쳐주는 공용 함수.
// 포트폴리오 상세(PortfolioDetail, readOnly 조회 포함)와 리밸런싱 계산기(RebalanceCalculator)에서 같이 사용.
// - kind === "ETF"만 category로 묶음. 2개 이상이면 합침:
//   · name: " / "로 연결 (예: "KODEX 미국S&P500 / TIGER 미국S&P500") — 개수 가정 없이 몇 개든 동작
//   · weight: 합계
//   · rate: 단순평균, 묶인 것 중 하나라도 null이면 null
// - 카테고리에 1개뿐인 ETF(커버드콜 등)와 배당주(kind !== "ETF")는 그대로 둠
// - 원래 등장 순서를 유지
export function groupEtfHoldings(holdings) {
  const order = [];
  const groups = new Map();

  for (const h of holdings) {
    if (h.kind !== "ETF") {
      order.push({ single: h });
      continue;
    }
    const key = `cat:${h.category}`;
    let g = groups.get(key);
    if (!g) {
      g = { items: [] };
      groups.set(key, g);
      order.push(g);
    }
    g.items.push(h);
  }

  return order.map((entry) => {
    if (entry.single) return entry.single;
    const { items } = entry;
    if (items.length === 1) return items[0];

    const name = items.map((h) => h.name).join(" / ");
    const weight = Math.round(items.reduce((sum, h) => sum + h.weight, 0) * 100) / 100;
    const hasNullRate = items.some((h) => h.rate == null);
    const rate = hasNullRate ? null : Math.round((items.reduce((sum, h) => sum + h.rate, 0) / items.length) * 100) / 100;

    return {
      name,
      category: items[0].category,
      kind: "ETF",
      weight,
      rate,
      merged: true,
    };
  });
}

export const MERGED_HOLDING_NOTE = "같은 지수를 추종하는 상품이에요. 한 상품에 몰아서 사도, 나눠서 사도 돼요.";