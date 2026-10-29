import { useState } from "react";
import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";
import { TYPE_LIST } from "./constants";

const TYPE_OPTIONS = TYPE_LIST; // [{ key: "PRINCIPAL"|"BALANCED"|"DIVIDEND", name, recommended? }]

const RATIO_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const MODES = [
  { key: "stockOnly", label: "배당주만 운용" },
  { key: "etfOnly", label: "ETF만 운용" },
  { key: "blend", label: "함께 운용(블렌딩)" },
];

const GOLD = "#F59E0B";

// initialEtfType/initialStockType — 설문에서 판정된 investorType을 기본 선택값으로 전달받음(없으면 균형형)
// initialMode — 설문에서 추천된 운용 방식: "etfOnly" | "stockOnly" | "blend" (없으면 blend)
// recommendedEtfType/recommendedStockType — 설문결과(surveyResult.type) 그대로, "추천" 뱃지를 표시할 유형. 설문을 안 거쳤으면 undefined → 뱃지 없음
// (둘 중 하나만 채워져서 들어옴 — 설문은 유형x운용방식 조합 하나만 가리키므로)
// ETF 유형과 배당주 유형, 운용 방식은 이후 서로 독립적으로 바꿀 수 있음(추천 뱃지는 바꿔도 계속 같은 자리에 표시됨)
export default function RatioSetting({
  initialEtfType = "BALANCED",
  initialStockType = "BALANCED",
  initialMode = "blend",
  recommendedEtfType,
  recommendedStockType,
  userInitial,
  onConfirm,
}) {
  // 비중 슬라이더 쪽 안내 문구용 — recommendedEtfType/StockType 중 채워진 쪽으로 추천 운용방식을 역추론
  const recommendedEngine = recommendedEtfType ? "ETF" : recommendedStockType ? "STOCK" : undefined;
  const [mode, setMode] = useState(initialMode); // stockOnly | etfOnly | blend
  const [blendRatio, setBlendRatio] = useState(50); // 블렌딩일 때만 쓰는 ETF 비중
  const [etfType, setEtfType] = useState(initialEtfType);
  const [stockType, setStockType] = useState(initialStockType);

  // 모드에 따라 실제 ETF 비중 계산
  const etfRatio = mode === "etfOnly" ? 100 : mode === "stockOnly" ? 0 : blendRatio;
  const stockRatio = 100 - etfRatio;

  const etfColor = COLORS.primary; // 블루
  const stockColor = COLORS.secondary; // 초록 — 전에 퍼플이라 블루랑 분간이 잘 안 됐음
  const donutBg = `conic-gradient(${etfColor} 0% ${etfRatio}%, ${stockColor} ${etfRatio}% 100%)`;

  // 비중 슬라이더 트랙 색 — ETF쪽(왼쪽)은 파랑, 배당주쪽(오른쪽)은 초록으로 반씩. min=10, max=90 기준 위치 계산
  const sliderPercent = ((blendRatio - 10) / (90 - 10)) * 100;
  const sliderTrackBg = `linear-gradient(to right, ${etfColor} 0%, ${etfColor} ${sliderPercent}%, ${stockColor} ${sliderPercent}%, ${stockColor} 100%)`;

  const etfTypeName = TYPE_OPTIONS.find((t) => t.key === etfType).name;
  const stockTypeName = TYPE_OPTIONS.find((t) => t.key === stockType).name;

  const showEtfType = mode !== "stockOnly";
  const showStockType = mode !== "etfOnly";
  const showSlider = mode === "blend";

  const summaryParts = [];
  if (showStockType) summaryParts.push({ text: `${stockTypeName} 배당주 ${stockRatio}%`, color: stockColor });
  if (showEtfType) summaryParts.push({ text: `${etfTypeName} ETF ${etfRatio}%`, color: etfColor });

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar variant="auth" activeTab="portfolio" userInitial={userInitial} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 64px 60px 64px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: 0 }}>비율 설정</h2>
          <p style={{ marginTop: 8, fontSize: 13, color: COLORS.textFaint }}>
            어떻게 운용할지 먼저 선택하고, 비중과 유형을 정하세요.
          </p>

          {/* 운용 방식 선택 */}
          <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  style={{
                    flex: 1,
                    padding: "12px 8px",
                    borderRadius: 10,
                    border: active ? "none" : `1px solid ${COLORS.border}`,
                    background: active ? COLORS.text : "#FFFFFF",
                    color: active ? "#FFFFFF" : COLORS.textMuted,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* 도넛 미리보기 */}
          <div style={{ marginTop: 20, padding: 28, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative", width: 172, height: 172 }}>
              <div style={{ width: 172, height: 172, borderRadius: "50%", background: donutBg }} />
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  width: 132,
                  height: 132,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
                  {mode === "blend" ? "혼합형" : mode === "stockOnly" ? "배당주" : "ETF"}
                </span>
                <span style={{ fontSize: 11, color: COLORS.textFaint }}>포트폴리오</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 18 }}>
              {showStockType && <LegendDot color={stockColor} label={`배당주 ${stockRatio}%`} />}
              {showEtfType && <LegendDot color={etfColor} label={`ETF ${etfRatio}%`} />}
            </div>
          </div>

          {/* 비중 슬라이더 — 블렌딩일 때만 표시 */}
          {showSlider && (
            <div style={{ marginTop: 16, padding: 24, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>ETF 비중</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.primary }}>{blendRatio}%</span>
              </div>

              <input
                type="range"
                min={10}
                max={90}
                step={10}
                value={blendRatio}
                onChange={(e) => setBlendRatio(Number(e.target.value))}
                className="ratio-blend-slider"
                style={{ width: "100%", marginTop: 14, background: sliderTrackBg }}
              />
              <style>{`
                .ratio-blend-slider {
                  -webkit-appearance: none;
                  appearance: none;
                  height: 6px;
                  border-radius: 999px;
                  outline: none;
                  cursor: pointer;
                }
                .ratio-blend-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  background: #FFFFFF;
                  border: 3px solid ${COLORS.text};
                  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
                  cursor: pointer;
                }
                .ratio-blend-slider::-moz-range-thumb {
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  background: #FFFFFF;
                  border: 3px solid ${COLORS.text};
                  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
                  cursor: pointer;
                }
                .ratio-blend-slider::-moz-range-track {
                  background: transparent;
                }
              `}</style>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textFaint, marginTop: 6 }}>
                <span>배당주 90%</span>
                <span>ETF 90%</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                {RATIO_STEPS.filter((s) => s > 0 && s < 100).map((step) => (
                  <button
                    key={step}
                    onClick={() => setBlendRatio(step)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: blendRatio === step ? `2px solid ${GOLD}` : "none",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: blendRatio === step ? "#FFFBEB" : "#F0EEE7",
                      color: blendRatio === step ? COLORS.text : COLORS.textFaint,
                    }}
                  >
                    {step}
                  </button>
                ))}
              </div>
              {/* 구체적인 추천 비중(%) 대신, 설문에서 나온 쪽(ETF/배당주)으로 방향만 안내 — 블렌딩에서도 극단값(0%, 100%)을 추천처럼 보여주지 않기 위함 */}
              {recommendedEngine && (
                <p style={{ marginTop: 10, fontSize: 11.5, color: GOLD, textAlign: "center", fontWeight: 700 }}>
                  ★ {recommendedEngine === "ETF" ? "ETF 비중을 크게 하는 편이 좋아요" : "배당주 비중을 크게 하는 편이 좋아요"}
                </p>
              )}
              <p style={{ marginTop: 6, fontSize: 11, color: COLORS.textFaint, textAlign: "center" }}>
                한쪽만 운용하려면 위에서 "배당주만" 또는 "ETF만"을 선택하세요
              </p>
            </div>
          )}

          {/* ETF 유형 선택 */}
          {showEtfType && (
            <TypeSelector label="ETF 유형 선택" value={etfType} onChange={setEtfType} recommendedKey={recommendedEtfType} />
          )}

          {/* 배당주 유형 선택 */}
          {showStockType && (
            <TypeSelector label="배당주 유형 선택" value={stockType} onChange={setStockType} recommendedKey={recommendedStockType} />
          )}

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: COLORS.textMuted }}>
            {summaryParts.map((p, i) => (
              <span key={p.text}>
                {i > 0 && " · "}
                <span style={{ color: p.color, fontWeight: 700 }}>{p.text}</span>
              </span>
            ))}
          </div>

          <button
            onClick={() => onConfirm?.({ mode, etfRatio, etfType, stockType })}
            style={{
              width: "100%",
              marginTop: 18,
              padding: 15,
              borderRadius: 12,
              background: COLORS.primary,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            포트폴리오 확인하기
          </button>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 12.5, color: COLORS.textMuted }}>{label}</span>
    </div>
  );
}

