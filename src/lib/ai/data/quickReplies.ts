import type { QuickReply } from '../types';

export const BUILDING_TYPE_REPLIES: QuickReply[] = [
  { label: '아파트', value: 'apartment', field: 'buildingType', icon: '🏢' },
  { label: '빌라', value: 'villa', field: 'buildingType', icon: '🏘️' },
  { label: '오피스텔', value: 'officetel', field: 'buildingType', icon: '🏬' },
  { label: '단독주택', value: 'house', field: 'buildingType', icon: '🏠' },
  { label: '사무실', value: 'office', field: 'buildingType', icon: '🏢' },
  { label: '상가', value: 'commercial', field: 'buildingType', icon: '🏪' },
];

export const AREA_REPLIES: QuickReply[] = [
  { label: '10평대', value: '15', field: 'area' },
  { label: '20평대', value: '25', field: 'area' },
  { label: '30평대', value: '33', field: 'area' },
  { label: '40평대', value: '43', field: 'area' },
  { label: '50평 이상', value: '55', field: 'area' },
];

export const SCOPE_REPLIES: QuickReply[] = [
  { label: '거실', value: 'living-room', field: 'scope', icon: '🛋️', multi: true },
  { label: '방', value: 'room', field: 'scope', icon: '🛏️', multi: true },
  { label: '주방', value: 'kitchen', field: 'scope', icon: '🍳', multi: true },
  { label: '화장실', value: 'bathroom', field: 'scope', icon: '🚿', multi: true },
  { label: '전체', value: 'all-rooms', field: 'scope', icon: '🏠', multi: false },
];

export const WALLPAPER_REPLIES: QuickReply[] = [
  { label: '합지벽지', value: 'vinyl', field: 'wallpaperType', icon: '📋' },
  { label: '실크+합지', value: 'silk-vinyl', field: 'wallpaperType', icon: '🎨' },
  { label: '실크벽지', value: 'fabric', field: 'wallpaperType', icon: '🧵' },
  { label: '천연벽지', value: 'natural', field: 'wallpaperType', icon: '🌿' },
  { label: '수입벽지', value: 'premium', field: 'wallpaperType', icon: '✨' },
];

export const ADDITIONAL_REPLIES: QuickReply[] = [
  { label: '가구 이동', value: 'furniture-move', field: 'additionalRequest', icon: '📦', multi: true },
  { label: '기존 벽지 제거', value: 'old-removal', field: 'additionalRequest', icon: '🗑️', multi: true },
  { label: '벽면 보수', value: 'wall-repair', field: 'additionalRequest', icon: '🔨', multi: true },
  { label: '당일 시공', value: 'quick-service', field: 'additionalRequest', icon: '⚡', multi: true },
  { label: '없음 (다음 단계)', value: '__skip__', field: 'additionalRequest' },
];

export const POPULAR_REGION_REPLIES: QuickReply[] = [
  { label: '서울', value: 'seoul', field: 'region', icon: '🏙️' },
  { label: '경기', value: 'gyeonggi', field: 'region', icon: '🏘️' },
  { label: '인천', value: 'incheon', field: 'region', icon: '✈️' },
  { label: '부산', value: 'busan', field: 'region', icon: '🌊' },
];

export const VISIT_DATE_REPLIES: QuickReply[] = [
  { label: '이번 주말', value: 'this-weekend', field: 'visitDate' },
  { label: '다음 주', value: 'next-week', field: 'visitDate' },
  { label: '이번 달 안', value: 'this-month', field: 'visitDate' },
  { label: '시간 여유 있음', value: 'flexible', field: 'visitDate' },
  { label: '건너뛰기', value: '__skip__', field: 'visitDate' },
];
