import { useEffect, useState } from "react";
import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";
import { getDataStatus } from "../api/dataStatus";
import { formatPriceDate, formatRefreshedAt } from "./dataStatusFormat";

const MENU = [
  {
    key: "mypage",
    title: "마이페이지",
    desc: "검사·추천 이력 확인하기",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
      </svg>
    ),
  },
  {
    key: "resurvey",
    title: "재검사하기",
    desc: "투자성향 다시 진단받기",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: "intro",
    title: "서비스 소개",
    desc: "어떻게 추천이 이루어지는지 보기",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  {
    key: "makePortfolio",
    title: "포트폴리오 만들기",
    desc: "최근 설문 결과로 바로 보기",
    highlight: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
        <path d="M3 3v18h18M7 14l4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    key: "compoundCalc",
    title: "복리 계산기",
    desc: "적립식 투자 시뮬레이션",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h2M12 10h2M16 10h2M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2M16 18h2" />
      </svg>
    ),
  },
  {
    key: "rebalanceCalc",
    title: "리밸런싱 계산기",
    desc: "목표 비중대로 맞추기",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <path d="M3 17h4v4H3zM10 10h4v11h-4zM17 4h4v17h-4z" />
      </svg>
    ),
  },
];

// userName / investorType — GET /api/auth/me 응답으로 채움
// isLoggedIn — 로그인 여부 (true면 Navbar가 "auth" variant: 마이페이지·로그아웃·아바타, false면 로그인/회원가입 버튼)
// onNavigate(key) — key: "mypage" | "intro" | "survey" | "ratioSetting"
export default function Landing({ userName = "회원", investorType = null, isLoggedIn = false, userInitial, onNavigate, onLogin, onLogout }) {
  // "시세 기준일 · 마지막 갱신" 한 줄 — 화면 열릴 때 한 번만 조회. 실패(현재는 비로그인 401)하면 조용히 숨김
  const [dataStatus, setDataStatus] = useState(null);
  useEffect(() => {
    let ignore = false;
    getDataStatus()
      .then((s) => { if (!ignore) setDataStatus(s); })
      .catch(() => { if (!ignore) setDataStatus(null); });
    return () => { ignore = true; };
  }, []);

  const handleMenuClick = (key) => {
    // 포트폴리오는 로그인해야 받을 수 있음 — 설문 다 풀고 나서 막으면 속은 느낌이 들 수 있어서
    // 시작 전인 여기서 바로 로그인으로 보냄(설문/재검사 둘 다)
    if ((key === "makePortfolio" || key === "resurvey") && !isLoggedIn) {
      onLogin?.("portfolio");
      return;
    }
    if (key === "makePortfolio") {
      // investorType이 있으면(=이미 진단됨) 바로 비율설정으로, 없으면 설문부터
      onNavigate?.(investorType ? "ratioSetting" : "survey");
      return;
    }
    if (key === "resurvey") {
      onNavigate?.("survey");
      return;
    }
    onNavigate?.(key); // mypage, intro
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar
        variant={isLoggedIn ? "auth" : "public"}
        userInitial={userInitial}
        onMyPage={() => onNavigate?.("mypage")}
        onLogout={onLogout}
        onLogin={onLogin}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, padding: "20px 64px" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: COLORS.text, margin: 0 }}>안녕하세요, {userName} 님</h1>
          <p style={{ marginTop: 10, fontSize: 14, color: COLORS.textMuted }}>오늘은 무엇을 도와드릴까요?</p>
          {/* 비로그인이면 버튼을 누르기 전부터 미리 안내 — 설문 다 풀고 나서 로그인 막으면 속은 느낌이 들 수 있어서 */}
          {!isLoggedIn && (
            <p
              style={{
                marginTop: 14,
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: 999,
                background: COLORS.primaryLight,
                color: COLORS.primary,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              배당 포트폴리오를 받으려면 로그인이 필요해요
            </p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 18, width: "100%", maxWidth: 680 }}>
          {MENU.map((item) => (
            <div
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 22,
                borderRadius: 14,
                background: item.highlight ? COLORS.primary : "#FFFFFF",
                border: item.highlight ? "none" : `1px solid ${COLORS.border}`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: item.highlight ? "rgba(255,255,255,0.15)" : COLORS.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: item.highlight ? "#FFFFFF" : COLORS.text }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, marginTop: 2, color: item.highlight ? "rgba(255,255,255,0.75)" : COLORS.textFaint }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 64px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderTop: `1px solid ${COLORS.border}` }}>
        <span style={{ fontSize: 11, color: COLORS.textFaint }}>인컴레시피 · 개인프로젝트</span>
        {dataStatus && dataStatus.latestPriceDate && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.textFaint }}>
            <span>
              시세 기준일: {formatPriceDate(dataStatus.latestPriceDate)}
              {dataStatus.lastRefreshedAt ? ` · 마지막 갱신: ${formatRefreshedAt(dataStatus.lastRefreshedAt)}` : ""}
              {dataStatus.refreshing ? " · 데이터 갱신 중이에요" : ""}
            </span>
            <span
              title="공공 데이터는 영업일 다음 날 오후 1시 이후에 제공돼요. 금요일 종가는 월요일에 반영돼요."
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                border: `1px solid ${COLORS.textFaint}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8.5,
                cursor: "help",
                flexShrink: 0,
              }}
            >
              i
            </span>
          </div>
        )}
      </div>
    </div>
  );
}