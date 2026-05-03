import type { QuoteSlots, PriceEstimate, PackageOption, WallpaperType } from './types';
import { PRICE_PER_PYEONG, ADDITIONAL_FEE, REGION_FACTOR, BASE_FEE, PER_PYEONG_EXTRA } from './data/pricingTable';
import { pickSimilarCases } from './data/similarCases';
import { computeConfidence } from './nlu';

/**
 * 시공 범위(scope)에 따른 실효 면적(평) 계산.
 * 한국 일반 아파트 비율 + 도배는 벽 + 천장이라 평형 대비 다소 큰 면적이 됨:
 *  - 거실: 전체의 약 40% (벽+천장 환산)
 *  - 방 1개: 약 20% (보통 5~8평, 30평 아파트 기준)
 *  - 주방: 약 15%
 *  - 화장실: 약 8%
 *  - 전체(all-rooms): 100%
 */
function calcEffectivePyeong(slots: QuoteSlots): number {
  const totalPyeong = slots.area?.pyeong
    ?? (slots.area?.squareMeter ? slots.area.squareMeter / 3.3 : 25);
  const scopes = slots.scope ?? [];

  if (scopes.length === 0) return totalPyeong * 0.6;
  if (scopes.includes('all-rooms')) return totalPyeong;

  let factor = 0;
  if (scopes.includes('living-room')) factor += 0.40;
  if (scopes.includes('room')) {
    const roomCount = slots.roomCount ?? 1;
    factor += Math.min(roomCount * 0.20, 0.7);
  }
  if (scopes.includes('kitchen')) factor += 0.15;
  if (scopes.includes('bathroom')) factor += 0.08;

  // 최소 시공은 30%, 최대 100%
  factor = Math.min(Math.max(factor, 0.30), 1.0);
  return totalPyeong * factor;
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
 * 평당 단가 + 출장비 + 평당 부자재로 합산한 기본 가격.
 * 매우 작은 면적이라도 최소 시공비가 보장됨.
 */
function basePrice(effectivePyeong: number, wallpaper: WallpaperType, regionFactor: number): number {
  const construction = effectivePyeong * PRICE_PER_PYEONG[wallpaper];
  const extras = effectivePyeong * PER_PYEONG_EXTRA;
  return (construction + extras + BASE_FEE) * regionFactor;
}

const MIN_QUOTE = 350000; // 최소 견적 보장 (출장만 와도 35만원)

export function calculatePrice(slots: QuoteSlots): PriceEstimate {
  const effectivePyeong = calcEffectivePyeong(slots);
  const totalPyeong = slots.area?.pyeong
    ?? (slots.area?.squareMeter ? slots.area.squareMeter / 3.3 : 25);
  const wallpaper = slots.wallpaperType ?? 'vinyl';
  const regionFactor = slots.region ? (REGION_FACTOR[slots.region] ?? 1.0) : 1.0;

  const additionalFee = (slots.additionalRequest ?? [])
    .reduce((sum, req) => sum + (ADDITIONAL_FEE[req] ?? 0), 0);

  const center = Math.max(basePrice(effectivePyeong, wallpaper, regionFactor) + additionalFee, MIN_QUOTE);

  return {
    min: Math.round(center * 0.90),
    max: Math.round(center * 1.12),
    matchConfidence: computeConfidence(slots),
    packages: buildPackages(slots, effectivePyeong, regionFactor, additionalFee, center),
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
  effectivePyeong: number,
  regionFactor: number,
  additionalFee: number,
  centerPrice: number,
): PackageOption[] {
  const userWallpaper = slots.wallpaperType ?? 'vinyl';
  const budgetWallpaper = downgradeWallpaper(userWallpaper);
  const premiumWallpaper = upgradeWallpaper(userWallpaper);

  const budgetCalc = basePrice(effectivePyeong, budgetWallpaper, regionFactor) + additionalFee * 0.5;
  const premiumCalc =
    basePrice(effectivePyeong, premiumWallpaper, regionFactor)
    + additionalFee
    + ADDITIONAL_FEE['furniture-move']
    + effectivePyeong * 8000; // 프리미엄 보증/마감 강화

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
