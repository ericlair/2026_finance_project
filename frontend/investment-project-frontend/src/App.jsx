import { useEffect, useState } from "react";

import Prologue from "./pages/Prologue";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Intro from "./pages/Intro";
import Survey from "./pages/Survey";
import SurveyResult from "./pages/SurveyResult";
import RatioSetting from "./pages/RatioSetting";
import PortfolioDetail from "./pages/PortfolioDetail";
import MyPage from "./pages/MyPage";
import CompoundCalculator from "./pages/CompoundCalculator";
import RebalanceCalculator from "./pages/RebalanceCalculator";
import { getMe, updateInvestorType, resetInvestorType, logout, deleteAccount } from "./api/auth";
import { createSelection } from "./api/portfolio";

// 화면 확인용 스위처 — 실제 라우팅(react-router-dom) 붙이기 전 임시 전환 수단
const HAS_SEEN_PROLOGUE_KEY = "hasSeenPrologue";

const PAGE_KEYS = [
  { key: "prologue", label: "프롤로그" },
  { key: "login", label: "로그인" },
  { key: "landing", label: "랜딩(허브)" },
  { key: "intro", label: "서비스소개" },
  { key: "survey", label: "설문" },
  { key: "surveyResult", label: "설문결과" },
  { key: "ratioSetting", label: "비율설정" },
  { key: "portfolioDetail", label: "포트폴리오세부(선택)" },
  { key: "portfolioDetailSaved", label: "포트폴리오세부(조회)" },
  { key: "myPage", label: "마이페이지" },
  { key: "compoundCalc", label: "복리 계산기" },
  { key: "rebalanceCalc", label: "리밸런싱 계산기" },
];

