import { useMemo, useState } from "react";
import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";

// 복리 계산기 — 저장 기능 없음(React state만), DB/백엔드 연동 없음
// 입력: 시작 금액, 월 적립액, 투자 기간(년), 예상 연 배당률(%), 배당 지급 주기, 배당 재투자 여부
// 출력: 주기별 자산총액 + 그 주기의 배당금
// 모델: 월 단위로 적립금을 더하고, 선택한 배당 주기(매월/매분기/매년)가 될 때마다 그 시점 자산에
// (연 배당률 ÷ 연간 지급횟수)를 적용해 배당금을 계산. 재투자면 자산에 더해 다음 주기부터 복리로 불어나고,
// 재투자가 아니면 배당금은 현금으로 빠져나가 자산엔 반영 안 함.
const FREQUENCY_OPTIONS = [
  { key: "monthly", label: "월별", periodsPerYear: 12, everyMonths: 1, unit: "개월차" },
  { key: "quarterly", label: "분기별", periodsPerYear: 4, everyMonths: 3, unit: "분기차" },
  { key: "yearly", label: "연별", periodsPerYear: 1, everyMonths: 12, unit: "년차" },
];

function computeCompound({ initial, monthly, years, ratePct, reinvest, frequency }) {
  const { periodsPerYear, everyMonths } = FREQUENCY_OPTIONS.find((f) => f.key === frequency) ?? FREQUENCY_OPTIONS[2];
  let balance = initial;
  const rows = [];
  let totalContribution = initial;
  let totalDividendPaidOut = 0; // 재투자 안 할 때만 누적(현금으로 받은 배당 합계)

  for (let m = 1; m <= years * 12; m++) {
    balance += monthly;
    totalContribution += monthly;
    if (m % everyMonths === 0) {
      const dividend = balance * (ratePct / 100 / periodsPerYear);
      if (reinvest) {
        balance += dividend;
      } else {
        totalDividendPaidOut += dividend;
      }
      rows.push({
        period: m / everyMonths,
        balance: Math.round(balance),
        dividend: Math.round(dividend),
      });
    }
  }

  return { rows, totalContribution: Math.round(totalContribution), totalDividendPaidOut: Math.round(totalDividendPaidOut) };
}

function formatKRW(n) {
  return `${Math.round(n).toLocaleString()}원`;
}

