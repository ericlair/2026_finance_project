import { useState } from "react";
import { FONT } from "./theme";

// 첫 방문 시(또는 설정탭의 "다시보기")에만 보여주는 온보딩 프롤로그.
// 노출 여부(최초 1회) 판단은 App.jsx에서 localStorage("hasSeenPrologue")로 처리하고,
// 이 컴포넌트는 "끝까지 보면 onFinish 호출"만 책임진다.

const INK = "#0B1220"; // 짙은 네이비 배경 — 신뢰감
const PAPER = "#F5F4EF"; // 따뜻한 화이트 텍스트
const MUTED = "rgba(245,244,239,0.56)";
const BLUE = "#2563EB";
const GREEN = "#16A34A";

// 막대 4개가 탭할 때마다 하나씩 자산처럼 쌓여간다 — "포트폴리오가 채워지는" 과정을 그대로 시각화
const BAR_HEIGHTS = [34, 58, 46, 90];

const INTRO_STEPS = [
  { title: "안녕하세요", body: "인컴레시피에 오신 걸 환영해요" },
  { title: "ETF, 배당주… 처음엔 다 어렵죠", body: "지금 투자를 고민 중이시라면, 그건 아주 당연한 거예요" },
  { title: "용어도, 비교도 저희가 대신할게요", body: "복잡한 종목 분석은 여기서 끝내셔도 돼요" },
  { title: "투자성향에 맞춰 드려요", body: "안정형부터 공격형까지, 꼭 맞는 조합으로 골라드려요" },
];

const RESULT_CONTENT = {
  know: { title: "좋아요, 바로 만들어볼까요?", body: "투자성향에 맞는 조합을 바로 알려드릴게요" },
  unknow: {
    title: "걱정 마세요",
    body: "ETF와 배당주 차이는 서비스소개에서 친절하게 알려드릴게요. 종목과 비중은 저희가 알아서 골라드려요",
  },
};

// phase: "intro"(탭해서 진행) → "question"(ETF/배당주 아는지) → "result"(답에 따라 다른 안내 + 로그인하러가기)
export default function Prologue({ onFinish }) {
  const [phase, setPhase] = useState("intro");
  const [introIndex, setIntroIndex] = useState(0);
  const [answer, setAnswer] = useState(null); // "know" | "unknow"

  const isLastIntro = introIndex === INTRO_STEPS.length - 1;

  const handleAdvance = () => {
    if (phase !== "intro") return;
    if (!isLastIntro) {
      setIntroIndex((i) => i + 1);
    } else {
      setPhase("question");
    }
  };

  const handleAnswer = (value) => {
    setAnswer(value);
    setPhase("result");
  };

  const activeBars = phase === "intro" ? introIndex + 1 : BAR_HEIGHTS.length;
  const step = phase === "intro" ? INTRO_STEPS[introIndex] : null;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: INK,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes plgRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .plg-text { animation: plgRise 0.55s cubic-bezier(.2,.7,.2,1) forwards; }
      `}</style>

      {/* 은은한 블루→그린 글로우 — 포인트는 여기 하나로 제한 */}
      <div
        style={{
          position: "absolute",
          right: "-10%",
          top: "18%",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BLUE}33 0%, ${GREEN}1a 45%, transparent 70%)`,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 56px 0 56px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PAPER} strokeWidth="2.5">
              <path d="M4 19V10M12 19V4M20 19v-7" />
            </svg>
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: PAPER }}>인컴레시피</span>
        </div>
        <span onClick={onFinish} style={{ fontSize: 12.5, color: MUTED, cursor: "pointer" }}>
          건너뛰기
        </span>
      </div>

      <div
        onClick={phase === "intro" ? handleAdvance : undefined}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 72,
          padding: "20px 56px",
          flexWrap: "wrap",
          position: "relative",
          cursor: phase === "intro" ? "pointer" : "default",
        }}
      >
        {phase === "intro" && (
          <div key={introIndex} className="plg-text" style={{ maxWidth: 400, minWidth: 280 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, 'Noto Serif KR', serif",
                fontSize: 34,
                lineHeight: 1.35,
                color: PAPER,
                letterSpacing: "-0.01em",
              }}
            >
              {step.title}
            </h1>
            <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: MUTED, maxWidth: 360 }}>{step.body}</p>
            <span style={{ display: "inline-block", marginTop: 26, fontSize: 13, color: MUTED }}>
              {isLastIntro ? "탭해서 시작하기" : "탭해서 다음"} ›
            </span>
          </div>
        )}

        {phase === "question" && (
          <div key="question" className="plg-text" style={{ maxWidth: 400, minWidth: 280 }} onClick={(e) => e.stopPropagation()}>
            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, 'Noto Serif KR', serif",
                fontSize: 30,
                lineHeight: 1.4,
                color: PAPER,
                letterSpacing: "-0.01em",
              }}
            >
              ETF와 배당주의 차이를 아시나요?
            </h1>
            <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
              <button
                onClick={() => handleAnswer("know")}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "transparent",
                  border: `1px solid rgba(245,244,239,0.3)`,
                  color: PAPER,
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                알아요
              </button>
              <button
                onClick={() => handleAnswer("unknow")}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "transparent",
                  border: `1px solid rgba(245,244,239,0.3)`,
                  color: PAPER,
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                몰라요
              </button>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div key="result" className="plg-text" style={{ maxWidth: 400, minWidth: 280 }} onClick={(e) => e.stopPropagation()}>
            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, 'Noto Serif KR', serif",
                fontSize: 32,
                lineHeight: 1.4,
                color: PAPER,
                letterSpacing: "-0.01em",
              }}
            >
              {RESULT_CONTENT[answer].title}
            </h1>
            <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: MUTED, maxWidth: 360 }}>
              {RESULT_CONTENT[answer].body}
            </p>
            <button
              onClick={onFinish}
              style={{
                marginTop: 30,
                padding: "13px 30px",
                borderRadius: 10,
                background: PAPER,
                color: INK,
                fontSize: 14.5,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {/* 막대그래프 — 탭할 때마다 자산처럼 쌓인다. 질문/결과 단계에서는 다 채워진 상태로 둠 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 110 }}>
          {BAR_HEIGHTS.map((h, i) => {
            const active = i < activeBars;
            return (
              <div
                key={i}
                style={{
                  width: 20,
                  height: active ? h : 10,
                  borderRadius: 5,
                  background: active ? `linear-gradient(180deg, ${BLUE}, ${GREEN})` : "rgba(245,244,239,0.1)",
                  transition: "height 0.5s cubic-bezier(.2,.8,.2,1), background 0.5s",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}