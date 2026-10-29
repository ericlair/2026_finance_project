import { useState, useEffect } from "react";
import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";
import { TYPE_NAMES } from "./constants";
import { fetchBlend, getSelection } from "../api/portfolio";
import { groupEtfHoldings, MERGED_HOLDING_NOTE } from "./holdingGrouping";

const PALETTE = [COLORS.primary, COLORS.secondary, "#7C3AED", "#F59E0B", "#EC4899"];

const KIND_LABEL = { ETF: "ETF", STOCK: "개별주식" };

// 시가총액/거래대금 — 원 단위로 내려오는 값을 억 단위로 보기 편하게 변환. 백엔드가 아직 안 내려주면 undefined/null → "-"
function formatWon(value) {
  if (value == null) return "-";
  const eok = value / 100_000_000;
  if (eok >= 1) return `${eok.toFixed(eok >= 100 ? 0 : 1)}억`;
  return `${Math.round(value / 10_000).toLocaleString()}만`;
}

// 저장된 포트폴리오의 createdAt(ISO 문자열)을 "2026.10.28" 형태로
function formatSavedDate(createdAt) {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function PortfolioDetail({
  id, // 저장된 포트폴리오의 id — readOnly일 때만 사용(GET /api/portfolio/selections/{id}로 저장 당시 값을 불러옴)
  mode = "blend", // "stockOnly" | "etfOnly" | "blend"
  etfRatio = 50,
  etfType = "BALANCED",
  stockType = "DIVIDEND",
  readOnly = false, // true = 마이페이지 이력에서 조회만 하는 화면 (선택하기 버튼/재설정 링크 숨김)
  userInitial,
  saveError, // 저장(POST /api/portfolio/selections) 실패 시 서버 에러 문구 (예: "로그인이 필요합니다.") — 성공하면 App.jsx가 마이페이지로 넘겨서 이 화면 자체가 사라짐
  onConfirm, // "이 포트폴리오로 선택하기" 클릭 시 { mode, etfRatio, etfType, stockType } 전달
  onBack, // 뒤로가기(readOnly=마이페이지로, 아니면 비율설정으로)
  onNotFound, // readOnly 조회 중 404(삭제됐거나 남의 id) — 마이페이지로 돌려보내서 목록을 새로 불러오게 함
}) {
  // 모드에 따라 실제 ETF 비중 (stockOnly=0, etfOnly=100)
  const effRatio = mode === "etfOnly" ? 100 : mode === "stockOnly" ? 0 : etfRatio;
  const stockRatio = 100 - effRatio;
  const isBlend = mode === "blend";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null); // readOnly일 때 저장 당시(createdAt) 표시용

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    // readOnly(마이페이지 이력에서 조회)면 저장 당시 값을, 아니면 현재 시세로 계산된 값을 불러옴
    const request = readOnly && id != null
      ? getSelection(id).then((d) => {
          setSavedAt(d.createdAt);
          return { etf: d.etf, stock: d.stock };
        })
      : fetchBlend({
          etfType: effRatio > 0 ? etfType : undefined,
          stockType: effRatio < 100 ? stockType : undefined,
          etfRatio: effRatio,
        });

    request
      .then((d) => { if (!ignore) setData(d); })
      .catch((e) => {
        if (ignore) return;
        if (readOnly && e.status === 404) {
          onNotFound?.();
          return;
        }
        setError(e.message);
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [id, readOnly, etfType, stockType, effRatio]);

  // 블렌딩일 때만 쓰는 토글 — ETF / 배당주 둘 중 하나씩 보여줌
  const [activeTab, setActiveTab] = useState("etf"); // "etf" | "stock"

  const showEtf = isBlend ? activeTab === "etf" : mode !== "stockOnly";
  const showStock = isBlend ? activeTab === "stock" : mode !== "etfOnly";

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar variant="auth" activeTab="portfolio" userInitial={userInitial} />

      <div style={{ padding: "32px 64px 60px 64px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span onClick={() => onBack?.()} style={{ fontSize: 13, color: COLORS.textFaint, cursor: "pointer" }}>
              {readOnly ? "← 마이페이지로 돌아가기" : "← 비율설정으로 돌아가기"}
            </span>
            {!readOnly && (
              <span style={{ fontSize: 13, color: COLORS.textFaint, cursor: "pointer" }}>비율 다시 설정하기</span>
            )}
          </div>

          {/* 저장 당시 값이라 현재 시세와 다를 수 있음을 알림 */}
          {readOnly && (
            <p style={{ marginTop: -8, marginBottom: 16, fontSize: 11.5, color: COLORS.textFaint }}>
              저장 당시 기준{savedAt ? ` · ${formatSavedDate(savedAt)}` : ""}
            </p>
          )}

          {isBlend && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <ToggleBadge
                active={activeTab === "etf"}
                color={COLORS.primary}
                label="ETF"
                percent={effRatio}
                typeName={TYPE_NAMES[etfType]}
                onClick={() => setActiveTab("etf")}
              />
              <ToggleBadge
                active={activeTab === "stock"}
                color={COLORS.secondary}
                label="배당주"
                percent={stockRatio}
                typeName={TYPE_NAMES[stockType]}
                onClick={() => setActiveTab("stock")}
              />
            </div>
          )}

          {loading && <p style={{ fontSize: 13, color: COLORS.textFaint }}>불러오는 중…</p>}
          {error && <p style={{ fontSize: 13, color: "#DC2626" }}>포트폴리오를 불러오지 못했습니다: {error}</p>}

          {!loading && !error && data && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {showEtf && data.etf && (
                <PortfolioSection
                  label="ETF 포트폴리오"
                  typeName={TYPE_NAMES[etfType]}
                  holdings={data.etf.holdings}
                  avgRate={data.etf.avgRate}
                  hideMarketColumns={readOnly}
                />
              )}
              {showStock && data.stock && (
                <PortfolioSection
                  label="배당주 포트폴리오"
                  typeName={TYPE_NAMES[stockType]}
                  holdings={data.stock.holdings}
                  avgRate={data.stock.avgRate}
                  hideMarketColumns={readOnly}
                />
              )}
            </div>
          )}

          {!readOnly && (
            <>
              <button
                onClick={() => onConfirm?.({ mode, etfRatio: effRatio, etfType, stockType })}
                style={{
                  width: "100%",
                  marginTop: 24,
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
                이 포트폴리오로 선택하기
              </button>
              {/* 저장이 실패하면(비로그인 401 포함) 여기 머물면서 서버 에러 문구를 그대로 보여줌 — 성공 시엔 App.jsx가 마이페이지로 넘김 */}
              {saveError && (
                <p style={{ marginTop: 10, fontSize: 12.5, color: "#DC2626", textAlign: "center", fontWeight: 700 }}>
                  {saveError}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleBadge({ active, color, label, percent, typeName, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "14px 18px",
        borderRadius: 12,
        background: active ? color : "#FFFFFF",
        border: active ? "none" : `1px solid ${COLORS.border}`,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: active ? "rgba(255,255,255,0.8)" : COLORS.textFaint,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          color: active ? "#FFFFFF" : COLORS.text,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {percent}% · {typeName}
      </div>
    </button>
  );
}

function PortfolioSection({ label, typeName, holdings, avgRate, hideMarketColumns = false }) {
  // 같은 카테고리에 묶인 ETF(지수추종·다우존스배당 등)가 2개 이상이면 한 줄로 합쳐서 표시 — 공용 함수(holdingGrouping.js) 사용
  const displayHoldings = groupEtfHoldings(holdings);

  // 저장 당시 스냅샷(readOnly)엔 시가총액/거래대금 데이터가 없어서(항상 "-") 그 두 열 자체를 뺌
  const gridCols = hideMarketColumns ? "1fr 80px 70px 65px" : "1fr 80px 85px 85px 70px 65px";
  const gridMinWidth = hideMarketColumns ? 420 : 560;

  let cumulative = 0;
  const gradientStops = displayHoldings.map((h, i) => {
    const start = cumulative;
    cumulative += h.weight;
    return `${PALETTE[i % PALETTE.length]} ${start}% ${cumulative}%`;
  });
  const donutBg = `conic-gradient(${gradientStops.join(", ")})`;

  return (
    <div style={{ padding: 24, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: COLORS.textFaint }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginTop: 2 }}>{typeName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: COLORS.textFaint }}>평균 배당률</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary, marginTop: 2 }}>{avgRate != null ? avgRate.toFixed(1) : "-"}%</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 20 }}>
        <div style={{ position: "relative", width: 112, height: 112, flexShrink: 0 }}>
          <div style={{ width: 112, height: 112, borderRadius: "50%", background: donutBg }} />
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{displayHoldings.length}종목</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {displayHoldings.map((h, i) => (
            <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: COLORS.textMuted }} title={h.merged ? MERGED_HOLDING_NOTE : undefined}>
                {h.name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{h.weight}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 같은 카테고리의 ETF는 한 줄로 합쳐서 보여줌(holdingGrouping.js) — 합쳐진 줄은 상품명에 마우스를 올리면 안내 문구가 뜸 */}
      <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.border}`, paddingTop: 14, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: gridCols, fontSize: 11, fontWeight: 700, color: COLORS.textFaint, paddingBottom: 10, minWidth: gridMinWidth }}>
          <span>상품명</span>
          <span>구분</span>
          {!hideMarketColumns && <span style={{ textAlign: "right" }}>시가총액</span>}
          {!hideMarketColumns && <span style={{ textAlign: "right" }}>거래대금</span>}
          <span style={{ textAlign: "right" }}>연배당</span>
          <span style={{ textAlign: "right" }}>비중</span>
        </div>
        {displayHoldings.map((h) => (
          <div key={h.name} style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center", padding: "10px 0", borderTop: `1px solid ${COLORS.bg}`, minWidth: gridMinWidth }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text }} title={h.merged ? MERGED_HOLDING_NOTE : undefined}>
              {h.name}
            </span>
            <span>
              <span style={{ fontSize: 11, color: COLORS.textFaint, background: COLORS.bg, padding: "3px 8px", borderRadius: 6 }}>{KIND_LABEL[h.kind] ?? h.kind}</span>
            </span>
            {!hideMarketColumns && <span style={{ fontSize: 12.5, color: COLORS.textMuted, textAlign: "right" }}>{formatWon(h.marketCap)}</span>}
            {!hideMarketColumns && <span style={{ fontSize: 12.5, color: COLORS.textMuted, textAlign: "right" }}>{formatWon(h.tradingValue)}</span>}
            <span style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "right" }}>{h.rate != null ? `${h.rate}%` : "-"}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.primary, textAlign: "right" }}>{h.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}