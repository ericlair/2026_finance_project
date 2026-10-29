import { COLORS, FONT } from "./theme";
import { GOOGLE_LOGIN_URL } from "../api/auth";

// 구글 로그인 실패 시 백엔드가 /?loginError=true 로 돌려보냄 — 쿼리스트링 읽어서 안내 문구 표시
const loginFailed = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("loginError") === "true";

export default function Login() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", fontFamily: FONT, background: COLORS.bg }}>
      {/* 좌측 브랜드 패널 */}
      <div
        style={{
          width: 480,
          flexShrink: 0,
          background: COLORS.primary,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
              <path d="M4 19V10M12 19V4M20 19v-7" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>인컴레시피</span>
        </div>
        <h1 style={{ fontSize: 28, lineHeight: 1.4, color: "#FFFFFF", margin: 0 }}>
          내 투자성향에 맞는
          <br />
          배당 포트폴리오 추천
        </h1>
        <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", maxWidth: 340 }}>
          배당주·ETF로 구성된 맞춤 포트폴리오를 로그인 후 바로 확인해 보세요.
        </p>
      </div>

      {/* 우측: 소셜 로그인만 사용 — 이메일/비밀번호 가입 없음, 처음 로그인하는 순간 서버가 계정을 만들어줌 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: 0 }}>로그인</h2>
          <p style={{ marginTop: 6, fontSize: 13, color: COLORS.textFaint }}>배당 포트폴리오 추천 서비스</p>

          {loginFailed && (
            <p
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#FEF2F2",
                color: "#DC2626",
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              로그인에 실패했어요. 다시 시도해 주세요.
            </p>
          )}

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => {
                window.location.href = GOOGLE_LOGIN_URL;
              }}
              style={{
                width: "100%",
                padding: 13,
                borderRadius: 12,
                background: "#FFFFFF",
                border: `1px solid ${COLORS.border}`,
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxSizing: "border-box",
              }}
            >
              <GoogleIcon />
              Google로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.4l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.2 4.6 6.6l-1.17 4.3c-.1.37.3.66.63.45l4.98-3.3c.31.03.63.05.96.05 5.52 0 10-3.48 10-7.8S17.52 3 12 3Z"
      />
    </svg>
  );
}