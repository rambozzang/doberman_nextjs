import type { MetadataRoute } from 'next';
import {
  GLOBAL_INTENT_SLUGS,
  getAllBaseRegionParams,
  getAllRegionalSubareaParams,
  getAllSidoParams,
  getGlobalIntentPath,
  getRegionScenarioPath,
  getRegionSeoPath,
  getSidoPath,
  encodePath,
  resolveRegionPath,
  INDEXABLE_PYEONGS,
} from '@/lib/seo/dobaeLanding';
import { buildPolicy, getVendorCountMap, regionKey } from '@/lib/seo/regionIndexing';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';

export const revalidate = 3600;

/**
 * sitemap 은 "색인시키고 싶은 URL" 만 담는다.
 *
 * 이전에는 1,426개 URL 을 전부 넣었고 그중 348건이 "크롤링됨 - 색인 생성되지
 * 않음" 으로 거부됐다. 실데이터가 없는 지역 페이지까지 제출하면 크롤링 예산만
 * 낭비되고 사이트 전체 품질 평가도 떨어진다.
 * 색인 기준은 regionIndexing 의 정책 하나로 페이지 메타와 공유한다.
 *
 * lastmod 는 넣지 않는다.
 * 지역 페이지 내용이 마지막으로 바뀐 시각을 알 수 있는 값이 현재 없다.
 * 전 URL 에 같은 타임스탬프를 넣으면 Google 이 lastmod 신호 자체를 무시하게
 * 되므로, 거짓 값을 넣느니 생략한다.
 * (백엔드가 지역별 updatedAt 을 내려주면 그때 URL 별로 채운다)
 *
 * priority·changefreq 도 제거했다 — Google 은 두 값을 사용하지 않는다.
 */

const corePages = [
  '',
  '/quote-request',
  '/quote-request-ai',
  '/quote-calculator',
  '/quote-request/list',
  '/service-intro',
  '/regional-guide',
  '/faq',
  '/customer-support',
  '/checklist',
  '/board',
  '/도배-시공',
  '/도배-견적',
  '/도배-가격',
  '/도배-업체',
  '/도배-방법',
  '/도배-종류',
  '/아파트-도배',
  '/저렴한-도배',
  '/24평-도배-견적',
  '/32평-도배-견적',
  '/합지벽지-견적',
  '/실크벽지-견적',
  '/천연벽지-견적',
  '/수입벽지-견적',
  '/빌라-도배-견적',
  '/오피스텔-도배-견적',
  '/단독주택-도배-견적',
  '/상가-도배-견적',
  '/사무실-도배-견적',
  '/서울-도배-견적',
  '/경기-도배-견적',
  '/인천-도배-견적',
  '/부산-도배-견적',
  '/대구-도배-견적',
  '/대전-도배-견적',
  '/광주-도배-견적',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vendorMap = await getVendorCountMap();
  const urls: string[] = [];

  // 1) 고정 페이지 — 한글 경로도 지역 페이지와 같은 인코딩 규칙을 따른다.
  urls.push(...corePages.map((path) => `${BASE_URL}${encodePath(path)}`));

  // 2) 시도 허브 — 지역 페이지로 내려가는 진입점이라 항상 포함한다.
  urls.push(...getAllSidoParams().map(({ region }) => `${BASE_URL}${getSidoPath(region.id)}`));

  // 3) 시군구 / 평형 페이지 — 등록 업체 수 기준으로 걸러낸다.
  for (const { sido, sigungu } of getAllBaseRegionParams()) {
    const region = resolveRegionPath(sido, sigungu);
    if (!region) continue;

    const policy = buildPolicy(vendorMap.get(regionKey(region.region.name, region.district.name)) ?? 0);
    if (!policy.indexBase) continue;

    urls.push(`${BASE_URL}${getRegionSeoPath(region)}`);

    if (policy.indexPyeong) {
      urls.push(
        ...INDEXABLE_PYEONGS.map((pyeong) => `${BASE_URL}${getRegionScenarioPath(region, pyeong)}`),
      );
    }
  }

  // 4) 동네 단위 페이지(분당구·일산) — 상위 시군구가 색인 대상일 때만.
  for (const { sido, sigungu, subarea } of getAllRegionalSubareaParams()) {
    const region = resolveRegionPath(sido, sigungu, subarea);
    if (!region) continue;

    const policy = buildPolicy(vendorMap.get(regionKey(region.region.name, region.district.name)) ?? 0);
    if (!policy.indexBase) continue;

    urls.push(`${BASE_URL}${getRegionSeoPath(region)}`);
  }

  // 5) 전역 키워드 페이지
  urls.push(...GLOBAL_INTENT_SLUGS.map((keyword) => `${BASE_URL}${getGlobalIntentPath(keyword)}`));

  // 경로 인코딩 규칙이 한 곳으로 통일됐어도 중복 URL 은 한 번 더 막는다.
  return [...new Set(urls)].map((url) => ({ url }));
}
