import type { QuoteSlots, PriceEstimate, PackageOption, WallpaperType } from './types';
import {
  ADDITIONAL_FEE, REGION_FACTOR,
  ESTIMATE_TABLE, NATURAL_MULTIPLIER, PREMIUM_MULTIPLIER,
  type EstimateRow,
} from './data/pricingTable';
import { pickSimilarCases } from './data/similarCases';
import { computeConfidence } from './nlu';

/**
 * 분양평수 기준 견적표에서 전체 시공 가격 lookup (선형 보간).
 * 테이블 범위 밖이면 가까운 끝 행 + 선형 외삽.
 */
function lookupTotalQuote(pyeong: number, wallpaper: WallpaperType): number {
  // wallpaper → 견적표 컬럼 매핑
  const getColumn = (row: EstimateRow): number => {
    switch (wallpaper) {
      case 'vinyl': return row.vinylWide;        // 광폭 합지를 표준으로
      case 'silk-vinyl': return row.silkVinyl;
      case 'fabric': return row.silk;
      case 'natural': return Math.round(row.silk * NATURAL_MULTIPLIER);
      case 'premium': return Math.round(row.silk * PREMIUM_MULTIPLIER);
    }
  };

  const table = ESTIMATE_TABLE;
  const first = table[0];
  const last = table[table.length - 1];

  // 범위 밖 (작은 평수)
  if (pyeong <= first.pyeong) {
    return getColumn(first);
  }
  // 범위 밖 (큰 평수): 마지막 두 행 기울기로 외삽
  if (pyeong >= last.pyeong) {
    const prev = table[table.length - 2];
    const slope = (getColumn(last) - getColumn(prev)) / (last.pyeong - prev.pyeong);
    return Math.round(getColumn(last) + slope * (pyeong - last.pyeong));
  }
  // 사이 구간: 선형 보간
  for (let i = 0; i < table.length - 1; i += 1) {
    const lo = table[i];
    const hi = table[i + 1];
    if (pyeong >= lo.pyeong && pyeong <= hi.pyeong) {
      const t = (pyeong - lo.pyeong) / (hi.pyeong - lo.pyeong);
      return Math.round(getColumn(lo) + t * (getColumn(hi) - getColumn(lo)));
    }
  }
  return getColumn(last);
}

/**
 * 시공 범위(scope)에 따른 부분 시공 비율 (전체 시공 가격 대비).
 * 출장비/기본비를 일부 보존하기 위해 최소 0.18 보장.
 */
function calcScopeRatio(slots: QuoteSlots): number {
  const scopes = slots.scope ?? [];
  if (scopes.length === 0) return 0.55;
  if (scopes.includes('all-rooms')) return 1.0;

  let ratio = 0;
  if (scopes.includes('living-room')) ratio += 0.32;
  if (scopes.includes('room')) {
    const roomCount = slots.roomCount ?? 1;
    ratio += Math.min(roomCount * 0.16, 0.7);
  }
  if (scopes.includes('kitchen')) ratio += 0.10;
  if (scopes.includes('bathroom')) ratio += 0.06;

  // 부분이라도 출장비 비중 보존: ratio × 0.85 + 0.15 (출장비 15% 보장)
  const adjusted = Math.min(Math.max(ratio, 0.18), 1.0) * 0.85 + 0.15;
  return Math.min(adjusted, 1.0);
}

const WALLPAPER_ORDER: WallpaperType[] = ['vinyl', 'silk-vinyl', 'fabric', 'natural', 'premium'];

function downgradeWallpaper(w: WallpaperType): WallpaperType {
  const idx = WALLPAPER_ORDER.indexOf(w);
  return idx > 0 ? WALLPAPER_ORDER[idx - 1] : w;
}

function upgradeWallpaper(w: WallpaperType): WallpaperType {
  const idx = WALLPAPER_ORDER.indexOf(w);
  return idx >= 0 && idx < WALLPAPER_ORDER.length - 1 ? WALLPAPER_ORDER[idx + 1] : w;
}

const WALLPAPER_DISPLAY: Record<WallpaperType, string> = {
  vinyl: '합지벽지',
  'silk-vinyl': '실크+합지',
  fabric: '실크벽지',
  natural: '천연벽지',
  premium: '수입/프리미엄 벽지',
};

/**
 * 견적표 lookup + scope 비율 + 지역 보정 = 표준 견적
 */
function basePrice(totalPyeong: number, wallpaper: WallpaperType, scopeRatio: number, regionFactor: number): number {
  const fullQuote = lookupTotalQuote(totalPyeong, wallpaper);
  return fullQuote * scopeRatio * regionFactor;
}

