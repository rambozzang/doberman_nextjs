import type { WallpaperType, AdditionalRequest } from '../types';

// 평당 시공비 (자재비 + 인건비 포함, 한국 도배 시장가 평균~상향 기준)
export const PRICE_PER_PYEONG: Record<WallpaperType, number> = {
  vinyl: 50000,         // 합지 (시장가 35,000~60,000)
  'silk-vinyl': 70000,  // 실크+합지 혼합
  fabric: 90000,        // 실크 (시장가 60,000~100,000)
  natural: 130000,      // 천연 (시장가 100,000~150,000)
  premium: 200000,      // 수입/프리미엄 (시장가 150,000~250,000)
};

// 출장비 + 기본 부자재 (퍼티, 풀, 마감재 등)
export const BASE_FEE = 120000;

// 평당 추가 비용 (천장 보정, 코너 처리, 부자재 등)
export const PER_PYEONG_EXTRA = 5000;

export const ADDITIONAL_FEE: Record<AdditionalRequest, number> = {
  'furniture-move': 50000,
  'old-removal': 30000,
  'wall-repair': 80000,
  'quick-service': 100000,
};

export const REGION_FACTOR: Record<string, number> = {
  seoul: 1.10,
  gyeonggi: 1.05,
  incheon: 1.05,
  busan: 1.00,
  daegu: 0.98,
  daejeon: 0.98,
  gwangju: 0.97,
  ulsan: 0.97,
  sejong: 1.02,
  gangwon: 0.95,
  chungbuk: 0.95,
  chungnam: 0.96,
  jeonbuk: 0.94,
  jeonnam: 0.94,
  gyeongbuk: 0.94,
  gyeongnam: 0.96,
  jeju: 1.05,
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
