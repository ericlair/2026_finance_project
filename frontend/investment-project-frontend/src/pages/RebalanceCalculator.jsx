import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";
import { TYPE_NAMES } from "./constants";
import { getSelections, getSelection } from "../api/portfolio";
import { groupHoldings } from "./holdingGrouping";

// 리밸런싱 계산기 — 저장 기능 없음(React state만), DB/백엔드 연동 없음
// 입력 모드 2가지(금액 / 비중):
//  - 금액 모드: 종목별 "현재 보유 금액"을 직접 입력 → 총자산은 합계로 자동 계산
//  - 비중 모드: "총자산" 1칸 + 종목별 "현재 비중(%)"을 입력 → 현재 보유 금액은 총자산×비중으로 환산
// 목표 비중은 "저장한 포트폴리오 불러오기"로 자동 채우거나(아래 buildRowsFromSelection), 직접 입력 가능
// 출력: 종목별 목표 금액과, 목표 금액에 맞추기 위해 사거나 팔아야 할 금액
let nextId = 1;
const makeRow = (name = "", current = 0, target = 0, currentPct = 0) => ({ id: nextId++, name, current, target, currentPct });

function formatKRW(n) {
  return `${Math.round(n).toLocaleString()}원`;
}

// GET /api/portfolio/selections 목록 한 줄 라벨 — MyPage 이력 표시와 같은 포맷
function formatSelectionLabel({ etfType, etfRatio, stockType, stockRatio }) {
  const parts = [];
  if (etfRatio > 0) parts.push(`ETF ${TYPE_NAMES[etfType]} ${etfRatio}%`);
  if (stockRatio > 0) parts.push(`배당주 ${TYPE_NAMES[stockType]} ${stockRatio}%`);
  return parts.join(" + ");
}

