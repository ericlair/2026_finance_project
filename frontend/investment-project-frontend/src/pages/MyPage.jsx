import { useEffect, useState } from "react";
import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";
import { TYPE_NAMES } from "./constants";
import { getSelections, deleteSelection } from "../api/portfolio";

// etfRatio가 100/0이면 반대쪽 type은 서버가 null로 내려줌(백엔드 확정 스펙) — 그 쪽은 라벨에서 뺌
function formatPortfolioLabel({ etfType, etfRatio, stockType, stockRatio }) {
  const parts = [];
  if (etfRatio > 0) parts.push(`ETF ${TYPE_NAMES[etfType]} ${etfRatio}%`);
  if (stockRatio > 0) parts.push(`배당주 ${TYPE_NAMES[stockType]} ${stockRatio}%`);
  return parts.join(" + ");
}

// etfRatio로 모드 역추론 — 서버 응답에 mode 필드가 없어서 항상 이걸로 판단 (100=ETF만, 0=배당주만, 그 외=블렌딩)
function inferMode(etfRatio) {
  if (etfRatio === 100) return "etfOnly";
  if (etfRatio === 0) return "stockOnly";
  return "blend";
}

// 서버가 내려주는 createdAt(ISO 문자열)을 "2026.10.28" 형태로
function formatDate(createdAt) {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const ENGINE_LABEL = { ETF: "ETF", STOCK: "배당주" };
const ENGINE_COLOR = { ETF: COLORS.primary, STOCK: COLORS.secondary };

// investorType — GET /api/auth/me 응답값(서버에 저장된 투자성향, 사용자당 1건). null이면 아직 설문 전.
// engine — "ETF" | "STOCK". 서버엔 저장 안 되는 값이라 이번 세션에 설문을 본 경우(surveyResult.engine)에만 전달됨 — 없으면 undefined
// onView(item) — 이력 한 줄 클릭 시 호출, PortfolioDetail(readOnly)로 조회 이동
export default function MyPage({ user = null, investorType = null, engine, onRetake, onResetType, onView, onLogin, onLogout, onDeleteAccount }) {
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // 삭제 확인 대상: { kind: "portfolio" | "type" | "account", id?, label }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSelections()
      .then((data) => {
        if (!cancelled) setPortfolioHistory(data);
      })
      .catch(() => {
        // 백엔드 미연결/API 미구현 등으로 실패하면 더미로 채우지 않고 빈 목록으로 둠 — "저장된 포트폴리오가 없습니다"로 표시됨
        if (!cancelled) setPortfolioHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestDeletePortfolio = (item) => {
    setPendingDelete({ kind: "portfolio", id: item.id, label: `${item.date} · ${formatPortfolioLabel(item)}` });
  };

  const requestResetType = () => {
    setPendingDelete({ kind: "type", label: "현재 진단된 투자성향을 초기화합니다." });
  };

  // 회원 탈퇴 — 되돌릴 수 없으므로 반드시 확인 모달을 거침 (DELETE /api/auth/me, 204면 탈퇴 완료 + 저장 이력도 같이 삭제됨)
  const requestDeleteAccount = () => {
    setDeleteError(null);
    setPendingDelete({ kind: "account", label: "탈퇴하면 계정과 저장된 포트폴리오 이력이 모두 삭제됩니다." });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "portfolio") {
      try {
        await deleteSelection(pendingDelete.id);
      } catch (e) {
        // 백엔드 미연결 상태에서는 실패해도 화면에서는 지워서 흐름을 계속 확인할 수 있게 함
      }
      setPortfolioHistory((prev) => prev.filter((h) => h.id !== pendingDelete.id));
    } else if (pendingDelete.kind === "type") {
      onResetType?.();
    } else if (pendingDelete.kind === "account") {
      try {
        await onDeleteAccount?.();
      } catch (e) {
        setDeleteError("탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        setPendingDelete(null);
        return;
      }
    }
    setPendingDelete(null);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, background: COLORS.bg }}>
      <Navbar variant="auth" activeTab="mypage" userInitial={user?.name?.[0]} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "44px 64px" }}>
        <div style={{ width: "100%", maxWidth: 760 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>마이페이지</h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              background: "#FFFFFF",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: COLORS.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  fontWeight: 700,
                  color: COLORS.primary,
                }}
              >
                {user?.name ? user.name[0] : "?"}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{user?.name ?? "로그인 필요"}</div>
                <div style={{ fontSize: 12.5, color: COLORS.textFaint }}>{user?.email ?? ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user ? (
                <>
                  <button
                    onClick={onLogout}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLORS.textFaint,
                      padding: "9px 16px",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 9,
                      background: "none",
                      cursor: "pointer",
                    }}
                  >
                    로그아웃
                  </button>
                  <span onClick={requestDeleteAccount} style={{ fontSize: 12, color: COLORS.textFaint, cursor: "pointer", textDecoration: "underline" }}>
                    회원탈퇴
                  </span>
                </>
              ) : (
                // 비로그인 상태 — 로그아웃/회원탈퇴는 의미가 없으니 로그인 화면으로 보내는 버튼만 보여줌
                <button
                  onClick={onLogin}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    padding: "9px 16px",
                    border: "none",
                    borderRadius: 9,
                    background: COLORS.primary,
                    cursor: "pointer",
                  }}
                >
                  로그인
                </button>
              )}
            </div>
          </div>

          {deleteError && (
            <p style={{ marginTop: 10, fontSize: 12.5, color: "#DC2626" }}>{deleteError}</p>
          )}

          <SectionTitle>현재 투자성향</SectionTitle>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px",
              background: "#FFFFFF",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
            }}
          >
            <div>
              {investorType ? (
                <span style={{ fontSize: 16, fontWeight: 700, color: engine ? ENGINE_COLOR[engine] : COLORS.primary }}>
                  {engine ? `${ENGINE_LABEL[engine]} ${TYPE_NAMES[investorType]}` : TYPE_NAMES[investorType]}
                </span>
              ) : (
                <span style={{ fontSize: 13.5, color: COLORS.textFaint }}>아직 진단된 투자성향이 없어요</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span onClick={onRetake} style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.primary, cursor: "pointer" }}>
                다시 검사하기
              </span>
              {investorType && (
                <span onClick={requestResetType} style={{ fontSize: 12.5, color: COLORS.textFaint, cursor: "pointer" }}>
                  초기화
                </span>
              )}
            </div>
          </div>

          <SectionTitle>추천 포트폴리오 이력</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {portfolioHistory.length === 0 ? (
              <EmptyRow text={loaded ? "저장된 포트폴리오가 없습니다" : "불러오는 중..."} />
            ) : (
              portfolioHistory.map((h) => (
                <HistoryRow
                  key={h.id}
                  left={`${formatDate(h.createdAt)} · ${formatPortfolioLabel(h)}`}
                  right="보기 →"
                  rightColor={COLORS.primary}
                  onClick={() =>
                    onView?.({ id: h.id, mode: h.mode ?? inferMode(h.etfRatio), etfRatio: h.etfRatio, etfType: h.etfType, stockType: h.stockType })
                  }
                  onDelete={() => requestDeletePortfolio(h)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmModal
          title={pendingDelete.kind === "account" ? "정말 탈퇴하시겠습니까?" : "정말 삭제하시겠습니까?"}
          confirmLabel={pendingDelete.kind === "account" ? "탈퇴" : "삭제"}
          message={pendingDelete.label}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ marginTop: 32, marginBottom: 10, fontSize: 13, fontWeight: 700, color: COLORS.textFaint }}>
      {children}
    </div>
  );
}

function EmptyRow({ text }) {
  return (
    <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: COLORS.textFaint }}>{text}</div>
  );
}

function HistoryRow({ left, right, rightColor, onClick, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "15px 18px",
        background: "#FFFFFF",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
      }}
    >
      <span onClick={onClick} style={{ fontSize: 13.5, color: COLORS.text, cursor: "pointer" }}>{left}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span onClick={onClick} style={{ fontSize: 12.5, fontWeight: 700, color: rightColor, cursor: "pointer" }}>{right}</span>
        <button
          onClick={onDelete}
          aria-label="삭제"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textFaint} strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ title = "정말 삭제하시겠습니까?", confirmLabel = "삭제", message, onCancel, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360,
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <h3 style={{ fontSize: 16, color: COLORS.text, margin: 0 }}>{title}</h3>
        </div>

        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>
          {message}
          <br />
          삭제하면 다시 되돌릴 수 없습니다.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: "#FFFFFF",
              color: COLORS.textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "#DC2626",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}