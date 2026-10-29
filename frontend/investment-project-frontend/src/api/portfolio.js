// api/portfolio.js
// 백엔드 확정 스펙(2026-10-28):
// GET /api/portfolio/selections → 배열: { id, createdAt, etfType, stockType, etfRatio, stockRatio, holdingCount }
// POST /api/portfolio/selections → 요청 { etfType, stockType, etfRatio } (비중 0/100이면 반대쪽 type은 null 가능)
//   응답 201 + { id, createdAt, etfType, stockType, etfRatio, stockRatio, holdingCount, avgRate, etf, stock, warnings }
// DELETE /api/portfolio/selections/{id} → 204 (없거나 남의 id면 404)
// mode 필드는 서버에 없음 — etfRatio로 판단 (100=ETF만, 0=배당주만, 그 외=블렌딩)
// 비로그인은 401 { error: "로그인이 필요합니다." } — MyPage에서 빈 목록으로 처리

// 포트폴리오 계산 결과 조회 (PortfolioDetail 에서 사용)
// 서버: GET /api/portfolio/blend?etfType=&stockType=&etfRatio=
// 비율이 0 이면 etfType, 100 이면 stockType 은 생략해도 됨
export async function fetchBlend({ etfType, stockType, etfRatio }) {
  const params = new URLSearchParams();
  if (etfType) params.set("etfType", etfType);
  if (stockType) params.set("stockType", stockType);
  params.set("etfRatio", String(etfRatio));
  const res = await fetch(`/api/portfolio/blend?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getSelections() {
  const res = await fetch("/api/portfolio/selections", { credentials: "include" });
  if (!res.ok) {
    // 401(비로그인) 등 상태코드를 호출 쪽에서 구분할 수 있게 status를 달아서 던짐
    const err = new Error(`GET /api/portfolio/selections 실패: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// 저장된 포트폴리오 1건 상세 — 마이페이지 이력에서 조회(readOnly)할 때 사용. /api/portfolio/blend(현재 시세)와 달리
// 전부 "저장 당시" 값이 그대로 내려옴: { id, createdAt, etfType, stockType, etfRatio, stockRatio, holdingCount, avgRate,
//   etf:{ratio, avgRate, holdings:[{name, category, kind, weight, rate}]}, stock:{같은 모양} } — 비율 0인 쪽은 null
// 404면 없는 항목(삭제됐거나 남의 id) — 호출 쪽(PortfolioDetail)에서 마이페이지로 돌려보내 목록을 새로 불러오게 함
export async function getSelection(id) {
  const res = await fetch(`/api/portfolio/selections/${id}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error ?? `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function deleteSelection(id) {
  const res = await fetch(`/api/portfolio/selections/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /api/portfolio/selections/${id} 실패: ${res.status}`);
}

// 포트폴리오 상세 "이 포트폴리오로 선택하기"에서 호출. mode는 서버가 안 받으니 body에서 뺌(프론트 내부용으로만 들어올 수 있어 구조분해로 버림)
export async function createSelection({ etfRatio, etfType, stockType }) {
  const res = await fetch("/api/portfolio/selections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ etfType, stockType, etfRatio }),
  });
  if (!res.ok) {
    // 401 { error: "로그인이 필요합니다." }, 400 { error: "..." } — 서버가 주는 문구를 그대로 화면에 보여줄 수 있게 꺼내서 던짐
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}