function formatDate(createdAt) {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ---- 불러온 응답(GET /api/portfolio/selections/{id}) → rows 변환 (백엔드 확정 스펙, 2026-10-30) ----
// 1) ETF/배당주 구간 각각 groupHoldings로 묶고 2) 묶음별 weight(구간 안 비중)에 구간 ratio를 곱해 전체 비중으로 환산(소수 둘째 자리 반올림)
// 3) 두 구간을 합친 뒤, 반올림 누적으로 합계가 100에서 0.5 이내로 어긋나면 마지막 줄에서 보정
function buildRowsFromSelection(d) {
  const scaleSection = (section) => {
    if (!section) return [];
    return groupHoldings(section.holdings).map((g) => ({
      name: g.name,
      weight: Math.round(((g.weight * section.ratio) / 100) * 100) / 100,
    }));
  };

  const rows = [...scaleSection(d.etf), ...scaleSection(d.stock)];

  if (rows.length) {
    const total = Math.round(rows.reduce((sum, r) => sum + r.weight, 0) * 100) / 100;
    const diff = Math.round((100 - total) * 100) / 100;
    if (diff !== 0 && Math.abs(diff) <= 0.5) {
      const last = rows[rows.length - 1];
      last.weight = Math.round((last.weight + diff) * 100) / 100;
    }
  }

  return rows.map((r) => ({ name: r.name, target: r.weight }));
}

export default function RebalanceCalculator({ userInitial, onBack }) {
  const [inputMode, setInputMode] = useState("amount"); // "amount" | "percent"
  const [totalAsset, setTotalAsset] = useState(2000000); // 비중 모드에서만 사용하는 총자산
  const [rows, setRows] = useState(() => [
    makeRow("KODEX 미국S&P500", 1000000, 40, 50),
    makeRow("TIGER 미국배당다우존스", 600000, 30, 30),
    makeRow("KB금융", 400000, 30, 20),
  ]);

  // 저장한 포트폴리오 불러오기
  const [selections, setSelections] = useState([]);
  const [selectVisible, setSelectVisible] = useState(true); // 비로그인(401)이면 숨기고 수동 입력만
  const [selectedId, setSelectedId] = useState("");
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [selectionError, setSelectionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSelections()
      .then((data) => {
        if (!cancelled) setSelections(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          setSelectVisible(false); // 비로그인 — select 자체를 숨김
        } else {
          setSelections([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectChange = async (e) => {
    const id = e.target.value;
    setSelectedId(id);
    if (!id) {
      // "직접 입력"으로 되돌아가면 불러온 값 치우고 빈 입력으로 초기화
      setSelectionError(null);
      setRows([makeRow()]);
      return;
    }
    setSelectionError(null);
    setSelectionLoading(true);
    try {
      const d = await getSelection(id);
      const built = buildRowsFromSelection(d).map((r) => makeRow(r.name, 0, r.target, 0));
      setRows(built.length ? built : [makeRow()]);
    } catch (err) {
      setSelectionError("불러오기에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSelectionLoading(false);
    }
  };

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, makeRow()]);
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const isPercentMode = inputMode === "percent";

  const totalCurrent = useMemo(() => {
    if (isPercentMode) return Number(totalAsset) || 0;
    return rows.reduce((sum, r) => sum + (Number(r.current) || 0), 0);
  }, [isPercentMode, totalAsset, rows]);

  const totalCurrentPct = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.currentPct) || 0), 0), [rows]);
  const currentPctMismatch = isPercentMode && Math.round(totalCurrentPct * 100) / 100 !== 100;

  const totalTarget = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.target) || 0), 0), [rows]);
  // 저장된 비중이 소수(예: 11.67%)라 합계가 반올림 오차로 99.99~100.01처럼 나올 수 있어 ±0.05까지는 허용
  const targetMismatch = Math.abs(totalTarget - 100) > 0.05;

  const results = useMemo(
    () =>
      rows.map((r) => {
        const current = isPercentMode ? totalCurrent * ((Number(r.currentPct) || 0) / 100) : Number(r.current) || 0;
        const target = Number(r.target) || 0;
        const targetAmount = totalCurrent * (target / 100);
        const diff = targetAmount - current;
        return { ...r, current, target, targetAmount, diff };
      }),
    [rows, totalCurrent, isPercentMode]
  );

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar variant="auth" activeTab="portfolio" userInitial={userInitial} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 64px 60px 64px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <span onClick={() => onBack?.()} style={{ fontSize: 13, color: COLORS.textFaint, cursor: "pointer" }}>
            ← 돌아가기
          </span>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: "12px 0 0 0" }}>리밸런싱 계산기</h2>
          <p style={{ marginTop: 8, fontSize: 13, color: COLORS.textFaint }}>
            종목별 현재 보유 현황과 목표 비중을 입력하면, 목표에 맞추기 위해 사거나 팔아야 할 금액을 계산해요.
          </p>

          {selectVisible && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, flexShrink: 0 }}>저장한 포트폴리오 불러오기</span>
              <select
                value={selectedId}
                onChange={handleSelectChange}
                disabled={selectionLoading}
                style={{ flex: 1, maxWidth: 420, fontFamily: FONT, fontSize: 13, padding: "9px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, background: "#FFFFFF" }}
              >
                <option value="">직접 입력</option>
                {selections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.createdAt)} · {formatSelectionLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectionError && <p style={{ marginTop: 6, fontSize: 12, color: "#DC2626", textAlign: "right" }}>{selectionError}</p>}

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>현재 보유 입력 방식</span>
            <div style={{ display: "flex", gap: 8 }}>
              <ToggleOption active={!isPercentMode} label="금액으로 입력" onClick={() => setInputMode("amount")} />
              <ToggleOption active={isPercentMode} label="비중(%)으로 입력" onClick={() => setInputMode("percent")} />
            </div>
          </div>

          {/* 입력 테이블 */}
          <div style={{ marginTop: 16, padding: 20, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
            {isPercentMode && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>총자산</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={Number(totalAsset || 0).toLocaleString()}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
                      setTotalAsset(digits === "" ? 0 : Number(digits));
                    }}
                    style={{ ...inputStyle("right"), width: 150 }}
                  />
                  <span style={{ fontSize: 12, color: COLORS.textFaint }}>원</span>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: isPercentMode ? "1fr 90px 90px 32px" : "1fr 130px 90px 32px", gap: 8, fontSize: 11, fontWeight: 700, color: COLORS.textFaint, paddingBottom: 10 }}>
              <span>종목명</span>
              <span>{isPercentMode ? "현재 비중" : "현재 보유 금액"}</span>
              <span>목표 비중</span>
              <span />
            </div>
            {rows.map((r) => (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: isPercentMode ? "1fr 90px 90px 32px" : "1fr 130px 90px 32px", gap: 8, alignItems: "center", padding: "6px 0" }}>
                <input
                  type="text"
                  value={r.name}
                  placeholder="종목명"
                  onChange={(e) => updateRow(r.id, { name: e.target.value })}
                  style={inputStyle()}
                />
                {isPercentMode ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      value={r.currentPct}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                        if (cleaned !== e.target.value) e.target.value = cleaned;
                        updateRow(r.id, { currentPct: Number(cleaned) || 0 });
                      }}
                      style={inputStyle("right")}
                    />
                    <span style={{ fontSize: 12, color: COLORS.textFaint }}>%</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={r.current.toLocaleString()}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
                      updateRow(r.id, { current: digits === "" ? 0 : Number(digits) });
                    }}
                    style={inputStyle("right")}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number"
                    value={r.target}
                    min={0}
                    max={100}
                    step={0.01}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                      if (cleaned !== e.target.value) e.target.value = cleaned;
                      updateRow(r.id, { target: Number(cleaned) || 0 });
                    }}
                    style={inputStyle("right")}
                  />
                  <span style={{ fontSize: 12, color: COLORS.textFaint }}>%</span>
                </div>
                <button onClick={() => removeRow(r.id)} aria-label="삭제" style={removeBtnStyle()}>
                  ✕
                </button>
              </div>
            ))}

            <button onClick={addRow} style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: COLORS.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              + 종목 추가
            </button>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", fontSize: 13, flexWrap: "wrap", gap: 6 }}>
              <span style={{ color: COLORS.textMuted }}>
                현재 총자산: <strong style={{ color: COLORS.text }}>{formatKRW(totalCurrent)}</strong>
              </span>
              {isPercentMode && (
                <span style={{ color: currentPctMismatch ? "#DC2626" : COLORS.textMuted, fontWeight: currentPctMismatch ? 700 : 400 }}>
                  현재 비중 합계: {totalCurrentPct}%{currentPctMismatch ? " (100%가 되어야 해요)" : ""}
                </span>
              )}
              <span style={{ color: targetMismatch ? "#DC2626" : COLORS.textMuted, fontWeight: targetMismatch ? 700 : 400 }}>
                목표 비중 합계: {totalTarget}%{targetMismatch ? " (100%가 되어야 해요)" : ""}
              </span>
            </div>
          </div>

          {/* 결과 */}
          <div style={{ marginTop: 16, padding: 20, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 110px", fontSize: 11, fontWeight: 700, color: COLORS.textFaint, paddingBottom: 10 }}>
              <span>종목명</span>
              <span style={{ textAlign: "right" }}>목표 금액</span>
              <span style={{ textAlign: "right" }}>현재 금액</span>
              <span style={{ textAlign: "right" }}>매수/매도</span>
            </div>
            {results.map((r) => (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 110px", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${COLORS.bg}` }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text }}>{r.name || "(이름 없음)"}</span>
                <span style={{ fontSize: 12.5, color: COLORS.textMuted, textAlign: "right" }}>{formatKRW(r.targetAmount)}</span>
                <span style={{ fontSize: 12.5, color: COLORS.textMuted, textAlign: "right" }}>{formatKRW(r.current)}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "right",
                    color: r.diff > 0 ? COLORS.primary : r.diff < 0 ? "#DC2626" : COLORS.textFaint,
                  }}
                >
                  {r.diff === 0 ? "변동 없음" : `${r.diff > 0 ? "매수 " : "매도 "}${formatKRW(Math.abs(r.diff))}`}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              background: "#FFF7ED",
              border: "1px solid #FDE2C2",
              borderRadius: 12,
              fontSize: 12.5,
              color: "#9A5B0F",
              lineHeight: 1.8,
            }}
          >
            <p style={{ margin: 0 }}>
              {isPercentMode ? "현재 비중 합계와 목표 비중 합계가 각각 100%가 아니면 계산이 왜곡될 수 있어요." : "목표 비중 합계가 100%가 아니면 목표 금액 계산이 왜곡될 수 있어요."}
            </p>
            {selectedId && <p style={{ margin: 0 }}>목표 비중은 저장 당시 기준이에요.</p>}
            <p style={{ margin: 0 }}>저장 당시 비중을 목표로 한 단순 계산이며 투자 권유가 아닙니다.</p>
            <p style={{ margin: 0 }}>세금·수수료·최소 매매 단위는 반영하지 않았습니다.</p>
            <p style={{ margin: 0 }}>같은 지수를 추종하는 상품(예: KODEX/TIGER S&P500)은 하나만 보유해도 되며, 보유한 상품의 금액을 합쳐서 입력해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function inputStyle(align = "left") {
  return {
    width: "100%",
    fontFamily: FONT,
    fontSize: 13,
    padding: "8px 10px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    textAlign: align,
    color: COLORS.text,
    boxSizing: "border-box",
  };
}

function removeBtnStyle() {
  return {
    width: 28,
    height: 28,
    borderRadius: 7,
    border: "none",
    background: "none",
    color: COLORS.textFaint,
    cursor: "pointer",
    fontSize: 13,
  };
}

function ToggleOption({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: active ? "none" : `1px solid ${COLORS.border}`,
        background: active ? COLORS.text : "#FFFFFF",
        color: active ? "#FFFFFF" : COLORS.textMuted,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}