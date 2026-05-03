'use client';

/**
 * /quote-calculator — 도배르만 견적 계산기 페이지
 * HTML 원본(도배르만_견적계산기.html) 100% 포팅
 * 도배르만 디자인 시스템 적용 (slate-900 bg, blue-600~purple-700 gradient)
 */

import { useState, useMemo } from 'react';
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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 md:pt-24 pb-6 px-4">
        <div className="max-w-6xl mx-auto">

          {/* ===== 헤더 ===== */}
          <header className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-2xl px-6 py-5 mb-5 shadow-lg shadow-blue-900/30 no-print">
            <h1 className="text-xl font-bold tracking-tight">
              도배르만 도배 예상 견적 계산기
            </h1>
            <p className="mt-1.5 text-sm opacity-90">
              아파트·빌라·주택, 평형·방수, 합지·실크 등을 종합 반영한 자동 견적 시스템 (2026 시장 평균 단가 기준)
            </p>
          </header>

          {/* ===== 2컬럼 그리드 (모바일: 1컬럼) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">

            {/* ======================================================
                좌측: 입력 영역
            ====================================================== */}
            <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 print-card no-print">

              {/* ① 기본 정보 */}
              <h2 className={SECTION_TITLE_CLS}>① 기본 정보</h2>
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
              <h2 className={SECTION_TITLE_CLS}>② 벽지 선택</h2>
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
              <h2 className={SECTION_TITLE_CLS}>③ 추가 작업 옵션</h2>
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
              <h2 className={SECTION_TITLE_CLS}>④ 마진 / 세금</h2>
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
            <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 print-card">
              <h2 className="text-sm font-bold text-blue-400 border-b border-slate-700 pb-1.5 mb-4">
                자동 산출 결과
              </h2>

              <table className="w-full text-sm">
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
      </div>

      {/* ===== SEO 강화 컨텐츠 ===== */}
      <section className="max-w-6xl mx-auto px-4 mt-12 md:mt-16 pb-16 space-y-12 md:space-y-16">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8">
          <StandardEstimateTable />
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8">
          <WallpaperComparisonGuide />
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8">
          <FaqAndGlossary />
        </div>
      </section>
    </>
  );
}

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
