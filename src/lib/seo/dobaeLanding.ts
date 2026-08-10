import {
  ESTIMATE_TABLE,
  NATURAL_MULTIPLIER,
  PREMIUM_MULTIPLIER,
  REGION_FACTOR,
  WALLPAPER_LABEL,
} from '@/lib/ai/data/pricingTable';
import { REGION_DATA, type RegionEntry } from '@/lib/ai/data/regions';

export const INDEXABLE_PYEONGS = [24, 30, 32, 34, 40] as const;
export type IndexablePyeong = (typeof INDEXABLE_PYEONGS)[number];

export const GLOBAL_INTENT_SLUGS = [
  '24평',
  '30평',
  '32평',
  '34평',
  '40평',
  '합지',
  '실크벽지',
  '천연벽지',
  '수입벽지',
  '아파트',
  '빌라',
  '원룸',
  '오피스텔',
] as const;

export const REGION_URL_LABELS: Record<string, string> = {
  seoul: '서울',
  busan: '부산',
  daegu: '대구',
  incheon: '인천',
  gwangju: '광주',
  daejeon: '대전',
  ulsan: '울산',
  sejong: '세종',
  gyeonggi: '경기',
  gangwon: '강원',
  chungbuk: '충북',
  chungnam: '충남',
  jeonbuk: '전북',
  jeonnam: '전남',
  gyeongbuk: '경북',
  gyeongnam: '경남',
  jeju: '제주',
};

export type LandingWallpaper = 'vinyl' | 'silk' | 'natural' | 'premium';

export const LANDING_WALLPAPERS: Array<{
  key: LandingWallpaper;
  slug: string;
  label: string;
  tableLabel: string;
  multiplier: number;
}> = [
  { key: 'vinyl', slug: '합지', label: '합지벽지', tableLabel: WALLPAPER_LABEL.vinyl, multiplier: 1 },
  { key: 'silk', slug: '실크벽지', label: '실크벽지', tableLabel: WALLPAPER_LABEL.fabric, multiplier: 1 },
  { key: 'natural', slug: '천연벽지', label: '천연벽지', tableLabel: WALLPAPER_LABEL.natural, multiplier: NATURAL_MULTIPLIER },
  { key: 'premium', slug: '수입벽지', label: '수입벽지', tableLabel: WALLPAPER_LABEL.premium, multiplier: PREMIUM_MULTIPLIER },
];

export const LANDING_BUILDINGS = [
  { slug: '아파트', label: '아파트', multiplier: 1 },
  { slug: '빌라', label: '빌라', multiplier: 1.05 },
  { slug: '원룸', label: '원룸', multiplier: 0.95 },
  { slug: '오피스텔', label: '오피스텔', multiplier: 0.95 },
] as const;

export interface ResolvedRegion {
  region: RegionEntry;
  district: { id: string; name: string };
  localityName?: string;
  urlSegments: string[];
}

export interface LandingScenario {
  region?: ResolvedRegion;
  pyeong?: IndexablePyeong;
  wallpaper?: LandingWallpaper;
  building?: string;
}

export interface PricePoint {
  pyeong: number;
  wallpaper: LandingWallpaper;
  label: string;
  basePrice: number;
  adjustedPrice: number;
  range: [number, number];
}

function normalizeSlug(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase();
}

export function getRegionUrlLabel(regionId: string): string {
  return REGION_URL_LABELS[regionId] ?? regionId;
}

export function getRegionBySlug(slug: string): RegionEntry | undefined {
  const normalized = normalizeSlug(slug);
  return REGION_DATA.find((region) => {
    const shortName = getRegionUrlLabel(region.id);
    return normalized === normalizeSlug(shortName) || normalized === normalizeSlug(region.name);
  });
}

export function resolveRegionPath(
  sidoSlug: string,
  sigunguSlug: string,
  subareaSlug?: string,
): ResolvedRegion | null {
  const region = getRegionBySlug(sidoSlug);
  if (!region) return null;

  const normalizedDistrict = normalizeSlug(sigunguSlug);
  const district = region.districts.find(
    (candidate) =>
      normalizedDistrict === normalizeSlug(candidate.name) ||
      normalizedDistrict === normalizeSlug(candidate.id),
  );
  if (!district) return null;

  if (!subareaSlug) {
    return {
      region,
      district,
      urlSegments: [getRegionUrlLabel(region.id), district.name],
    };
  }

  const subarea = getRegionalSubarea(
    getRegionUrlLabel(region.id),
    district.name,
    subareaSlug,
  );
  if (!subarea) return null;

  return {
    region,
    district,
    localityName: subarea.label,
    urlSegments: [getRegionUrlLabel(region.id), district.name, subarea.label],
  };
}

