import type { QuoteSlots, PriceEstimate, PackageOption } from './types';
import { PRICE_PER_PYEONG, ADDITIONAL_FEE, REGION_FACTOR } from './data/pricingTable';
import { pickSimilarCases } from './data/similarCases';
import { computeConfidence } from './nlu';

export function calculatePrice(slots: QuoteSlots): PriceEstimate {
  const pyeong = slots.area?.pyeong ?? (slots.area?.squareMeter ? Math.round(slots.area.squareMeter / 3.3) : 20);
  const wallpaper = slots.wallpaperType ?? 'vinyl';
  const base = pyeong * PRICE_PER_PYEONG[wallpaper];

  const additionalFee = (slots.additionalRequest ?? [])
    .reduce((sum, req) => sum + (ADDITIONAL_FEE[req] ?? 0), 0);

  const regionFactor = slots.region ? (REGION_FACTOR[slots.region] ?? 1.0) : 1.0;
  const center = (base + additionalFee) * regionFactor;

  return {
    min: Math.round(center * 0.85),
    max: Math.round(center * 1.15),
    matchConfidence: computeConfidence(slots),
    packages: buildPackages(slots, center, pyeong),
    similarCases: pickSimilarCases({ pyeong, wallpaperType: wallpaper, buildingType: slots.buildingType }),
  };
}

function buildPackages(slots: QuoteSlots, center: number, pyeong: number): PackageOption[] {
  const budget: PackageOption = {
    id: 'budget',
    name: '가성비',
    price: Math.round(pyeong * PRICE_PER_PYEONG.vinyl * 0.95),
    features: ['합지벽지', '기본 시공', '1주일 내 완료'],
  };
  const standard: PackageOption = {
    id: 'standard',
    name: '표준',
    price: Math.round(center),
    features: [
      slots.wallpaperType === 'fabric' || slots.wallpaperType === 'natural' ? '실크/천연벽지' : '실크+합지',
      '꼼꼼한 시공',
      '하자 보증 1년',
    ],
    highlight: true,
  };
  const premium: PackageOption = {
    id: 'premium',
    name: '프리미엄',
    price: Math.round(pyeong * PRICE_PER_PYEONG.premium * 1.05 + ADDITIONAL_FEE['furniture-move']),
    features: ['수입/프리미엄 벽지', '가구 이동 포함', '하자 보증 2년'],
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
