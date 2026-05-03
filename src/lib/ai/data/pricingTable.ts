import type { WallpaperType, AdditionalRequest } from '../types';

/**
 * 분양평수 기준 전체 시공 견적표 (실제 도배 업체 견적표 기준)
 * 출처: 사용자 제공 실제 견적표 + 15개 시장 리서치 평균 검증
 * - vinylNarrow: 합지(소폭) — 보편적 합지
 * - vinylWide: 합지(광폭) — 폭이 넓은 합지(작업 효율 ↑, 약간 비쌈)
 * - silkVinyl: 실크+합지 혼합 시공
 * - silk: 전체 실크 시공
 *
 * 천연/수입은 별도 배율로 환산 (silk × 1.4 / 1.8)
 */
export interface EstimateRow {
  pyeong: number;          // 분양평수
  exclusivePyeong: number; // 전용면적 참고용
  vinylNarrow: number;
  vinylWide: number;
  silkVinyl: number;
  silk: number;
}

export const ESTIMATE_TABLE: EstimateRow[] = [
  { pyeong: 19, exclusivePyeong: 15, vinylNarrow: 620000,  vinylWide: 690000,  silkVinyl: 950000,  silk: 1120000 },
  { pyeong: 22, exclusivePyeong: 16, vinylNarrow: 660000,  vinylWide: 750000,  silkVinyl: 1110000, silk: 1420000 },
  { pyeong: 24, exclusivePyeong: 18, vinylNarrow: 700000,  vinylWide: 790000,  silkVinyl: 1140000, silk: 1480000 },
  { pyeong: 27, exclusivePyeong: 21, vinylNarrow: 980000,  vinylWide: 1050000, silkVinyl: 1330000, silk: 1600000 },
  { pyeong: 30, exclusivePyeong: 23, vinylNarrow: 990000,  vinylWide: 1060000, silkVinyl: 1470000, silk: 1850000 },
  { pyeong: 32, exclusivePyeong: 24, vinylNarrow: 1000000, vinylWide: 1090000, silkVinyl: 1500000, silk: 1870000 },
  { pyeong: 34, exclusivePyeong: 26, vinylNarrow: 1020000, vinylWide: 1110000, silkVinyl: 1530000, silk: 1930000 },
  { pyeong: 37, exclusivePyeong: 28, vinylNarrow: 1300000, vinylWide: 1390000, silkVinyl: 1850000, silk: 2300000 },
  { pyeong: 40, exclusivePyeong: 31, vinylNarrow: 1320000, vinylWide: 1420000, silkVinyl: 1880000, silk: 2350000 },
  { pyeong: 43, exclusivePyeong: 33, vinylNarrow: 1350000, vinylWide: 1460000, silkVinyl: 1900000, silk: 2370000 },
  { pyeong: 45, exclusivePyeong: 35, vinylNarrow: 1380000, vinylWide: 1490000, silkVinyl: 1920000, silk: 2650000 },
  { pyeong: 47, exclusivePyeong: 39, vinylNarrow: 1400000, vinylWide: 1520000, silkVinyl: 1960000, silk: 2720000 },
  { pyeong: 50, exclusivePyeong: 41, vinylNarrow: 1600000, vinylWide: 1780000, silkVinyl: 2350000, silk: 2880000 },
  { pyeong: 54, exclusivePyeong: 43, vinylNarrow: 1640000, vinylWide: 1800000, silkVinyl: 2380000, silk: 3030000 },
];

// 천연벽지: 실크 대비 1.4배 (시장가 105~210% 범위 중간값)
export const NATURAL_MULTIPLIER = 1.4;
// 수입/프리미엄벽지: 실크 대비 1.8배
export const PREMIUM_MULTIPLIER = 1.8;

