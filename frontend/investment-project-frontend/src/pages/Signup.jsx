import { COLORS, FONT } from "./theme";

export default function Signup() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", fontFamily: FONT, background: COLORS.bg }}>
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
          몇 가지 정보만 입력하면
          <br />
          바로 시작할 수 있어요
        </h1>
        <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", maxWidth: 340 }}>
          가입 후 투자성향 설문을 진행하면, 유형에 맞는 배당 포트폴리오를 바로 추천해 드려요.
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "28px 56px 0 56px" }}>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>
            이미 계정이 있으신가요?{" "}
            <span style={{ color: COLORS.primary, fontWeight: 700, cursor: "pointer" }}>로그인</span>
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 340 }}>
            <h2 style={{ fontSize: 24, color: COLORS.text, margin: 0 }}>회원가입</h2>

            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <Field id="su-name" label="이름" type="text" placeholder="홍길동" />
              <Field id="su-email" label="이메일" type="email" placeholder="you@example.com" />
              <Field id="su-pw" label="비밀번호" type="password" placeholder="8자 이상" />
              <Field id="su-pw2" label="비밀번호 확인" type="password" placeholder="비밀번호 재입력" />
            </div>

            <button
              style={{
                width: "100%",
                marginTop: 22,
                padding: 14,
                borderRadius: 12,
                background: COLORS.primary,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              가입하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, type, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textMuted }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        style={{
          fontFamily: FONT,
          fontSize: 14,
          padding: "12px 14px",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          background: "#FFFFFF",
          color: COLORS.text,
          boxSizing: "border-box",
          width: "100%",
        }}
      />
    </div>
  );
}