// recommendedKey — 설문결과(surveyResult.type)와 같은 값의 옵션에 "추천" 뱃지(금색 테두리+별)를 띄움. undefined면 아무 옵션도 추천 표시 없음
function TypeSelector({ label, value, onChange, recommendedKey }) {
  return (
    <div style={{ marginTop: 16, padding: 20, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {TYPE_OPTIONS.map((opt) => {
          const active = value === opt.key;
          const isRecommended = opt.key === recommendedKey;
          return (
            <div key={opt.key} style={{ position: "relative", flex: 1 }}>
              {isRecommended && (
                <span
                  style={{
                    position: "absolute",
                    top: -9,
                    left: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    fontSize: 10,
                    fontWeight: 700,
                    color: GOLD,
                    background: "#FFFBEB",
                    border: `1px solid ${GOLD}`,
                    borderRadius: 999,
                    padding: "1px 7px",
                    whiteSpace: "nowrap",
                    zIndex: 1,
                  }}
                >
                  ★ 추천
                </span>
              )}
              <button
                onClick={() => onChange(opt.key)}
                style={{
                  width: "100%",
                  padding: "10px 6px",
                  borderRadius: 10,
                  border: active ? "none" : isRecommended ? `2px solid ${GOLD}` : `1px solid ${COLORS.border}`,
                  background: active ? COLORS.primary : "#FFFFFF",
                  color: active ? "#FFFFFF" : COLORS.text,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {opt.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}