export const REGIONAL_SUBAREAS = [
  { sido: '경기', sigungu: '성남시', slug: '분당구', label: '분당구' },
  { sido: '경기', sigungu: '고양시', slug: '일산', label: '일산' },
] as const;

export function getRegionalSubarea(
  sido: string,
  sigungu: string,
  slug: string,
): (typeof REGIONAL_SUBAREAS)[number] | null {
  const normalized = normalizeSlug(slug);
  return (
    REGIONAL_SUBAREAS.find(
      (subarea) =>
        normalizeSlug(subarea.sido) === normalizeSlug(sido) &&
        normalizeSlug(subarea.sigungu) === normalizeSlug(sigungu) &&
        normalizeSlug(subarea.slug) === normalized,
    ) ?? null
  );
}

export function getEstimateRow(pyeong: number) {
  return ESTIMATE_TABLE.find((row) => row.pyeong === pyeong) ?? null;
}

export function getRegionFactor(regionId?: string): number {
  return regionId ? REGION_FACTOR[regionId] ?? 1 : 1;
}

export function getPricePoint(
  pyeong: number,
  wallpaper: LandingWallpaper,
  regionId?: string,
  building?: string,
): PricePoint | null {
  const row = getEstimateRow(pyeong);
  const wallpaperOption = LANDING_WALLPAPERS.find((item) => item.key === wallpaper);
  if (!row || !wallpaperOption) return null;

  const basePrice = wallpaper === 'vinyl' ? row.vinylNarrow : row.silk;
  const buildingFactor = LANDING_BUILDINGS.find((item) => item.slug === building)?.multiplier ?? 1;
  const adjustedPrice = Math.round(
    (basePrice * wallpaperOption.multiplier * getRegionFactor(regionId) * buildingFactor) / 10000,
  ) * 10000;

  return {
    pyeong,
    wallpaper,
    label: wallpaperOption.label,
    basePrice,
    adjustedPrice,
    range: [Math.round(adjustedPrice * 0.9 / 10000) * 10000, Math.round(adjustedPrice * 1.1 / 10000) * 10000],
  };
}

export function getPriceTable(
  pyeongs: readonly number[],
  regionId?: string,
  building?: string,
): PricePoint[] {
  return pyeongs.flatMap((pyeong) =>
    LANDING_WALLPAPERS.map(({ key }) => getPricePoint(pyeong, key, regionId, building)).filter(
      (point): point is PricePoint => Boolean(point),
    ),
  );
}

export function parseGlobalIntent(keyword: string): LandingScenario | null {
  const decoded = normalizeSlug(keyword);
  const pyeongMatch = decoded.match(/^(\d+)평$/);
  if (pyeongMatch) {
    const pyeong = Number(pyeongMatch[1]);
    return INDEXABLE_PYEONGS.includes(pyeong as IndexablePyeong)
      ? { pyeong: pyeong as IndexablePyeong }
      : null;
  }

  const wallpaper = LANDING_WALLPAPERS.find(
    (item) => decoded === normalizeSlug(item.slug) || decoded === normalizeSlug(item.label),
  );
  if (wallpaper) return { wallpaper: wallpaper.key };

  const building = LANDING_BUILDINGS.find((item) => decoded === normalizeSlug(item.slug));
  return building ? { building: building.slug } : null;
}

export function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function formatPriceRange([min, max]: [number, number]): string {
  return `${formatWon(min)}~${formatWon(max)}`;
}

export function getLocalLabel(region: ResolvedRegion): string {
  return region.localityName
    ? `${region.district.name} ${region.localityName}`
    : region.district.name;
}

export function getRegionSeoPath(region: ResolvedRegion): string {
  return `/${region.urlSegments.map(encodeURIComponent).join('/')}/도배`;
}

export function getRegionScenarioPath(region: ResolvedRegion, pyeong: number): string {
  return `/${region.urlSegments.slice(0, 2).map(encodeURIComponent).join('/')}/${pyeong}평/도배`;
}

export function getGlobalIntentPath(keyword: string): string {
  return `/${encodeURIComponent(keyword)}-도배비용`;
}

export function getAllBaseRegionParams() {
  return REGION_DATA.flatMap((region) =>
    region.districts.map((district) => ({
      sido: getRegionUrlLabel(region.id),
      sigungu: district.name,
    })),
  );
}

export function getAllRegionalSubareaParams() {
  return REGIONAL_SUBAREAS.map((subarea) => ({
    sido: subarea.sido,
    sigungu: subarea.sigungu,
    subarea: subarea.slug,
  }));
}
