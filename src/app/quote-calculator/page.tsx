'use client';

/**
 * /quote-calculator — 도배르만 견적 계산기 페이지
 * HTML 원본(도배르만_견적계산기.html) 100% 포팅
 * 도배르만 디자인 시스템 적용 (slate-900 bg, blue-600~purple-700 gradient)
 * SEO 강화: JSON-LD structured data, 시맨틱 HTML, 내부 링크, 추가 컨텐츠 섹션
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  calculateEstimate,
  calcQuickTable,
  buildFormulaText,
  won,
  QUICK_TARGETS,
  type CalculatorInput,
  type HousingType,
  type AgeType,
  type LiveType,
  type CeilHType,
  type ScopeType,
  type WallpaperType,
  type CeilWallpaperType,
  type VatType,
  type PayType,
} from '@/lib/quoteCalculator';
import StandardEstimateTable from './components/StandardEstimateTable';
import WallpaperComparisonGuide from './components/WallpaperComparisonGuide';
import FaqAndGlossary from './components/FaqAndGlossary';
import QuoteCalculatorJsonLd from './components/QuoteCalculatorJsonLd';

// ========== 기본 입력값 (HTML 원본 defaultValue/selected 속성 그대로) ==========
const DEFAULT_INPUT: CalculatorInput = {
  housing:  '아파트',
  age:      '10년이내',
  live:     '공실',
  pyeong:   32,
  rooms:    3,
  livingY:  true,
  ceilH:    '표준(2.3~2.5m)',
  scope:    '전체',
  wpLiving: '실크(중급)',
  wpRoom:   '합지(소폭)',
  wpCeil:   '합지(소폭)',
  funcGlue: false,
  pntRoll:  0,
  pntPrice: 50000,
  opDemo:   true,
  opMold:   0,
  opPutty:  0,
  opMold2:  false,
  opFurn:   false,
  opTrash:  true,
  opDist:   5,
  opUrg:    false,
  margin:   20,
  discount: 0,
  vat:      '별도',
  pay:      '계좌이체',
  adjPct:   0,
};

// ========== 공통 입력 스타일 ==========
const INPUT_CLS =
  'w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-colors';
const LABEL_CLS = 'block text-xs font-semibold text-slate-400 mb-1';
const SECTION_TITLE_CLS =
  'text-sm font-bold text-blue-400 border-b border-slate-700 pb-1.5 mb-3';

// ========== 메인 페이지 ==========
export default function QuoteCalculatorPage() {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  // 모든 입력이 바뀔 때마다 자동 재계산
  const result = useMemo(() => calculateEstimate(input), [input]);
  const formulaText = useMemo(() => buildFormulaText(input, result), [input, result]);
  const quickRows = useMemo(() => calcQuickTable(), []);

  // ===== 헬퍼 =====
  const set = <K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const setNum = (key: keyof CalculatorInput, raw: string) =>
    set(key, (parseFloat(raw) || 0) as CalculatorInput[typeof key]);

  const setBool = (key: keyof CalculatorInput, raw: string) =>
    set(key, (raw === '예') as CalculatorInput[typeof key]);

  const resetForm = () => setInput(DEFAULT_INPUT);

  return (
    <>
      {/* JSON-LD Structured Data (서버 컴포넌트) */}
      <QuoteCalculatorJsonLd />

      {/* 인쇄용 CSS — globals.css 수정 없이 인라인 */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-card {
            background: white !important;
            border: 1px solid #ccc !important;
            box-shadow: none !important;
          }
          .print-force-show { display: block !important; }
        }
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 md:pt-24 pb-6 px-4">
        <div className="max-w-6xl mx-auto">

          {/* ===== 헤더 ===== */}
          <header className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-2xl px-6 py-5 mb-5 shadow-lg shadow-blue-900/30 no-print">
            <h1 className="text-xl font-bold tracking-tight">
              도배 견적 계산기 — 평당·평형별 정밀 자동 견적
            </h1>
            <p className="mt-1.5 text-sm opacity-90">
              아파트·빌라·주택, 평형·방수, 합지·실크 등을 종합 반영한 자동 견적 시스템 (2026 시장 평균 단가 기준)
            </p>
            {/* 첫 단락 내부 링크 */}
            <p className="mt-2 text-xs opacity-75">
              견적이 마음에 드셨다면{' '}
              <Link href="/quote-request" className="underline underline-offset-2 hover:opacity-100 font-medium">
                실제 견적 신청
              </Link>
              {' '}또는{' '}
              <Link href="/quote-request-ai" className="underline underline-offset-2 hover:opacity-100 font-medium">
                AI 견적 받기
              </Link>
              {' '}를 이용해 보세요.
            </p>
          </header>

          {/* ===== 2컬럼 그리드 (모바일: 1컬럼) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">

            {/* ======================================================
                좌측: 입력 영역
            ====================================================== */}
            <section
              id="calculator-input"
              aria-labelledby="input-heading"
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 print-card no-print"
            >
              <h2 id="input-heading" className="sr-only">견적 입력 폼</h2>

              {/* ① 기본 정보 */}
              <h3 className={SECTION_TITLE_CLS}>① 기본 정보</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                <div>
                  <label className={LABEL_CLS}>주거 형태</label>
                  <select
                    className={INPUT_CLS}
                    value={input.housing}
                    onChange={(e) => set('housing', e.target.value as HousingType)}
                  >
                    {(['아파트','빌라(다세대/연립)','단독주택','원룸·오피스텔','상가·사무실','기타'] as HousingType[]).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>건물 연식</label>
                  <select
                    className={INPUT_CLS}
                    value={input.age}
                    onChange={(e) => set('age', e.target.value as AgeType)}
                  >
                    {(['신축(입주청소前)','5년이내','10년이내','15년이내','15년이상'] as AgeType[]).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>거주 상태</label>
                  <select
                    className={INPUT_CLS}
                    value={input.live}
                    onChange={(e) => set('live', e.target.value as LiveType)}
                  >
                    <option>공실</option>
                    <option>거주中</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    전용 평형(평){' '}
                    <span className="ml-1 text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full font-medium">실평수</span>
                  </label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.pyeong}
                    min={1}
                    onChange={(e) => setNum('pyeong', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>방 갯수</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.rooms}
                    min={1}
                    onChange={(e) => setNum('rooms', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>거실+주방 포함</label>
                  <select
                    className={INPUT_CLS}
                    value={input.livingY ? '예' : '아니오'}
                    onChange={(e) => setBool('livingY', e.target.value)}
                  >
                    <option>예</option>
                    <option>아니오</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>천장 높이</label>
                  <select
                    className={INPUT_CLS}
                    value={input.ceilH}
                    onChange={(e) => set('ceilH', e.target.value as CeilHType)}
                  >
                    {(['표준(2.3~2.5m)','높음(2.7m+)','매우높음(3m+)','낮음(2.2m이하)'] as CeilHType[]).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>도배 범위</label>
                  <select
                    className={INPUT_CLS}
                    value={input.scope}
                    onChange={(e) => set('scope', e.target.value as ScopeType)}
                  >
                    {(['전체','벽만','천장만','부분도배','거실만'] as ScopeType[]).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ② 벽지 선택 */}
              <h3 className={SECTION_TITLE_CLS}>② 벽지 선택</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                <div>
                  <label className={LABEL_CLS}>거실/주방 벽지</label>
                  <select
                    className={INPUT_CLS}
                    value={input.wpLiving}
                    onChange={(e) => set('wpLiving', e.target.value as WallpaperType)}
                  >
                    {(['합지(소폭)','광폭합지','실크(보급)','실크(중급)','실크(고급)','친환경·방염','수입벽지'] as WallpaperType[]).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>방 벽지</label>
                  <select
                    className={INPUT_CLS}
                    value={input.wpRoom}
                    onChange={(e) => set('wpRoom', e.target.value as WallpaperType)}
                  >
                    {(['합지(소폭)','광폭합지','실크(보급)','실크(중급)','실크(고급)','친환경·방염','수입벽지'] as WallpaperType[]).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>천장 벽지</label>
                  <select
                    className={INPUT_CLS}
                    value={input.wpCeil}
                    onChange={(e) => set('wpCeil', e.target.value as CeilWallpaperType)}
                  >
                    {(['합지(소폭)','광폭합지','실크(보급)','실크(중급)'] as CeilWallpaperType[]).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>기능성 풀(곰팡이 방지)</label>
                  <select
                    className={INPUT_CLS}
                    value={input.funcGlue ? '예' : '아니오'}
                    onChange={(e) => setBool('funcGlue', e.target.value)}
                  >
                    <option>아니오</option>
                    <option>예</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>포인트 벽지(롤)</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.pntRoll}
                    min={0}
                    onChange={(e) => setNum('pntRoll', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>포인트 단가/롤</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.pntPrice}
                    min={0}
                    step={1000}
                    onChange={(e) => setNum('pntPrice', e.target.value)}
                  />
                </div>
              </div>

              {/* ③ 추가 작업 옵션 */}
              <h3 className={SECTION_TITLE_CLS}>③ 추가 작업 옵션</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                <div>
                  <label className={LABEL_CLS}>기존 벽지 철거</label>
                  <select
                    className={INPUT_CLS}
                    value={input.opDemo ? '예' : '아니오'}
                    onChange={(e) => setBool('opDemo', e.target.value)}
                  >
                    <option>예</option>
                    <option>아니오</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>곰팡이 제거(부위)</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.opMold}
                    min={0}
                    onChange={(e) => setNum('opMold', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>벽 보수/퍼티(평)</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.opPutty}
                    min={0}
                    step={0.5}
                    onChange={(e) => setNum('opPutty', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>몰딩 시공</label>
                  <select
                    className={INPUT_CLS}
                    value={input.opMold2 ? '예' : '아니오'}
                    onChange={(e) => setBool('opMold2', e.target.value)}
                  >
                    <option>아니오</option>
                    <option>예</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>가구 이동</label>
                  <select
                    className={INPUT_CLS}
                    value={input.opFurn ? '예' : '아니오'}
                    onChange={(e) => setBool('opFurn', e.target.value)}
                  >
                    <option>아니오</option>
                    <option>예</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>폐기물 처리</label>
                  <select
                    className={INPUT_CLS}
                    value={input.opTrash ? '예' : '아니오'}
                    onChange={(e) => setBool('opTrash', e.target.value)}
                  >
                    <option>예</option>
                    <option>아니오</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>출장 거리(km)</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.opDist}
                    min={0}
                    onChange={(e) => setNum('opDist', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>긴급/야간 작업</label>
                  <select
                    className={INPUT_CLS}
                    value={input.opUrg ? '예' : '아니오'}
                    onChange={(e) => setBool('opUrg', e.target.value)}
                  >
                    <option>아니오</option>
                    <option>예</option>
                  </select>
                </div>
              </div>

              {/* ④ 마진/세금 */}
              <h3 className={SECTION_TITLE_CLS}>④ 마진 / 세금</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                <div>
                  <label className={LABEL_CLS}>사업자 마진율(%)</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.margin}
                    min={0}
                    onChange={(e) => setNum('margin', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>할인율(%)</label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.discount}
                    min={0}
                    onChange={(e) => setNum('discount', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>VAT</label>
                  <select
                    className={INPUT_CLS}
                    value={input.vat}
                    onChange={(e) => set('vat', e.target.value as VatType)}
                  >
                    <option>별도</option>
                    <option>포함</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>결제 방식</label>
                  <select
                    className={INPUT_CLS}
                    value={input.pay}
                    onChange={(e) => set('pay', e.target.value as PayType)}
                  >
                    <option>현금</option>
                    <option>계좌이체</option>
                    <option>카드</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>
                    면적 보정(%)
                    <span className="ml-1 text-[10px] text-slate-500 font-normal">[발코니 확장 등]</span>
                  </label>
                  <input
                    type="number"
                    className={INPUT_CLS}
                    value={input.adjPct}
                    onChange={(e) => setNum('adjPct', e.target.value)}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md shadow-blue-900/30"
                >
                  견적서 인쇄
                </button>
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800 border border-slate-600 hover:border-slate-500 hover:text-white transition-all"
                >
                  ↺ 초기화
                </button>
              </div>
            </section>

            {/* ======================================================
                우측: 결과 영역
            ====================================================== */}
            <section
              id="calculator-result"
              aria-labelledby="result-heading"
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 print-card"
            >
              <h2 id="result-heading" className="text-sm font-bold text-blue-400 border-b border-slate-700 pb-1.5 mb-4">
                자동 산출 결과
              </h2>

              <table className="w-full text-sm">
                <caption className="sr-only">도배 견적 자동 산출 결과 — 자재비, 인건비, 옵션, 합계</caption>
                <tbody>
                  {/* 시공 평수 */}
                  <ResultRow label="도배 시공평수" value={`${result.dPyeong.toFixed(1)}평`} />

                  {/* 자재비 */}
                  <SubHeader label="▣ 자재비" />
                  <ResultRow label="거실/주방 벽지"   value={won(result.mLiv)}  />
                  <ResultRow label="방 벽지"           value={won(result.mRoom)} />
                  <ResultRow label="천장 벽지"         value={won(result.mCeil)} />
                  <ResultRow label="포인트 벽지"       value={won(result.mPnt)}  />
                  <ResultRow label="부자재(풀·본드 등)" value={won(result.mSub)}  />
                  <ResultRow label="기능성 풀 가산"    value={won(result.mFunc)} />
                  <SubTotal  label="자재비 소계"       value={won(result.mSum)}  />

                  {/* 인건비 */}
                  <SubHeader label="▣ 인건비(시공)" />
                  <ResultRow label="거실/주방 시공"   value={won(result.lLiv)}  />
                  <ResultRow label="방 시공"          value={won(result.lRoom)} />
                  <ResultRow label="천장 시공"        value={won(result.lCeil)} />
                  <ResultRow label="주거형태/연식 가산" value={won(result.lAdj)} />
                  <ResultRow label="긴급·야간 가산"   value={won(result.lUrg)}  />
                  <SubTotal  label="인건비 소계"      value={won(result.lSum)}  />

                  {/* 옵션 */}
                  <SubHeader label="▣ 추가 옵션" />
                  <ResultRow label="기존 벽지 철거" value={won(result.oDemo)}  />
                  <ResultRow label="곰팡이 제거"    value={won(result.oMold)}  />
                  <ResultRow label="벽 보수/퍼티"   value={won(result.oPutty)} />
                  <ResultRow label="몰딩 시공"      value={won(result.oMold2)} />
                  <ResultRow label="가구 이동"      value={won(result.oFurn)}  />
                  <ResultRow label="폐기물 처리"    value={won(result.oTrash)} />
                  <ResultRow label="출장비"         value={won(result.oDist)}  />
                  <SubTotal  label="옵션 소계"      value={won(result.oSum)}   />

                  {/* 합계/마진/세금 */}
                  <SubHeader label="▣ 합계 / 마진 / 세금" />
                  <ResultRow label="원가 합계"    value={won(result.cost)}    />
                  <ResultRow label="마진"         value={won(result.marginV)} />
                  <ResultRow label="공급가액"     value={won(result.supply)}  />
                  <ResultRow label="할인"         value={`-${won(result.discV)}`} />
                  <ResultRow label="VAT (10%)"    value={won(result.vatV)}    />
                  <ResultRow label="카드 수수료(2%)" value={won(result.cardV)} />

                  {/* 최종 합계 */}
                  <tr>
                    <td
                      colSpan={2}
                      className="pt-2 pb-1"
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl px-4 py-3 flex justify-between items-center">
                        <span className="text-white font-bold text-sm">최종 청구 견적</span>
                        <span className="text-white font-black text-lg tabular-nums">
                          {won(result.final)}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 계산식 보기 — 임시 비공개 (필요 시 주석 해제하여 노출)
              <details
                className="mt-4"
                open={formulaOpen}
                onToggle={(e) => setFormulaOpen((e.target as HTMLDetailsElement).open)}
              >
                <summary className="cursor-pointer text-blue-400 font-semibold text-sm select-none">
                  적용된 계산식 보기
                </summary>
                <pre className="mt-2 bg-slate-800/60 border border-amber-400/30 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-amber-200/80 whitespace-pre-wrap overflow-x-auto">
                  {formulaText}
                </pre>
              </details>
              */}

              {/* 빠른 견적표 */}
              <details
                className="mt-4"
                open={quickOpen}
                onToggle={(e) => setQuickOpen((e.target as HTMLDetailsElement).open)}
              >
                <summary className="cursor-pointer text-blue-400 font-semibold text-sm select-none">
                  평형별 빠른 견적표 보기
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse min-w-[360px]">
                    <caption className="sr-only">평형별 빠른 도배 견적 비교표</caption>
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
                        <th className="px-2 py-1.5 text-center font-semibold border border-slate-600">평형</th>
                        {QUICK_TARGETS.map((t) => (
                          <th key={t} className="px-2 py-1.5 text-right font-semibold border border-slate-600">{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {quickRows.map((row, i) => (
                        <tr
                          key={row.size}
                          className={i % 2 === 0 ? 'bg-slate-800/60' : 'bg-slate-800/30'}
                        >
                          <td className="px-2 py-1.5 text-center font-semibold text-slate-200 border border-slate-700">
                            {row.size}평
                          </td>
                          {row.values.map((v, j) => (
                            <td
                              key={j}
                              className="px-2 py-1.5 text-right tabular-nums text-slate-300 border border-slate-700"
                            >
                              {v.toLocaleString('ko-KR')}원
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    ※ 전체도배 / 표준천장 / 옵션없음 / 마진 20% / VAT 별도 가정
                  </p>
                </div>
              </details>

              {/* 안내 문구 */}
              <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
                ※ 본 견적은 표준 단가 기반 예상치이며 실측 후 최종 견적이 확정됩니다.<br />
                ※ 단가 출처: 숨고·오늘의집·마미견적·방산시장·시공플러스·세라건축 등 2026년 시장 평균값.
              </p>
            </section>

          </div>{/* /grid */}
        </div>{/* /max-w */}
      </main>

      {/* ===== SEO 강화 컨텐츠 ===== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pb-16">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">

          {/* 평형별 표준 견적표 */}
          <section
            id="standard-estimate-table"
            aria-labelledby="table-heading"
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8"
          >
            <StandardEstimateTable />
          </section>

          {/* 합지 vs 실크 비교 가이드 */}
          <section
            id="wallpaper-comparison"
            aria-labelledby="comparison-heading"
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8"
          >
            <WallpaperComparisonGuide />
          </section>

          {/* FAQ + 용어사전 */}
          <section
            id="faq-glossary"
            aria-labelledby="faq-heading"
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8"
          >
            <FaqAndGlossary />
          </section>

          {/* ===== 5-A. 사용 가이드 (HowTo 시각화) ===== */}
          <section
            id="how-to-use"
            aria-labelledby="howto-heading"
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8"
          >
            <h2 id="howto-heading" className="text-2xl font-bold text-white mb-2">
              이렇게 사용하세요 — 4단계 사용 가이드
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              견적 계산기를 처음 사용하신다면 아래 4단계를 따라해 보세요.
            </p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
              {HOW_TO_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-slate-700 bg-slate-800/30 px-5 py-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-300 text-sm font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-slate-100 text-sm">{step.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-slate-500">
              계산 결과가 마음에 드셨다면{' '}
              <Link href="/quote-request" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
                실제 견적 신청
              </Link>
              {' '}으로 넘어가 전문가에게 정확한 현장 실측 견적을 받아보세요.
            </p>
          </section>

          {/* ===== 5-B. 도배 견적 시 꼭 확인할 체크리스트 ===== */}
          <section
            id="checklist"
            aria-labelledby="checklist-heading"
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8"
          >
            <h2 id="checklist-heading" className="text-2xl font-bold text-white mb-2">
              도배 견적 시 꼭 확인할 체크리스트
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              견적 오차를 줄이고 후회 없는 시공을 위해 아래 10가지를 사전에 확인하세요.
            </p>
            <ol className="space-y-4" role="list">
              {CHECKLIST_ITEMS.map((item, i) => (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-xl border border-slate-700 bg-slate-800/30 px-5 py-4"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 text-xs font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-slate-500">
              위 항목을 모두 확인한 후{' '}
              <Link href="/quote-request-ai" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
                AI 견적
              </Link>
              {' '}을 통해 더욱 정밀한 맞춤 견적을 받아보실 수 있습니다.
            </p>
          </section>

          {/* ===== 4단계: 관련 페이지 내부 링크 ===== */}
          <section
            id="related-pages"
            aria-labelledby="related-heading"
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8"
          >
            <h2 id="related-heading" className="text-2xl font-bold text-white mb-4">
              관련 페이지
            </h2>
            <nav aria-label="관련 페이지 링크">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3" role="list">
                <li>
                  <Link
                    href="/quote-request"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-3.5 text-sm font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/60 hover:text-white transition-all"
                  >
                    <span aria-hidden="true">📝</span>
                    실제 견적 신청하기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote-request-ai"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-3.5 text-sm font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/60 hover:text-white transition-all"
                  >
                    <span aria-hidden="true">🤖</span>
                    AI 견적 받기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote-calculator#standard-estimate-table"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-3.5 text-sm font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/60 hover:text-white transition-all"
                  >
                    <span aria-hidden="true">💰</span>
                    평형별 도배 가격표
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote-calculator#wallpaper-comparison"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-3.5 text-sm font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/60 hover:text-white transition-all"
                  >
                    <span aria-hidden="true">🎨</span>
                    벽지 종류 비교 가이드
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote-calculator#checklist"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-3.5 text-sm font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/60 hover:text-white transition-all"
                  >
                    <span aria-hidden="true">🛠</span>
                    도배 체크리스트
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote-calculator#faq-glossary"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-3.5 text-sm font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/60 hover:text-white transition-all"
                  >
                    <span aria-hidden="true">❓</span>
                    자주 묻는 질문
                  </Link>
                </li>
              </ul>
            </nav>
          </section>

        </div>
      </div>
    </>
  );
}

// ========== SEO 추가 컨텐츠 데이터 ==========

const HOW_TO_STEPS = [
  {
    title: '기본 정보 입력',
    desc: '주거 형태(아파트·빌라·주택), 전용 평형, 방 개수, 천장 높이를 선택합니다. 분양평수가 아닌 전용면적 기준으로 입력해야 정확한 견적이 산출됩니다.',
  },
  {
    title: '벽지 종류 선택',
    desc: '거실·방·천장 각각에 합지(소폭·광폭), 실크(보급·중급·고급), 친환경·방염, 수입벽지 중 원하는 벽지를 선택합니다. 공간별로 다른 벽지를 지정할 수 있습니다.',
  },
  {
    title: '추가 옵션 설정',
    desc: '철거 시공 여부, 곰팡이 제거, 벽 보수(퍼티), 몰딩 시공, 가구 이동, 폐기물 처리 등 추가 작업 항목을 체크합니다. 각 옵션은 비용에 자동 반영됩니다.',
  },
  {
    title: '최종 견적 확인',
    desc: '자재비·인건비·옵션 소계와 마진, 할인, VAT(10%), 카드 수수료가 모두 반영된 최종 청구 견적이 우측 결과 패널에 실시간으로 표시됩니다.',
  },
];

const CHECKLIST_ITEMS = [
  {
    title: '전용면적(실평수) 기준으로 입력',
    desc: '분양평수와 전용면적은 다릅니다. 등기부등본이나 관리비 고지서에 표기된 전용면적(㎡)을 0.3025로 나누면 평수가 됩니다.',
  },
  {
    title: '천장 높이 확인',
    desc: '표준 천장 높이는 2.3~2.5m입니다. 복층이나 인테리어 리모델링으로 2.7m 이상인 경우 시공 면적이 늘어나 추가 비용이 발생합니다.',
  },
  {
    title: '베란다(발코니) 확장 여부',
    desc: '발코니를 실내로 확장한 경우 해당 면적이 추가됩니다. 계산기의 "면적 보정(%)" 항목에 5~15% 범위에서 입력하세요.',
  },
  {
    title: '거주 중 시공 여부',
    desc: '입주자가 있는 상태에서 시공하면 가구 이동 비용과 인건비(약 5%) 가산이 발생합니다. 가능하면 이사 전후에 시공하는 것이 비용 절감에 유리합니다.',
  },
  {
    title: '기존 벽지 종류 (실크면 철거 필수)',
    desc: '현재 시공된 벽지가 실크인 경우 덧방이 불가해 철거가 필수입니다. 합지 위 합지 덧방은 가능하지만 시공 품질 저하 우려가 있습니다.',
  },
  {
    title: '가구 이동 필요 여부',
    desc: '대형 가구(소파·침대·장롱)를 이동해야 한다면 가구 이동 옵션을 선택하세요. 업체가 직접 이동하는 경우 별도 비용이 청구됩니다.',
  },
  {
    title: '곰팡이·벽면 보수 상태',
    desc: '벽면에 곰팡이가 있거나 균열이 심하다면 사전 방균 처리와 퍼티 작업이 필요합니다. 이를 생략하면 시공 후 재발 및 하자가 발생할 수 있습니다.',
  },
  {
    title: '몰딩 시공 여부',
    desc: '기존 몰딩이 파손됐거나 새로 설치하려는 경우 도배와 함께 진행하면 효율적입니다. 몰딩 교체 시 자재비와 시공비가 별도 추가됩니다.',
  },
  {
    title: 'VAT 포함 여부 확인',
    desc: '간이과세자 업체는 VAT를 별도 청구하지 않을 수 있습니다. 견적서에 VAT 포함·별도 여부가 명시되어 있는지 반드시 확인하세요.',
  },
  {
    title: 'A/S 보증 기간 확인',
    desc: '도배 후 들뜸·기포·이음새 벌어짐 등 하자에 대해 일반적으로 1년 무상 A/S를 제공합니다. 계약 전 보증 기간과 범위를 서면으로 확인하세요.',
  },
];

// ========== 보조 컴포넌트 ==========

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-800">
      <td className="py-1.5 px-1 text-slate-400">{label}</td>
      <td className="py-1.5 px-1 text-right tabular-nums text-slate-200">{value}</td>
    </tr>
  );
}

function SubHeader({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={2}
        className="pt-3 pb-1 px-1 text-xs font-bold text-slate-300 bg-slate-800/50"
      >
        {label}
      </td>
    </tr>
  );
}

function SubTotal({ label, value }: { label: string; value: string }) {
  return (
    <tr className="bg-slate-800/70">
      <td className="py-2 px-1 font-bold text-slate-200">{label}</td>
      <td className="py-2 px-1 text-right tabular-nums font-bold text-slate-100">{value}</td>
    </tr>
  );
}
