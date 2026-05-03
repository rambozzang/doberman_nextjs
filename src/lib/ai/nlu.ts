import type { QuoteSlots, BuildingType, Scope, WallpaperType, AdditionalRequest } from './types';

// regionData는 quote-request 페이지에서 사용하는 것과 동일 형식이며,
// NLU는 이 모듈에 자체 보유한 축약 매핑을 사용한다 (전체 지역은 page.tsx에서 import 가능).
const REGION_KEYWORDS: { id: string; keywords: string[] }[] = [
  { id: 'seoul', keywords: ['서울'] },
  { id: 'busan', keywords: ['부산'] },
  { id: 'daegu', keywords: ['대구'] },
  { id: 'incheon', keywords: ['인천'] },
  { id: 'gwangju', keywords: ['광주'] },
  { id: 'daejeon', keywords: ['대전'] },
  { id: 'ulsan', keywords: ['울산'] },
  { id: 'sejong', keywords: ['세종'] },
  { id: 'gyeonggi', keywords: ['경기', '수원', '성남', '용인', '고양', '부천', '안양', '평택', '화성', '의정부'] },
  { id: 'gangwon', keywords: ['강원', '춘천', '원주', '강릉'] },
  { id: 'chungbuk', keywords: ['충북', '청주', '충주'] },
  { id: 'chungnam', keywords: ['충남', '천안', '아산', '서산'] },
  { id: 'jeonbuk', keywords: ['전북', '전주', '익산', '군산'] },
  { id: 'jeonnam', keywords: ['전남', '목포', '여수', '순천'] },
  { id: 'gyeongbuk', keywords: ['경북', '포항', '경주', '구미'] },
  { id: 'gyeongnam', keywords: ['경남', '창원', '진주', '김해'] },
  { id: 'jeju', keywords: ['제주', '서귀포'] },
];

