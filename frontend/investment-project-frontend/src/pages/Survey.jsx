import { useState } from "react";
import { COLORS, FONT } from "./theme";
import { QUESTIONS, judgeResult } from "./surveyData";

const PART_LABEL = { A: "투자 성향", B: "운용 방식" };
// A(투자성향)는 파랑, B(운용방식=ETF·배당주 성향)는 초록 — 결과화면/비율설정과 같은 색 규칙
const PART_COLOR = { A: COLORS.primary, B: COLORS.secondary };

// onFinish({ type, engine, scoreA, etfVotes }) — 마지막 문항에서 "결과 보기"를 누르면 호출
// onCancel() — 상단 "취소"를 누르면 호출
export default function Survey({ onFinish, onCancel }) {
  const totalSteps = QUESTIONS.length;
  const [step, setStep] = useState(0); // 0부터 시작하는 현재 문항 위치
  const [answers, setAnswers] = useState(() => Array(QUESTIONS.length).fill(null)); // 문항별로 고른 선택지 index

  const question = QUESTIONS[step];
  const selected = answers[step];
  const currentStep = step + 1;
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;
  const canNext = selected !== null;
  const accent = PART_COLOR[question.part];

  const select = (idx) => setAnswers((prev) => prev.map((a, i) => (i === step ? idx : a)));

  const goPrev = () => {
    if (!isFirst) setStep(step - 1);
  };

  const goNext = () => {
    if (!canNext) return;
    if (isLast) {
      onFinish?.(judgeResult(answers));
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 64px", height: 72, borderBottom: `1px solid ${COLORS.border}`, background: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
              <path d="M4 19V10M12 19V4M20 19v-7" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>인컴레시피</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>
            {currentStep} / {totalSteps}
          </span>
          <span onClick={() => onCancel?.()} style={{ fontSize: 13, color: COLORS.textFaint, cursor: "pointer" }}>취소</span>
        </div>
      </div>

      <div style={{ padding: "20px 64px 0 64px" }}>
        <div style={{ width: "100%", maxWidth: 640, margin: "0 auto", height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${(currentStep / totalSteps) * 100}%`, height: "100%", background: accent, transition: "width 0.2s, background 0.2s" }} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10 }}>{PART_LABEL[question.part]}</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5, color: COLORS.text, margin: 0 }}>
            {question.text}
          </h3>

          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
            {question.options.map((opt, idx) => {
              const inputId = `q${question.id}-${idx}`;
              const isChecked = selected === idx;
              return (
                <label
                  key={inputId}
                  htmlFor={inputId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "18px 20px",
                    borderRadius: 12,
                    border: isChecked ? `2px solid ${accent}` : `1px solid ${COLORS.border}`,
                    background: isChecked ? `${accent}14` : "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name={`q${question.id}`}
                    checked={isChecked}
                    onChange={() => select(idx)}
                    style={{ width: 18, height: 18, accentColor: accent, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 15, color: isChecked ? accent : COLORS.text, fontWeight: isChecked ? 700 : 400 }}>
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>

          <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
            <button
              onClick={goPrev}
              disabled={isFirst}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                background: "#FFFFFF",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted,
                fontSize: 15,
                fontWeight: 700,
                cursor: isFirst ? "not-allowed" : "pointer",
                opacity: isFirst ? 0.5 : 1,
              }}
            >
              이전
            </button>
            <button
              onClick={goNext}
              disabled={!canNext}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                background: accent,
                border: "none",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 700,
                cursor: canNext ? "pointer" : "not-allowed",
                opacity: canNext ? 1 : 0.5,
              }}
            >
              {isLast ? "결과 보기" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}