function App() {
  // 최초 방문이면 프롤로그부터, 이미 본 적 있으면 바로 로그인으로
  const [current, setCurrent] = useState(() => {
    try {
      return localStorage.getItem(HAS_SEEN_PROLOGUE_KEY) ? "login" : "prologue";
    } catch (e) {
      return "login";
    }
  });

  // investorType — GET /api/auth/me 응답값 (사용자당 1건, 덮어쓰기). 백엔드 미연결 시엔 설문 완료 시에만 채워짐
  const [investorType, setInvestorType] = useState(null);
  // user — { name, email } (로그인 안 됐으면 null). getMe()가 401이면 null을 돌려주므로 에러가 아니라 정상 분기로 처리
  const [user, setUser] = useState(null);
  // preferredEngine — 서버에 저장된 운용방식 선호("ETF" | "STOCK" | null, GET /api/auth/me 응답의 새 필드)
  // 이번 세션에 설문을 안 봐도(surveyResult가 null이어도) 이 값으로 추천 뱃지를 띄울 수 있음
  const [preferredEngine, setPreferredEngine] = useState(null);

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me) {
          setUser({ name: me.name, email: me.email });
          setInvestorType(me.investorType ?? null);
          setPreferredEngine(me.preferredEngine ?? null);
        } else {
          // 401 — 로그인 안 된 상태. user/investorType/preferredEngine 모두 비워둠
          setUser(null);
          setInvestorType(null);
          setPreferredEngine(null);
        }
      })
      .catch(() => {
        // 백엔드 자체가 안 떠있는 등 — 데모용으로 화면은 그대로 둠
      });
  }, []);

  const [surveyResult, setSurveyResult] = useState(null); // Survey.jsx의 judgeResult()가 계산한 { type, engine, scoreA, etfVotes }
  const [selection, setSelection] = useState({ mode: "blend", etfRatio: 50, etfType: "BALANCED", stockType: "BALANCED" });
  // 저장(POST /api/portfolio/selections) 실패 메시지 — 비로그인(401)이면 "로그인이 필요합니다.", 그 외는 서버 에러 메시지
  const [saveError, setSaveError] = useState(null);

  // 마이페이지 "로그아웃" — 서버 세션 끊고 로컬 상태도 초기화한 뒤 로그인 화면으로
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // 백엔드 미연결 상태에서는 실패해도 화면 전환은 계속 진행
    }
    setUser(null);
    setInvestorType(null);
    setPreferredEngine(null);
    setSurveyResult(null);
    setCurrent("login");
  };

  // 마이페이지 "회원 탈퇴" — 확인 후 호출. 성공(204)하면 저장 이력도 같이 삭제되므로 로그아웃과 동일하게 상태 초기화
  const handleDeleteAccount = async () => {
    await deleteAccount();
    setUser(null);
    setInvestorType(null);
    setPreferredEngine(null);
    setSurveyResult(null);
    setCurrent("login");
  };

  // Survey.jsx 마지막 문항 "결과 보기" → onFinish(judgeResult(answers))가 호출됨
  // result 형태: { type, engine, scoreA, etfVotes } — engine: "ETF" | "STOCK"
  // 포트폴리오를 만들러 가지 않고 여기서 멈춰도 결과가 남아있어야 하므로, 결과 화면으로 넘어가는 이 시점에 바로 서버 저장까지 끝냄
  // (로그인 상태일 때만 — 미로그인이면 401만 날 게 뻔하니 PUT 호출 자체는 건너뛰고 화면 상태만 세션에 둠)
  const handleSurveyComplete = async (result) => {
    setSurveyResult(result);
    if (user) {
      try {
        await updateInvestorType(result.type, result.engine);
      } catch (e) {
        // 네트워크 문제 등으로 실패해도 화면 전환은 계속 진행 — 화면 상태는 아래에서 그대로 반영됨
      }
    }
    setInvestorType(result.type);
    setPreferredEngine(result.engine);
    setCurrent("surveyResult");
  };

  const handleSurveyCancel = () => setCurrent("landing");

  // SurveyResult에서 "포트폴리오 만들기" — 저장은 handleSurveyComplete에서 이미 끝났으니 화면 전환만
  const handleSurveyNext = () => {
    setCurrent("ratioSetting");
  };

  const handleRetake = () => setCurrent("survey");

  // 프롤로그 끝까지 보거나 건너뛰기 — 최초 1회만 뜨도록 기록 (설정탭의 "다시보기"에서는
  // 이 플래그 체크 없이 setCurrent("prologue")만 호출하면 재생됨)
  const handlePrologueFinish = () => {
    try {
      localStorage.setItem(HAS_SEEN_PROLOGUE_KEY, "true");
    } catch (e) {
      // localStorage 사용 불가 — 다음에도 다시 뜰 수 있지만 기능엔 지장 없음
    }
    setCurrent("login");
  };

  const handleResetType = async () => {
    if (user) {
      try {
        await resetInvestorType();
      } catch (e) {
        // 위와 동일 — 네트워크 문제 등으로 실패해도 화면 상태는 그대로 초기화
      }
    }
    setInvestorType(null);
    setPreferredEngine(null);
  };

  const handleLandingNavigate = (key) => {
    const map = { mypage: "myPage", intro: "intro", survey: "survey", ratioSetting: "ratioSetting" };
    setCurrent(map[key] ?? key);
  };

  const handleRatioConfirm = (sel) => {
    setSelection(sel);
    setSaveError(null);
    setCurrent("portfolioDetail");
  };

  // PortfolioDetail "이 포트폴리오로 선택하기" — 서버에 저장(POST). 저장이 실제로 성공했을 때만 마이페이지로 이동하고,
  // 실패(비로그인 401 포함)하면 화면에 머물면서 에러만 보여줌 — "저장됐어요"처럼 보이는 상태 전환을 하지 않음
  const handleSelectionConfirm = async (sel) => {
    try {
      await createSelection(sel);
      setSaveError(null);
      setCurrent("myPage");
    } catch (e) {
      setSaveError(e.message || "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // 마이페이지 이력 한 줄 클릭 — 그 포트폴리오를 조회(readOnly)로 보여줌
  const handleViewSelection = (sel) => {
    setSelection(sel);
    setCurrent("portfolioDetailSaved");
  };

  const PAGES = {
    prologue: <Prologue onFinish={handlePrologueFinish} />,
    login: <Login />,
    landing: <Landing userName={user?.name ?? "회원"} investorType={investorType} onNavigate={handleLandingNavigate} />,
    intro: <Intro />,
    survey: <Survey onFinish={handleSurveyComplete} onCancel={handleSurveyCancel} />,
    surveyResult: (
      <SurveyResult
        type={surveyResult?.type}
        engine={surveyResult?.engine}
        onNext={handleSurveyNext}
        onRetry={handleRetake}
      />
    ),
    ratioSetting: (
      <RatioSetting
        initialEtfType={investorType ?? "BALANCED"}
        initialStockType={investorType ?? "BALANCED"}
        initialMode={preferredEngine === "STOCK" ? "stockOnly" : preferredEngine === "ETF" ? "etfOnly" : "blend"}
        // investorType/preferredEngine은 설문을 막 끝낸 직후든, 로그인해서 GET /api/auth/me로 받아왔든 항상 서버에 저장된
        // 최신값과 같게 맞춰둠(handleSurveyNext/handleResetType 참고) — 그래서 이 두 값만으로 추천 뱃지를 결정하면 됨
        recommendedEtfType={preferredEngine === "ETF" ? investorType : undefined}
        recommendedStockType={preferredEngine === "STOCK" ? investorType : undefined}
        userInitial={user?.name?.[0]}
        onConfirm={handleRatioConfirm}
      />
    ),
    portfolioDetail: (
      <PortfolioDetail
        {...selection}
        userInitial={user?.name?.[0]}
        saveError={saveError}
        onConfirm={handleSelectionConfirm}
        onBack={() => {
          setSaveError(null);
          setCurrent("ratioSetting");
        }}
      />
    ),
    portfolioDetailSaved: (
      <PortfolioDetail
        {...selection}
        readOnly
        userInitial={user?.name?.[0]}
        onBack={() => setCurrent("myPage")}
        onNotFound={() => setCurrent("myPage")}
      />
    ),
    myPage: (
      <MyPage
        user={user}
        investorType={investorType}
        engine={preferredEngine ?? undefined}
        onRetake={handleRetake}
        onResetType={handleResetType}
        onView={handleViewSelection}
        onLogin={() => setCurrent("login")}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />
    ),
    compoundCalc: <CompoundCalculator userInitial={user?.name?.[0]} onBack={() => setCurrent("landing")} />,
    rebalanceCalc: <RebalanceCalculator userInitial={user?.name?.[0]} onBack={() => setCurrent("landing")} />,
  };

  return (
    <div>
      {/* 개발 중에만 보이는 페이지 전환 바 — 나중에 라우팅 붙이면 통째로 지우면 됨 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: 8,
          background: "#111",
        }}
      >
        {PAGE_KEYS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCurrent(key)}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: current === key ? "#2563EB" : "#333",
              color: "#fff",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ paddingTop: 44 }}>{PAGES[current]}</div>
    </div>
  );
}

export default App;