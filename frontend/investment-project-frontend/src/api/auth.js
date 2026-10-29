// api/auth.js
// Vite proxy 설정: /api, /oauth2 → http://localhost:8080 (vite.config.js에서 처리)

// 백엔드 이트 확인 사항:
// - 로그인 버튼은 http://localhost:8080/oauth2/authorization/google 로 이동하는 링크
// - GET /api/auth/me를 credentials: "include"로 호출해 로그인 여부 판단. 401이면 비로그인
// - 로그아웃은 POST /api/auth/logout, 탈퇴는 DELETE /api/auth/me
// - 로그인 실패 시 /?loginError=true 로 리다이렉트됨
export const GOOGLE_LOGIN_URL = "http://localhost:8080/oauth2/authorization/google";


// 로그인한 사용자 정보 + 투자성향 조회
// 200 응답: { id, name, email, investorType, preferredEngine } — email/investorType/preferredEngine은 null일 수 있음
// preferredEngine: "ETF" | "STOCK" | null — 서버가 들고 있는 값이라, 이번 세션 설문 없이 들어와도 추천 뱃지 표시에 쓸 수 있음
// 401(비로그인)은 에러로 던지지 않고 null을 반환함 — 호출 쪽에서 "로그인 안 됨"으로 바로 처리 가능하게
export async function getMe() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /api/auth/me 실패: ${res.status}`);
  return res.json();
}

// 로그아웃
export async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`POST /api/auth/logout 실패: ${res.status}`);
}

// 설문 결과로 판정된 투자성향 + 운용방식 선호를 서버에 확정 저장 (사용자당 1건, 덮어쓰기) — 실 DB 테스트 완료(2026-10-28)
// 설문 문항·채점·판정은 전부 프론트에서 끝낸 뒤 결과값만 전달함 — 설문 이력/문항 관련 API는 없음
// PUT /api/users/me/investor-type, body { investorType, preferredEngine } — 둘 다 보내거나, 둘 다 null로 보내면 초기화(resetInvestorType)
// 응답(200): /api/auth/me와 같은 모양 { id, name, email, investorType, preferredEngine }
// 로그인 상태일 때만 호출할 것(미로그인은 401) — 호출 쪽(App.jsx)에서 user 유무로 분기함
export async function updateInvestorType(type, engine) {
  const res = await fetch("/api/users/me/investor-type", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ investorType: type, preferredEngine: engine }),
  });
  if (!res.ok) throw new Error(`PUT /api/users/me/investor-type 실패: ${res.status}`);
  return res.json();
}

// 투자성향 + 운용방식 선호 초기화 — 같은 엔드포인트에 둘 다 null로 보내면 초기화됨 (백엔드 확정 스펙, 2026-10-28)
export async function resetInvestorType() {
  return updateInvestorType(null, null);
}

// 회원 탈퇴
export async function deleteAccount() {
  const res = await fetch("/api/auth/me", {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /api/auth/me 실패: ${res.status}`);
}