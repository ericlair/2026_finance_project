import { useState } from "react";
import { COLORS, FONT } from "./theme";
import Navbar from "./Navbar";

const TYPES = [
  { name: "원금집중형", desc: "저·중배당 2~8% · 원금 안정 중시", color: COLORS.primary },
  { name: "균형형", desc: "안정성과 수익성의 균형", color: COLORS.secondary },
  { name: "배당집중형", desc: "고배당 8~15% · 정기 현금흐름 중시", color: "#F59E0B" },
];

const DIVIDEND_REASONS = [
  {
    key: "growth",
    color: COLORS.primary,
    title: "목돈 마련 트랙",
    summary: "배당 재투자로 자산을 빠르게 불리고 싶다면",
    detail:
      "주가 등락과 무관하게 정기적으로 들어오는 배당금을 다시 같은 종목에 재투자하면, 보유 수량이 꾸준히 늘어나며 자산이 더 빠르게 불어나는 복리 효과를 기대할 수 있어요.",
  },
  {
    key: "pension",
    color: COLORS.secondary,
    title: "연금 대비 트랙",
    summary: "은퇴 이후 현금흐름을 미리 준비하고 싶다면",
    detail:
      "은퇴 이후 근로소득이 끊겨도, 보유한 배당주·ETF에서 매달 혹은 분기마다 현금이 들어오도록 포트폴리오를 구성해두면 생활비를 보완하는 제2의 현금흐름을 만들 수 있어요.",
  },
];

const PORTFOLIO_KINDS = [
  {
    key: "stock",
    color: COLORS.primary,
    title: "배당주 포트폴리오",
    summary: "안정적인 고배당 종목으로 구성",
    detail:
      "대형 금융지주·증권사 등 안정적인 종목과, 정기적인 현금흐름을 꾸준히 지급해온 이력을 검토해 선별한 고배당 종목들을 함께 구성해, 투자성향에 맞는 비중으로 배분한 결과입니다.",
  },
  {
    key: "etf",
    color: COLORS.secondary,
    title: "ETF 포트폴리오",
    summary: "지수·배당 ETF로 분산 구성",
    detail:
      "미국 대표지수(S&P500 등)와 다우존스 배당지수를 추종하는 ETF를 중심으로, 커버드콜 및 산업섹터 ETF를 함께 구성해, 투자성향에 맞는 비중으로 배분한 결과입니다.",
  },
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
          <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7, color: COLORS.textMuted, maxWidth: 1100}}>
            간단한 설문으로 투자성향을 진단하고, 배당주·ETF로 구성된 맞춤 포트폴리오를 확인해 보세요.
          </p>

          <SectionHeading>왜 배당 투자인가요?</SectionHeading>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
            {DIVIDEND_REASONS.map((item) => (
              <ExpandableCard key={item.key} {...item} />
            ))}
          </div>

          <SectionHeading>투자성향 3유형</SectionHeading>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 }}>
            {TYPES.map((t) => (
              <div key={t.name} style={{ padding: 20, background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, marginBottom: 12 }} />
                <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{t.name}</div>
                <div style={{ fontSize: 14, color: COLORS.textFaint, marginTop: 6, lineHeight: 1.6 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          <SectionHeading>포트폴리오 구성 방식</SectionHeading>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
            {PORTFOLIO_KINDS.map((item) => (
              <ExpandableCard key={item.key} {...item} />
            ))}
          </div>

          <SectionHeading>ISA 계좌를 아시나요?</SectionHeading>
          <ExpandableBanner
            title="ISA 계좌로 세금 아끼는 법"
            summary="일반 계좌보다 세후 수익을 더 키우고 싶다면"
            detail={
              <>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: COLORS.text }}>
                  국내 상장 ETF·배당주는 원래 배당소득세 15.4%가 붙지만, ISA(개인종합자산관리계좌)로 투자하면 일반형 기준
                  연 200만 원(서민형 400만 원)까지 비과세이고, 그 한도를 넘는 금액도 9.9% 저율 분리과세로 세금 부담이 줄어요.
                  여러 종목의 이익·손실을 합산해서 세금을 매기는 손익통산도 적용돼요.
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: COLORS.textFaint }}>
                  같은 포트폴리오라도 일반 계좌보다 ISA 계좌로 담았을 때 세후 수익이 더 커질 수 있어요.
                </p>
              </>
            }
          />

          <div style={{ marginTop: 20, padding: "16px 20px", background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textFaint }}>이용 안내</div>
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.8, color: COLORS.textMuted }}>
              <li>학습용 프로젝트로 만든 서비스이며, 투자 권유가 아닙니다. 투자 판단과 책임은 본인에게 있습니다.</li>
              <li>미리 선별한 배당주·ETF 안에서만 추천합니다.</li>
              <li>시세·배당 데이터는 실시간이 아니며, 영업일 다음 날 오후 1시 이후에 반영됩니다. (금요일 종가는 월요일에 반영)</li>
              <li>ETF 분배금은 SEIBro 공시값(세전)을 직접 조사해 입력한 값입니다.</li>
            </ul>
            <div style={{ marginTop: 10, fontSize: 13, color: COLORS.textFaint }}>
              출처: 금융위원회 주식시세정보·증권상품시세정보·주식배당정보 (공공데이터포털)
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

// 소주제 제목 — 기존(13px 회색) 대비 눈에 띄게 키움
function SectionHeading({ children }) {
  return <div style={{ marginTop: 40, fontSize: 19, fontWeight: 700, color: COLORS.text }}>{children}</div>;
}

// 카드 터치하면 세부 설명이 펼쳐짐 — 접힌 상태엔 한 줄 요약만 보임
function ExpandableCard({ color, title, summary, detail }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen((v) => !v)}
      style={{
        padding: 22,
        background: "#FFFFFF",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{title}</div>
        </div>
        <span
          style={{
            fontSize: 13,
            color: COLORS.textFaint,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          ▾
        </span>
      </div>

      {open ? (
        <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.7, color: COLORS.textMuted }}>{detail}</p>
      ) : (
        <p style={{ margin: "6px 0 0", fontSize: 15, color: COLORS.textMuted }}>{summary}</p>
      )}
    </div>
  );
}

// ISA 안내 배너 — 역시 터치하면 세부 내용 펼쳐짐
function ExpandableBanner({ title, summary, detail }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen((v) => !v)}
      style={{
        marginTop: 12,
        padding: "20px 22px",
        background: COLORS.primaryLight,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.primary }}>{title}</div>
        <span
          style={{
            fontSize: 13,
            color: COLORS.primary,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          ▾
        </span>
      </div>

      {open ? (
        <div style={{ marginTop: 8 }}>{detail}</div>
      ) : (
        <p style={{ margin: "6px 0 0", fontSize: 15, color: COLORS.text }}>{summary}</p>
      )}
    </div>
  );
}