export default function CompoundCalculator({ userInitial, onBack }) {
  const [initial, setInitial] = useState(1000000); // 시작 금액
  const [monthly, setMonthly] = useState(200000); // 월 적립액
  const [years, setYears] = useState(10); // 투자 기간(년)
  const [ratePct, setRatePct] = useState(6); // 예상 연 배당률(%)
  const [reinvest, setReinvest] = useState(true); // 배당 재투자 여부
  const [frequency, setFrequency] = useState("yearly"); // 배당 지급 주기: monthly | quarterly | yearly

  const { rows, totalContribution, totalDividendPaidOut } = useMemo(
    () => computeCompound({ initial, monthly, years, ratePct, reinvest, frequency }),
    [initial, monthly, years, ratePct, reinvest, frequency]
  );

  const freqInfo = FREQUENCY_OPTIONS.find((f) => f.key === frequency) ?? FREQUENCY_OPTIONS[2];
  const finalBalance = rows.length ? rows[rows.length - 1].balance : initial;
  const maxBalance = Math.max(...rows.map((r) => r.balance), 1);

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar variant="auth" activeTab="portfolio" userInitial={userInitial} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 64px 60px 64px" }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          <span onClick={() => onBack?.()} style={{ fontSize: 13, color: COLORS.textFaint, cursor: "pointer" }}>
            ← 돌아가기
          </span>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: "12px 0 0 0" }}>복리 계산기</h2>
          <p style={{ marginTop: 8, fontSize: 13, color: COLORS.textFaint }}>
            적립식으로 투자했을 때 연도별 자산과 배당금이 어떻게 불어나는지 확인해보세요.
          </p>

          {/* 입력 */}
          <div style={{ marginTop: 20, padding: 24, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <NumberField label="시작 금액" unit="원" value={initial} onChange={setInitial} formatted />
            <NumberField label="월 적립액" unit="원" value={monthly} onChange={setMonthly} formatted />
            <NumberField label="투자 기간" unit="년" value={years} onChange={setYears} step={1} min={1} max={40} />
            <NumberField label="예상 연 배당률" unit="%" value={ratePct} onChange={setRatePct} step={0.5} min={0} max={30} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>배당 지급 주기</span>
              <div style={{ display: "flex", gap: 8 }}>
                {FREQUENCY_OPTIONS.map((f) => (
                  <ToggleOption key={f.key} active={frequency === f.key} label={f.label} onClick={() => setFrequency(f.key)} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>배당 재투자</span>
              <div style={{ display: "flex", gap: 8 }}>
                <ToggleOption active={reinvest} label="재투자" onClick={() => setReinvest(true)} />
                <ToggleOption active={!reinvest} label="현금으로 받기" onClick={() => setReinvest(false)} />
              </div>
            </div>
          </div>

          {/* 요약 */}
          <div style={{ marginTop: 16, padding: 24, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <SummaryItem label={`${years}년 후 자산`} value={formatKRW(finalBalance)} color={COLORS.primary} />
              <SummaryItem label="총 납입금(원금)" value={formatKRW(totalContribution)} color={COLORS.text} />
              {!reinvest && <SummaryItem label="누적 수령 배당금" value={formatKRW(totalDividendPaidOut)} color={COLORS.secondary} />}
            </div>
          </div>

          {/* 연도별 바 차트 */}
          <div style={{ marginTop: 16, padding: "24px 24px 12px 24px", background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, marginBottom: 14 }}>{freqInfo.label} 자산총액</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140 }}>
              {rows.map((r) => (
                <div key={r.period} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <div
                    title={formatKRW(r.balance)}
                    style={{
                      width: "100%",
                      maxWidth: 22,
                      borderRadius: "4px 4px 0 0",
                      background: COLORS.primary,
                      height: `${Math.max((r.balance / maxBalance) * 100, 2)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {rows.map((r) => (
                <div key={r.period} style={{ flex: 1, textAlign: "center", fontSize: 10, color: COLORS.textFaint }}>
                  {r.period % Math.ceil(rows.length / 10 || 1) === 0 || r.period === rows.length ? `${r.period}` : ""}
                </div>
              ))}
            </div>
          </div>

          {/* 주기별 표 */}
          <div style={{ marginTop: 16, padding: 20, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16, maxHeight: 320, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr", fontSize: 11, fontWeight: 700, color: COLORS.textFaint, paddingBottom: 10, position: "sticky", top: 0, background: "#FFFFFF" }}>
              <span>{freqInfo.label}</span>
              <span style={{ textAlign: "right" }}>자산총액</span>
              <span style={{ textAlign: "right" }}>배당금</span>
            </div>
            {rows.map((r) => (
              <div key={r.period} style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${COLORS.bg}` }}>
                <span style={{ fontSize: 13, color: COLORS.text }}>{r.period}{freqInfo.unit}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, textAlign: "right" }}>{formatKRW(r.balance)}</span>
                <span style={{ fontSize: 13, color: COLORS.secondary, textAlign: "right" }}>{formatKRW(r.dividend)}</span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 12, fontSize: 11, color: COLORS.textFaint, textAlign: "center" }}>
            실제 수익률·배당률은 시장 상황에 따라 달라질 수 있어요. 이 계산은 참고용입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// formatted=true면 "1,000,000"처럼 천단위 콤마로 보여주는 금액 전용 입력(type=text, 숫자 아닌 글자는 입력 즉시 걸러냄).
// 그 외(기간/배당률처럼 작은 숫자+소수점)는 기존 type=number 그대로.
function NumberField({ label, unit, value, onChange, step = 1, min = 0, max, formatted = false }) {
  const inputStyle = {
    width: 130,
    fontFamily: FONT,
    fontSize: 14,
    padding: "9px 12px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    textAlign: "right",
    color: COLORS.text,
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, flexShrink: 0 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {formatted ? (
          <input
            type="text"
            inputMode="numeric"
            value={value.toLocaleString()}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
              onChange(digits === "" ? 0 : Number(digits));
            }}
            style={inputStyle}
          />
        ) : (
          <input
            type="number"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
              if (cleaned !== e.target.value) e.target.value = cleaned;
              const v = Number(cleaned);
              if (!Number.isNaN(v)) onChange(v);
            }}
            style={inputStyle}
          />
        )}
        <span style={{ fontSize: 12.5, color: COLORS.textFaint, width: 16 }}>{unit}</span>
      </div>
    </div>
  );
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

function SummaryItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: COLORS.textFaint }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}