const MIN_QUOTE = 400000; // 최소 견적 보장 (방 1칸 부분도배 + 출장기본비)

export function calculatePrice(slots: QuoteSlots): PriceEstimate {
  const totalPyeong = slots.area?.pyeong
    ?? (slots.area?.squareMeter ? slots.area.squareMeter / 3.3 : 25);
  const wallpaper = slots.wallpaperType ?? 'vinyl';
  const regionFactor = slots.region ? (REGION_FACTOR[slots.region] ?? 1.0) : 1.0;
  const scopeRatio = calcScopeRatio(slots);

  // 기존 벽지가 실크/발포면 제거비 면제 (사용자 제공 견적표 룰)
  const additionalFee = (slots.additionalRequest ?? []).reduce((sum, req) => {
    if (req === 'old-removal' && (wallpaper === 'fabric' || wallpaper === 'silk-vinyl')) {
      return sum; // 면제
    }
    return sum + (ADDITIONAL_FEE[req] ?? 0);
  }, 0);

  const center = Math.max(basePrice(totalPyeong, wallpaper, scopeRatio, regionFactor) + additionalFee, MIN_QUOTE);

  return {
    min: Math.round(center * 0.92),
    max: Math.round(center * 1.10),
    matchConfidence: computeConfidence(slots),
    packages: buildPackages(slots, totalPyeong, scopeRatio, regionFactor, additionalFee, center),
    similarCases: pickSimilarCases({
      pyeong: Math.round(totalPyeong),
      wallpaperType: wallpaper,
      buildingType: slots.buildingType,
    }),
  };
}

/**
 * 패키지 3종 산출.
 * - 가성비: 사용자 선택 한 단계 아래 (이미 가성비면 그대로) — 표준 대비 약 0.75배
 * - 표준: 사용자 선택 그대로 (강조)
 * - 프리미엄: 한 단계 위 + 가구 이동 + 보증 강화 — 표준 대비 약 1.35배
 *
 * 차이 폭은 보통 0.75 ~ 1.35 사이로 패키지간 거리감을 줄여 현실적인 비교가 가능하도록 함.
 */
function buildPackages(
  slots: QuoteSlots,
  totalPyeong: number,
  scopeRatio: number,
  regionFactor: number,
  additionalFee: number,
  centerPrice: number,
): PackageOption[] {
  const userWallpaper = slots.wallpaperType ?? 'vinyl';
  const budgetWallpaper = downgradeWallpaper(userWallpaper);
  const premiumWallpaper = upgradeWallpaper(userWallpaper);

  const budgetCalc = basePrice(totalPyeong, budgetWallpaper, scopeRatio, regionFactor) + additionalFee * 0.5;
  const premiumCalc =
    basePrice(totalPyeong, premiumWallpaper, scopeRatio, regionFactor)
    + additionalFee
    + ADDITIONAL_FEE['furniture-move']
    + Math.round(totalPyeong * scopeRatio * 8000); // 프리미엄 보증/마감 강화

  const budget: PackageOption = {
    id: 'budget',
    name: '가성비',
    price: Math.round(Math.max(budgetCalc, MIN_QUOTE)),
    features: [
      WALLPAPER_DISPLAY[budgetWallpaper],
      '기본 시공',
      '하자 보증 6개월',
    ],
  };
  const standard: PackageOption = {
    id: 'standard',
    name: '표준',
    price: Math.round(centerPrice),
    features: [
      WALLPAPER_DISPLAY[userWallpaper],
      '꼼꼼한 시공',
      '하자 보증 1년',
    ],
    highlight: true,
  };
  const premium: PackageOption = {
    id: 'premium',
    name: '프리미엄',
    price: Math.round(Math.max(premiumCalc, centerPrice * 1.25)),
    features: [
      WALLPAPER_DISPLAY[premiumWallpaper],
      '가구 이동 포함',
      '하자 보증 2년 + 친환경 자재',
    ],
  };
  return [budget, standard, premium];
}

/**
 * 가격을 "1,234,000원" 형식으로 포매팅
 */
export function formatPrice(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

/**
 * 가격을 "143만원" 형식으로 짧게 표시
 */
export function formatPriceShort(value: number): string {
  if (value >= 10000) {
    const man = Math.round(value / 10000);
    return `${man.toLocaleString('ko-KR')}만원`;
  }
  return value.toLocaleString('ko-KR') + '원';
}
