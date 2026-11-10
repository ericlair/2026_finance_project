import { COLORS } from "./theme";

// variant: "public" (로그인/소개 버튼) | "auth" (마이페이지 + 아바타)
// onMyPage — variant="auth"에서 마이페이지/아바타 클릭 시 호출
// onLogout — 넘겨줄 때만 로그아웃 링크가 보임(랜딩 화면에서만 씀)
// onLogin — variant="public"일 때 로그인 버튼
export default function Navbar({ variant = "public", userInitial = "김", onMyPage, onLogout, onLogin }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 64px",
        height: 72,
        borderBottom: `1px solid ${COLORS.border}`,
        flexShrink: 0,
        background: COLORS.white,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: COLORS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <path d="M4 19V10M12 19V4M20 19v-7" />
          </svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>인컴레시피</span>
      </div>

      {variant === "public" && (
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 14, color: COLORS.textMuted }}>서비스 소개</span>
          <button
            onClick={onLogin}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.text,
              padding: "9px 18px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 9,
              background: "none",
              cursor: "pointer",
            }}
          >
            로그인
          </button>
          <button
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.white,
              padding: "9px 18px",
              background: COLORS.primary,
              border: "none",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            회원가입
          </button>
        </div>
      )}

      {variant === "auth" && (
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <span
            onClick={onMyPage}
            style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMuted, cursor: "pointer" }}
          >
            마이페이지
          </span>
          {onLogout && (
            <span
              onClick={onLogout}
              style={{ fontSize: 13, color: COLORS.textFaint, cursor: "pointer" }}
            >
              로그아웃
            </span>
          )}
          <div
            onClick={onMyPage}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: COLORS.primaryLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.primary,
              cursor: "pointer",
            }}
          >
            {userInitial}
          </div>
        </div>
      )}
    </div>
  );
}