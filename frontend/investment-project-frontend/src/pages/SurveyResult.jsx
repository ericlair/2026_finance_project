import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";
import { TYPE_NAMES } from "./constants";
import { TYPE_RATIO } from "./surveyData";

const ENGINE_LABEL = { ETF: "ETF", STOCK: "배당주" };

// ETF는 파란 계열, 배당주는 초록 계열 — RatioSetting/PortfolioDetail 쪽 색 규칙과 동일하게 맞춤
const ENGINE_ACCENT = {
  ETF: { main: COLORS.primary, light: "#93C5FD" },
  STOCK: { main: COLORS.secondary, light: "#86EFAC" },
};

const TYPE_DESC = {
  PRINCIPAL: "원금을 지키는 것을 가장 중요하게 보는 유형이에요. 변동성이 낮은 쪽을 중심으로 안정적인 배당을 추구하는 포트폴리오가 어울려요.",
  BALANCED: "안정성과 수익성을 균형 있게 고려하는 유형이에요. 변동성은 낮추면서 꾸준한 배당을 추구하는 포트폴리오가 어울려요.",
  DIVIDEND: "높은 배당 수익과 정기적인 현금흐름을 중시하는 유형이에요. 변동성을 어느 정도 감수하고 배당 수익을 높이는 포트폴리오가 어울려요.",
};

const ENGINE_DESC = {
  ETF: "추천 운용 방식은 ETF예요. 여러 종목이 묶인 상품으로 분산해서 배당을 받는 방식이에요.",
  STOCK: "추천 운용 방식은 배당주예요. 개별 기업의 배당을 직접 받는 방식이에요.",
};

// type: "PRINCIPAL" | "BALANCED" | "DIVIDEND", engine: "ETF" | "STOCK"  (설문 판정 결과)
// onNext({ type, engine }) — "포트폴리오 만들기", onRetry() — "다시 검사하기"
export default function SurveyResult({ type = "BALANCED", engine = "ETF", onNext, onRetry }) {
  const { stability, profitability } = TYPE_RATIO[type];
  const resultTitle = `${ENGINE_LABEL[engine]} ${TYPE_NAMES[type]}`;
  const accent = ENGINE_ACCENT[engine];

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar variant="auth" activeTab="portfolio" />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textFaint }}>검사 결과</span>

          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: "50%",
                background: `${accent.main}1a`,
                border: `2px solid ${accent.main}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={accent.main} strokeWidth="2">
                <path d="M4 19V10M12 19V4M20 19v-7" />
              </svg>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: COLORS.textFaint }}>당신에게 어울리는 포트폴리오는</div>
            <h1 style={{ marginTop: 4, fontSize: 30, fontWeight: 700, color: accent.main, margin: 0 }}>{resultTitle}</h1>
          </div>

          <p style={{ marginTop: 18, fontSize: 14, lineHeight: 1.75, color: COLORS.textMuted }}>{TYPE_DESC[type]}</p>
          <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.75, color: COLORS.textMuted }}>{ENGINE_DESC[engine]}</p>

          <div style={{ marginTop: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6 }}>
              <span>안정성 {stability}%</span>
              <span>수익성 {profitability}%</span>
            </div>
            <div style={{ width: "100%", height: 10, borderRadius: 5, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${stability}%`, height: "100%", background: accent.light }} />
              <div style={{ width: `${profitability}%`, height: "100%", background: accent.main }} />
            </div>
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: COLORS.textFaint }}>
            학습용 참고 자료이며 투자 권유가 아니에요. 다음 화면에서 유형과 비율을 자유롭게 바꿀 수 있어요.
          </p>

          <button
            onClick={() => onNext?.({ type, engine })}
            style={{
              width: "100%",
              marginTop: 22,
              padding: 14,
              borderRadius: 12,
              background: accent.main,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            포트폴리오 만들기
          </button>
          <div style={{ marginTop: 14 }}>
            <span onClick={() => onRetry?.()} style={{ fontSize: 13, color: COLORS.textFaint, cursor: "pointer" }}>다시 검사하기</span>
          </div>
        </div>
      </div>
    </div>
  );
}