// 평당 단가 참고 (테이블에 없는 값 보정 / 표시용 — 실제 계산은 견적표 lookup 사용)
export const PRICE_PER_PYEONG: Record<WallpaperType, number> = {
  vinyl: 45000,         // 합지 (시장가 25,000~65,000, 중앙값 45,000 — 출처: 24jim 38,750원/평, 당근비즈 17,000원, 용진인테리어 51,700원)
  'silk-vinyl': 62000,  // 실크+합지 혼합 (합지 대비 약 1.38배 — 출처: mindtrip 혼합도배 실사례)
  fabric: 80000,        // 실크 (시장가 55,000~120,000, 동네업체 중앙값 — 출처: 24jim 65,000원, 용진인테리어 82,000원, mindtrip 70~86,000원)
  natural: 120000,      // 천연/한지/규조토 (시장가 100,000~200,000 — 출처: kkumigo 친환경 125,000원+, 전문가 실크 대비 1.4~1.8배)
  premium: 200000,      // 수입/프리미엄 (시장가 150,000~350,000 — 출처: 전문가 공통 실크 대비 1.5~3배)
};

// 출장비 + 기본 부자재 (기본 교통비·소모품 등)
// 출처: 정원과도배 출장비 170,000원, 방한칸 기본 부자재 15,000원 기준 합산
export const BASE_FEE = 100000;

// 평당 추가 부자재비 (퍼티, 풀, 코너 처리 등)
// 출처: 용진인테리어 원가 분석에서 부재료 = 주재료의 약 25~30%
export const PER_PYEONG_EXTRA = 5000;

export const ADDITIONAL_FEE: Record<AdditionalRequest, number> = {
  'furniture-move': 60000,   // 가구 이동 (출처: mindtrip 거주 중 시공 30~40만원 추가 / 소규모 기준 60,000원)
  'old-removal': 50000,      // 기존 벽지 제거 (출처: biocwg 방한칸 15,000원 × 3방 기준, 전체 30평 30~60만원)
  'wall-repair': 100000,     // 벽면 보수·퍼티 (출처: butterflyinvest 최소 330,000원, 기본 옵션 100,000원)
  'quick-service': 120000,   // 당일/긴급 시공 할증 (출처: butterflyinvest 이사당일 30~50만원, 야간 50~70만원 — 기본 할증 120,000원)
};

export const REGION_FACTOR: Record<string, number> = {
  // 출처: 클리앙 실사례(강원 ≈ 서울), mindtrip 서울 기준, 전문가 공통(서울 인건비 지방 대비 10~15% 높음)
  seoul: 1.10,
  gyeonggi: 1.05,
  incheon: 1.05,
  busan: 1.00,
  daegu: 0.97,
  daejeon: 0.97,
  gwangju: 0.96,
  ulsan: 0.97,
  sejong: 1.00,
  gangwon: 0.98,   // 실사례상 서울과 유사 (클리앙 강원 사례)
  chungbuk: 0.95,
  chungnam: 0.96,
  jeonbuk: 0.95,
  jeonnam: 0.95,
  gyeongbuk: 0.95,
  gyeongnam: 0.96,
  jeju: 1.08,      // 도서지역 자재 운송비 반영
};

export const WALLPAPER_LABEL: Record<WallpaperType, string> = {
  vinyl: '합지벽지',
  'silk-vinyl': '실크+합지',
  fabric: '실크벽지',
  natural: '천연벽지',
  premium: '수입벽지',
};

export const BUILDING_LABEL: Record<string, string> = {
  apartment: '아파트',
  villa: '빌라',
  officetel: '오피스텔',
  house: '단독주택',
  office: '사무실',
  commercial: '상가',
  other: '기타',
};

export const SCOPE_LABEL: Record<string, string> = {
  'living-room': '거실',
  room: '방',
  kitchen: '주방',
  bathroom: '화장실',
  'all-rooms': '전체',
};

export const ADDITIONAL_LABEL: Record<AdditionalRequest, string> = {
  'furniture-move': '가구 이동',
  'old-removal': '기존 벽지 제거',
  'wall-repair': '벽면 보수',
  'quick-service': '당일 시공',
};
