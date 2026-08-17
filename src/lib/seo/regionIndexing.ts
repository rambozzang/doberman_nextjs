/**
 * 지역 페이지 색인 정책.
 *
 * 배경: /{시도}/{시군구}/{평형}/도배 형태로 1,400여 개 URL 을 만들어 두었으나
 * Google 이 348건을 "크롤링됨 - 색인 생성되지 않음" 으로 거부했다.
 * 실데이터 없이 템플릿만 치환한 페이지가 대량으로 존재하는 게 원인이다.
 *
 * 그래서 색인 대상을 "그 지역에 실제 등록 업체가 있는 곳" 으로 좁힌다.
 * 업체 수는 /vendor/clusters 한 번으로 전 지역을 받아올 수 있어
 * sitemap 생성과 페이지 렌더링이 같은 기준을 공유할 수 있다.
 * (기준이 갈리면 sitemap 은 색인하라는데 페이지는 noindex 인 모순이 생긴다)
 */

/** 등급별 임계값. 실측 분포에 맞춰 정했다 — 아래 주석 참고. */
export const PYEONG_INDEX_MIN_VENDORS = 2;
export const BASE_INDEX_MIN_VENDORS = 1;

/**
 * 2026-08 실측: 업체 보유 시군구 82곳(전체 229곳), 총 업체 136곳.
 *   업체 1곳 이상 82곳 · 2곳 이상 32곳 · 3곳 이상 11곳
 * 지시서 예시 기준(3곳 이상)을 쓰면 색인 대상이 66 URL 로 목표(200~400)에
 * 한참 못 미친다. 그래서 2단계로 나눴다.
 *   Tier A (업체 2곳 이상): 기본 + 평형 5종  → 32 × 6 = 192 URL
 *   Tier B (업체 1곳):      기본 페이지만    → 50 × 1 =  50 URL
 * 합계 242 URL 로 목표 구간에 들어온다.
 */

/**
 * 시도 명칭 정규화.
 *
 * REGION_DATA 는 '강원도'·'전라북도', 업체 API 는 '강원특별자치도'·'전북특별자치도'
 * 를 쓴다. 정규화 없이 조인하면 두 지역이 통째로 누락된다.
 */
const SIDO_ALIAS: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원도: '강원',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전라북도: '전북',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주도: '제주',
  제주특별자치도: '제주',
};

export function toShortSido(name: string): string {
  const normalized = name.replace(/\s/g, '');
  return SIDO_ALIAS[normalized] ?? normalized;
}

export function regionKey(sido: string, sigungu: string): string {
  return `${toShortSido(sido)}|${sigungu.trim()}`;
}

interface VendorCluster {
  cnt?: number;
  sido?: string;
  sigungu?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.tigerbk.com/api-doman/web';

/** 같은 빌드/요청 사이클 안에서 중복 호출을 막는다. */
let cachedMap: Promise<Map<string, number>> | null = null;

async function fetchVendorCountMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/clusters`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return map;

    const payload = (await response.json()) as { success?: boolean; data?: VendorCluster[] };
    if (payload.success === false || !Array.isArray(payload.data)) return map;

    for (const cluster of payload.data) {
      if (!cluster.sido || !cluster.sigungu) continue;
      const key = regionKey(cluster.sido, cluster.sigungu);
      map.set(key, (map.get(key) ?? 0) + (cluster.cnt ?? 0));
    }
  } catch {
    // 집계 API 장애로 SEO 페이지가 500 이 되면 안 된다.
    // 빈 맵이면 아래 정책이 보수적으로 noindex 를 주므로 안전한 실패다.
  }
  return map;
}

export function getVendorCountMap(): Promise<Map<string, number>> {
  cachedMap ??= fetchVendorCountMap();
  return cachedMap;
}

export interface RegionIndexPolicy {
  vendorCount: number;
  /** 기본 지역 페이지(/{시도}/{시군구}/도배) 색인 여부 */
  indexBase: boolean;
  /** 평형 페이지(/{시도}/{시군구}/{평형}/도배) 색인 여부 */
  indexPyeong: boolean;
}

export function buildPolicy(vendorCount: number): RegionIndexPolicy {
  return {
    vendorCount,
    indexBase: vendorCount >= BASE_INDEX_MIN_VENDORS,
    indexPyeong: vendorCount >= PYEONG_INDEX_MIN_VENDORS,
  };
}

/**
 * 지역 하나의 색인 정책.
 *
 * 집계를 못 받아왔을 때(빈 맵)는 vendorCount 0 → 전부 noindex 가 된다.
 * 없는 데이터를 있다고 우기는 페이지를 색인시키는 것보다 낫다.
 */
export async function getRegionIndexPolicy(
  sido: string,
  sigungu: string,
): Promise<RegionIndexPolicy> {
  const map = await getVendorCountMap();
  return buildPolicy(map.get(regionKey(sido, sigungu)) ?? 0);
}

/** Next.js Metadata 의 robots 필드로 바로 넣을 수 있는 형태. */
export function robotsMeta(indexable: boolean) {
  // noindex 여도 follow 는 유지한다 — 링크는 계속 타고 가게 둔다.
  return indexable
    ? { index: true, follow: true }
    : { index: false, follow: true };
}
