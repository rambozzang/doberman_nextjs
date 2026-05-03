import type { SimilarCase } from '../types';

export const SIMILAR_CASES: SimilarCase[] = [
  { id: 'c1', title: '강남구 32평 아파트 거실+방 실크 시공', imageUrl: '/logo.png', price: 1450000, pyeong: 32, wallpaperType: 'fabric', region: '서울 강남구' },
  { id: 'c2', title: '송파구 24평 아파트 전체 합지 시공', imageUrl: '/logo.png', price: 880000, pyeong: 24, wallpaperType: 'vinyl', region: '서울 송파구' },
  { id: 'c3', title: '성동구 18평 오피스텔 거실 실크 시공', imageUrl: '/logo.png', price: 980000, pyeong: 18, wallpaperType: 'fabric', region: '서울 성동구' },
  { id: 'c4', title: '용인시 45평 아파트 전체 천연 시공', imageUrl: '/logo.png', price: 4100000, pyeong: 45, wallpaperType: 'natural', region: '경기 용인시' },
  { id: 'c5', title: '마포구 28평 빌라 거실+방2 실크합지', imageUrl: '/logo.png', price: 1320000, pyeong: 28, wallpaperType: 'silk-vinyl', region: '서울 마포구' },
  { id: 'c6', title: '수원시 33평 아파트 거실 수입벽지', imageUrl: '/logo.png', price: 1780000, pyeong: 33, wallpaperType: 'premium', region: '경기 수원시' },
  { id: 'c7', title: '인천 남동구 22평 아파트 전체 합지', imageUrl: '/logo.png', price: 760000, pyeong: 22, wallpaperType: 'vinyl', region: '인천 남동구' },
  { id: 'c8', title: '부산 해운대구 38평 아파트 실크 시공', imageUrl: '/logo.png', price: 1980000, pyeong: 38, wallpaperType: 'fabric', region: '부산 해운대구' },
  { id: 'c9', title: '서대문구 15평 빌라 방+거실 합지', imageUrl: '/logo.png', price: 540000, pyeong: 15, wallpaperType: 'vinyl', region: '서울 서대문구' },
  { id: 'c10', title: '성남시 40평 아파트 전체 실크 시공', imageUrl: '/logo.png', price: 2380000, pyeong: 40, wallpaperType: 'fabric', region: '경기 성남시' },
  { id: 'c11', title: '강서구 27평 아파트 거실 천연 시공', imageUrl: '/logo.png', price: 1620000, pyeong: 27, wallpaperType: 'natural', region: '서울 강서구' },
  { id: 'c12', title: '광주 북구 30평 아파트 합지 시공', imageUrl: '/logo.png', price: 1020000, pyeong: 30, wallpaperType: 'silk-vinyl', region: '광주 북구' },
];

/**
 * 슬롯에 가장 유사한 사례 3개를 평수 거리 + 벽지 일치도 기반으로 선택
 */
export function pickSimilarCases(opts: {
  pyeong?: number;
  wallpaperType?: string;
  buildingType?: string;
}): SimilarCase[] {
  const { pyeong, wallpaperType } = opts;
  const scored = SIMILAR_CASES.map((c) => {
    const pyeongDiff = pyeong ? Math.abs(c.pyeong - pyeong) : 10;
    const wallpaperBonus = wallpaperType && c.wallpaperType === wallpaperType ? -5 : 0;
    return { case: c, score: pyeongDiff + wallpaperBonus };
  }).sort((a, b) => a.score - b.score);
  return scored.slice(0, 3).map((s) => s.case);
}
