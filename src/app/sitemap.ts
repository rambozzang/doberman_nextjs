import type { MetadataRoute } from 'next';
import {
  GLOBAL_INTENT_SLUGS,
  getAllBaseRegionParams,
  getAllRegionalSubareaParams,
  getGlobalIntentPath,
  getRegionScenarioPath,
  getRegionSeoPath,
  resolveRegionPath,
  INDEXABLE_PYEONGS,
} from '@/lib/seo/dobaeLanding';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';

const corePages = [
  { path: '', changeFrequency: 'daily' as const, priority: 1 },
  { path: '/quote-request', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/quote-request-ai', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/quote-calculator', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/quote-request/list', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/service-intro', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/regional-guide', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/faq', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/customer-support', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/checklist', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/board', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/도배-시공', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/도배-견적', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/도배-가격', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/도배-업체', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/도배-방법', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/도배-종류', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/아파트-도배', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/저렴한-도배', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/24평-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/32평-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/합지벽지-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/실크벽지-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/천연벽지-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/수입벽지-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/빌라-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/오피스텔-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/단독주택-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/상가-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/사무실-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/서울-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/경기-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/인천-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/부산-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/대구-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/대전-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/광주-도배-견적', changeFrequency: 'weekly' as const, priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticEntries = corePages.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const regionalEntries = getAllBaseRegionParams().flatMap(({ sido, sigungu }) => {
    const region = resolveRegionPath(sido, sigungu);
    if (!region) return [];

    const base = {
      url: `${BASE_URL}${getRegionSeoPath(region)}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
    const pyeongPages = INDEXABLE_PYEONGS.map((pyeong) => ({
      url: `${BASE_URL}${getRegionScenarioPath(region, pyeong)}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [base, ...pyeongPages];
  });

  const subareaEntries = getAllRegionalSubareaParams().flatMap(({ sido, sigungu, subarea }) => {
    const region = resolveRegionPath(sido, sigungu, subarea);
    return region
      ? [{
          url: `${BASE_URL}${getRegionSeoPath(region)}`,
          lastModified,
          changeFrequency: 'daily' as const,
          priority: 0.8,
        }]
      : [];
  });

  const globalIntentEntries = GLOBAL_INTENT_SLUGS.map((keyword) => ({
    url: `${BASE_URL}${getGlobalIntentPath(keyword)}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...regionalEntries, ...subareaEntries, ...globalIntentEntries];
}