export function extractSlots(text: string, current: QuoteSlots): QuoteSlots {
  const next: QuoteSlots = { ...current };

  // 평수 추출: "30평", "30 평", "32.5평"
  const pyeongMatch = text.match(/(\d+(?:\.\d+)?)\s*평/);
  if (pyeongMatch) {
    next.area = { ...(next.area ?? {}), pyeong: parseFloat(pyeongMatch[1]) };
  }
  // 제곱미터: "100제곱", "100m²", "100 m2"
  const sqmMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:제곱|m\s*²|m2)/i);
  if (sqmMatch) {
    const sqm = parseFloat(sqmMatch[1]);
    next.area = { ...(next.area ?? {}), squareMeter: sqm, pyeong: next.area?.pyeong ?? Math.round(sqm / 3.3) };
  }

  // 방 개수: "방 2개", "방 3개", "방2"
  const roomCountMatch = text.match(/방\s*(\d+)\s*개?/);
  if (roomCountMatch) {
    next.roomCount = parseInt(roomCountMatch[1], 10);
  }

  // 건물 타입
  const buildingMap: { pattern: RegExp; value: BuildingType }[] = [
    { pattern: /아파트/, value: 'apartment' },
    { pattern: /빌라|연립/, value: 'villa' },
    { pattern: /오피스텔/, value: 'officetel' },
    { pattern: /단독\s*주택|전원\s*주택/, value: 'house' },
    { pattern: /사무실|오피스(?!텔)/, value: 'office' },
    { pattern: /상가|매장|카페/, value: 'commercial' },
  ];
  for (const { pattern, value } of buildingMap) {
    if (pattern.test(text)) { next.buildingType = value; break; }
  }

  // 시공 범위 (다중 가능)
  const scopeMap: { pattern: RegExp; value: Scope }[] = [
    { pattern: /거실/, value: 'living-room' },
    // "주방"과 겹치지 않도록 음수 전방탐색
    { pattern: /(?<!주)방/, value: 'room' },
    { pattern: /주방|부엌/, value: 'kitchen' },
    { pattern: /화장실|욕실/, value: 'bathroom' },
    { pattern: /전체|전부|싹\s*다|올\s*도배/, value: 'all-rooms' },
  ];
  const detectedScopes: Scope[] = [];
  for (const { pattern, value } of scopeMap) {
    if (pattern.test(text)) detectedScopes.push(value);
  }
  if (detectedScopes.length > 0) {
    // 'all-rooms'가 포함되면 단독 사용
    next.scope = detectedScopes.includes('all-rooms') ? ['all-rooms'] : detectedScopes;
  }

  // 벽지 타입
  const wallpaperMap: { pattern: RegExp; value: WallpaperType }[] = [
    { pattern: /실크\s*\+\s*합지|실크합지/, value: 'silk-vinyl' },
    { pattern: /실크/, value: 'fabric' },
    { pattern: /합지/, value: 'vinyl' },
    { pattern: /천연/, value: 'natural' },
    { pattern: /수입|프리미엄/, value: 'premium' },
  ];
  for (const { pattern, value } of wallpaperMap) {
    if (pattern.test(text)) { next.wallpaperType = value; break; }
  }

  // 추가 요청
  const addMap: { pattern: RegExp; value: AdditionalRequest }[] = [
    { pattern: /가구\s*이동|가구\s*옮기/, value: 'furniture-move' },
    { pattern: /기존\s*벽지\s*제거|철거/, value: 'old-removal' },
    { pattern: /벽면\s*보수|보수\s*공사/, value: 'wall-repair' },
    { pattern: /당일\s*시공|급해|급하/, value: 'quick-service' },
  ];
  const detectedAdditional: AdditionalRequest[] = [];
  for (const { pattern, value } of addMap) {
    if (pattern.test(text)) detectedAdditional.push(value);
  }
  if (detectedAdditional.length > 0) {
    next.additionalRequest = Array.from(new Set([...(next.additionalRequest ?? []), ...detectedAdditional]));
  }

  // 지역
  for (const entry of REGION_KEYWORDS) {
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        next.region = entry.id;
        break;
      }
    }
    if (next.region) break;
  }

  // 방문 일자: "내일", "모레", "이번 주말"
  if (/내일/.test(text)) next.visitDate = '내일';
  else if (/모레|모래/.test(text)) next.visitDate = '모레';
  else if (/이번\s*주말/.test(text)) next.visitDate = '이번 주말';
  else if (/다음\s*주/.test(text)) next.visitDate = '다음 주';
  const dateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (dateMatch) next.visitDate = `${dateMatch[1]}월 ${dateMatch[2]}일`;

  return next;
}

/**
 * 다음 우선순위로 미충족 슬롯을 반환. 모두 충족이면 null.
 */
export function nextMissingSlot(slots: QuoteSlots): keyof QuoteSlots | null {
  if (!slots.buildingType) return 'buildingType';
  if (!slots.area?.pyeong && !slots.area?.squareMeter) return 'area';
  if (!slots.scope || slots.scope.length === 0) return 'scope';
  if (!slots.wallpaperType) return 'wallpaperType';
  if (!slots.region) return 'region';
  if (slots.additionalRequest === undefined) return 'additionalRequest';
  if (!slots.visitDate) return 'visitDate';
  return null;
}

/**
 * 매칭 신뢰도 계산 (0~100). 슬롯 가중치 기반.
 */
export function computeConfidence(slots: QuoteSlots): number {
  const weights: Record<keyof QuoteSlots, number> = {
    buildingType: 15,
    area: 25,
    scope: 15,
    wallpaperType: 20,
    region: 10,
    additionalRequest: 5,
    visitDate: 5,
    roomCount: 0,
    district: 5,
  };
  let score = 0;
  if (slots.buildingType) score += weights.buildingType;
  if (slots.area?.pyeong || slots.area?.squareMeter) score += weights.area;
  if (slots.scope && slots.scope.length > 0) score += weights.scope;
  if (slots.wallpaperType) score += weights.wallpaperType;
  if (slots.region) score += weights.region;
  if (slots.additionalRequest !== undefined) score += weights.additionalRequest;
  if (slots.visitDate) score += weights.visitDate;
  if (slots.district) score += weights.district;
  return Math.min(100, score);
}
