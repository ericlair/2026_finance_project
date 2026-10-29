import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";

const TYPES = [
  { name: "원금집중형", desc: "저·중배당 2~8% · 원금 안정 중시", color: COLORS.primary },
  { name: "균형형", desc: "안정성과 수익성의 균형", color: COLORS.secondary },
  { name: "배당집중형", desc: "고배당 8~15% · 정기 현금흐름 중시", color: "#F59E0B" },
];

export default function Intro() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar variant="public" />

      <div style={{ padding: "44px 64px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4, color: COLORS.text, margin: 0 }}>
            내 투자성향에 맞는 배당 포트폴리오 추천
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: COLORS.textMuted, maxWidth: 600 }}>
            간단한 설문으로 투자성향을 진단하고, 배당주·ETF로 구성된 맞춤 포트폴리오를 확인해 보세요.
          </p>

          <div style={{ marginTop: 36, fontSize: 13, fontWeight: 700, color: COLORS.textFaint }}>투자성향 3유형</div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 }}>
            {TYPES.map((t) => (
              <div key={t.name} style={{ padding: 20, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{t.name}</div>
                <div style={{ fontSize: 12.5, color: COLORS.textFaint, marginTop: 6, lineHeight: 1.6 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36, fontSize: 13, fontWeight: 700, color: COLORS.textFaint }}>포트폴리오 구성 방식</div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
            <div style={{ padding: 22, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.primary }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>배당주 포트폴리오</div>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: COLORS.textMuted }}>
                대형 금융지주·증권사 등 안정적인 종목과, 정기적인 현금흐름을 꾸준히 지급해온 이력을 검토해 선별한
                고배당 종목들을 함께 구성해, 투자성향에 맞는 비중으로 배분한 결과입니다.
              </p>
            </div>
            <div style={{ padding: 22, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.secondary }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>ETF 포트폴리오</div>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: COLORS.textMuted }}>
                미국 대표지수(S&amp;P500 등)와 다우존스 배당지수를 추종하는 ETF를 중심으로, 커버드콜 및 산업섹터
                ETF를 함께 구성해, 투자성향에 맞는 비중으로 배분한 결과입니다.
              </p>
            </div>
          </div>

          <button
            style={{
              marginTop: 36,
              background: COLORS.primary,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              padding: "14px 32px",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}