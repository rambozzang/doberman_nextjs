import type { QuoteSlots } from './types';
import type { CreateCustomerRequestRequest, UserInfo } from '@/types/api';
import { BUILDING_LABEL, SCOPE_LABEL, WALLPAPER_LABEL, ADDITIONAL_LABEL } from './data/pricingTable';
import { getRegionName, getDistrictName } from './data/regions';

export interface AIMeta {
  matchConfidence: number;
  selectedPackage?: 'budget' | 'standard' | 'premium';
  hasImageAnalysis?: boolean;
}

const PACKAGE_LABEL: Record<'budget' | 'standard' | 'premium', string> = {
  budget: '가성비',
  standard: '표준',
  premium: '프리미엄',
};

const VISIT_DATE_LABEL: Record<string, string> = {
  'this-weekend': '이번 주말',
  'next-week': '다음 주',
  'this-month': '이번 달 안',
  'flexible': '일정 협의 가능',
};


function buildScopeLabel(slots: QuoteSlots): string {
  const list = (slots.scope ?? []).map((s) => {
    if (s === 'room' && slots.roomCount) return `[${SCOPE_LABEL[s]} ${slots.roomCount}개]`;
    return `[${SCOPE_LABEL[s]}]`;
  });
  return list.join(', ');
}

function buildAdditionalLabel(slots: QuoteSlots): string {
  return (slots.additionalRequest ?? []).map((r) => ADDITIONAL_LABEL[r]).join(', ');
}

function buildAIMetaString(meta: AIMeta): string {
  const parts = [`AI매칭률:${meta.matchConfidence}%`];
  if (meta.selectedPackage) parts.push(`패키지:${PACKAGE_LABEL[meta.selectedPackage]}`);
  if (meta.hasImageAnalysis) parts.push('이미지분석:있음');
  return parts.join('|');
}

export function slotsToCustomerRequest(
  slots: QuoteSlots,
  user: UserInfo,
  meta: AIMeta
): CreateCustomerRequestRequest {
  const buildingLabel = slots.buildingType ? `[${BUILDING_LABEL[slots.buildingType]}]` : '';
  const regionFullName = slots.region
    ? (slots.district
        ? `${getRegionName(slots.region)} ${getDistrictName(slots.region, slots.district)}`
        : getRegionName(slots.region))
    : '';

  return {
    webCustomerId: user.customerId,
    buildingType: buildingLabel,
    constructionLocation: buildScopeLabel(slots),
    roomCount: slots.roomCount ?? 0,
    area: slots.area?.pyeong ?? 0,
    areaSize: slots.area?.squareMeter ?? 0,
    wallpaper: slots.wallpaperType ? `[${WALLPAPER_LABEL[slots.wallpaperType]}]` : '',
    ceiling: '전체',
    specialInfo: buildAdditionalLabel(slots),
    specialInfoDetail: '',
    hasItems: (slots.additionalRequest ?? []).includes('furniture-move') ? '짐이 있음' : '',
    preferredDate: slots.visitDate ? (VISIT_DATE_LABEL[slots.visitDate] ?? slots.visitDate) : '',
    preferredDateDetail: slots.visitDate ? '원하는 날짜가 있어요' : '',
    region: regionFullName,
    customerName: user.customerName,
    customerPhone: user.customerPhone,
    customerEmail: user.customerEmail,
    customerPassword: user.customerPassword,
    agreeTerms: true,
    requestDate: new Date().toISOString(),
    status: '검토중',
    etc1: buildAIMetaString(meta),
    etc2: '',
    etc3: '',
  };
}
