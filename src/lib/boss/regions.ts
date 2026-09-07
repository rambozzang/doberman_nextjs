// 견적 수신 지역 — 앱 `lib/utils/utils.dart` · 백엔드 `common/region/RegionSupport.kt` 와 같은 규칙
//
//   · 사장님(TB_COMPANY.REGION)은 견적을 받고 싶은 시/도를 콤마로 최대 3개까지 저장한다.
//       예) "서울특별시,경기도,인천광역시"
//   · "전국"은 모든 지역을 뜻하므로 다른 지역과 함께 고를 수 없다.
//   · 고객 요청(웹견적)의 지역은 "서울특별시 강남구" 형태다. 시/도만 떼어 비교한다.

export const NATIONWIDE_REGION = '전국';
export const MAX_RECEIVE_REGIONS = 3;

/** 맨 앞 "전국"은 전체 수신을 뜻한다 (앱 Utils.regions 와 같은 순서) */
export const REGIONS: string[] = [
  NATIONWIDE_REGION,
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청남도',
  '충청북도',
  '전라남도',
  '전라북도',
  '경상남도',
  '경상북도',
  '제주도',
];

/** "서울특별시,경기도" → ["서울특별시", "경기도"] */
export function parseRegions(value?: string | null): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    )
  );
}

/** 저장 전 정규화 — "전국"이 있으면 전국 단독, 최대 3개까지 */
export function normalizeRegions(regions: string[]): string {
  if (regions.includes(NATIONWIDE_REGION)) return NATIONWIDE_REGION;
  return regions.slice(0, MAX_RECEIVE_REGIONS).join(',');
}

/** 화면 표기 — "서울특별시 · 경기도" */
export function formatRegions(value?: string | null): string {
  const list = parseRegions(value);
  if (list.length === 0) return '';
  return list.join(' · ');
}

/** "서울특별시 강남구" → "서울특별시" */
export function extractSido(region?: string | null): string {
  return (region ?? '').trim().split(' ')[0] ?? '';
}

export function isNationwide(value?: string | null): boolean {
  return parseRegions(value).includes(NATIONWIDE_REGION);
}

/** 이 요청이 내 수신 지역에 들어오는가 (전국이면 전부 통과) */
export function matchesMyRegions(requestRegion: string | null | undefined, myRegions: string): boolean {
  const mine = parseRegions(myRegions);
  if (mine.length === 0) return true; // 아직 설정 전이면 거르지 않는다
  if (mine.includes(NATIONWIDE_REGION)) return true;
  const sido = extractSido(requestRegion);
  if (!sido) return false;
  // 고객 요청이 "전국"으로 들어온 경우도 모두에게 보인다
  if (sido === NATIONWIDE_REGION) return true;
  return mine.includes(sido);
}
