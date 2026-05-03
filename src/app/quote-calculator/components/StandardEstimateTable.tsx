'use client';

/**
 * 평형별 표준 도배 견적표
 * SEO 키워드: 24평 도배 가격, 32평 도배 견적, 40평 도배 비용 등
 * quoteCalculator.ts 의 RATES, SCOPE_K, QUICK_SIZES 재사용
 */

import { RATES, SUB_MAT, QUICK_SIZES } from '@/lib/quoteCalculator';

// 표에 표시할 벽지 종류 (컬럼 순서)
const TABLE_TARGETS = [
  { key: '합지(소폭)',  label: '합지(소폭)' },
  { key: '광폭합지',   label: '광폭합지' },
  { key: '실크(보급)', label: '실크+합지' },  // 실크 거실 + 합지 방 혼합 대표
  { key: '실크(중급)', label: '실크(중급)' },
] as const;

// 분양평수 → 전용평수 근사 (일반적인 아파트 기준)
const SUPPLY_MAP: Record<number, string> = {
  8:  '약 6평',
  13: '약 10평',
  18: '약 14평',
  24: '약 18평',
  30: '약 24평',
  32: '약 25평',
  34: '약 27평',
  38: '약 30평',
  42: '약 33평',
  48: '약 38평',
  55: '약 44평',
  60: '약 48평',
};

// 평형별·벽지별 표준 견적 계산
// 전체도배 / 표준천장 / 로스 10% / 마진 20% / VAT 별도
function calcCell(size: number, wpKey: string): number {
  const rate = RATES[wpKey];
  if (!rate) return 0;
  const dP = size * 3.3 * 1.1; // 전체도배 계수 3.3 × 로스 10%
  const cost = dP * (rate.mat + rate.lab + SUB_MAT);
  return Math.round(cost * 1.2 * 1.1 / 10000) * 10000; // 만원 단위 반올림
}

function wonMan(n: number): string {
  const man = Math.round(n / 10000);
  return `${man.toLocaleString('ko-KR')}만원`;
}

export default function StandardEstimateTable() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">
        평형별 표준 도배 견적표
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        전국 평균 시세 기준 (2026년) — 전체 도배 / 표준 천장 / 옵션 없음 / 마진 20% 적용
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm min-w-[560px] border-collapse">
          <thead>
            <tr className="bg-blue-600/20">
              <th className="px-4 py-3 text-left text-blue-200 font-semibold border-b border-slate-700">
                분양평수
              </th>
              <th className="px-4 py-3 text-left text-blue-200 font-semibold border-b border-slate-700">
                전용면적
              </th>
              {TABLE_TARGETS.map((t) => (
                <th
                  key={t.key}
                  className="px-4 py-3 text-right text-blue-200 font-semibold border-b border-slate-700"
                >
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUICK_SIZES.map((size, i) => (
              <tr
                key={size}
                className={
                  i % 2 === 0
                    ? 'bg-slate-800/40'
                    : 'bg-slate-800/20'
                }
              >
                <td className="px-4 py-2.5 font-semibold text-white border-b border-slate-700/50">
                  {size}평
                </td>
                <td className="px-4 py-2.5 text-slate-400 border-b border-slate-700/50">
                  {SUPPLY_MAP[size] ?? '-'}
                </td>
                {TABLE_TARGETS.map((t) => (
                  <td
                    key={t.key}
                    className="px-4 py-2.5 text-right tabular-nums text-slate-200 border-b border-slate-700/50"
                  >
                    {wonMan(calcCell(size, t.key))}~
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500 leading-relaxed">
        전체 도배 / 표준 천장(2.3~2.5m) / 추가 옵션 없음 기준입니다.
        발코니 확장, 부분 시공, 철거·몰딩·가구이동 등 추가 옵션은 위 견적 계산기에서 직접 입력해 보세요.
        실제 견적은 현장 실측 후 달라질 수 있으며, VAT(10%)는 별도입니다.
      </p>
    </div>
  );
}
