import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DobaeLandingPage, { getLandingMetadata } from '@/components/seo/DobaeLandingPage';
import {
  INDEXABLE_PYEONGS,
  getAllBaseRegionParams,
  getAllRegionalSubareaParams,
  resolveRegionPath,
} from '@/lib/seo/dobaeLanding';
import { getRegionalSignals } from '@/lib/seo/dobaeSignals';
import { getRegionIndexPolicy } from '@/lib/seo/regionIndexing';

export const revalidate = 3600;

const DOBae_SEGMENT = '도배';

function isDobaeSegment(value: string): boolean {
  return decodeURIComponent(value) === DOBae_SEGMENT;
}

function getPyeong(value: string): number | null {
  const parsed = Number(decodeURIComponent(value).replace('평', ''));
  return Number.isInteger(parsed) ? parsed : null;
}

export function generateStaticParams() {
  const pyeongParams = getAllBaseRegionParams().flatMap((region) =>
    INDEXABLE_PYEONGS.map((pyeong) => ({ ...region, third: `${pyeong}평`, tail: DOBae_SEGMENT })),
  );
  return [
    ...pyeongParams,
    ...getAllRegionalSubareaParams().map(({ sido, sigungu, subarea }) => ({
      sido,
      sigungu,
      third: subarea,
      tail: DOBae_SEGMENT,
    })),
  ];
}

async function resolveScenario(params: { sido: string; sigungu: string; third: string; tail: string }) {
  if (!isDobaeSegment(params.tail)) return null;

  const pyeong = getPyeong(params.third);
  const baseRegion = resolveRegionPath(params.sido, params.sigungu);
  if (baseRegion && pyeong && INDEXABLE_PYEONGS.includes(pyeong as (typeof INDEXABLE_PYEONGS)[number])) {
    return { region: baseRegion, pyeong: pyeong as (typeof INDEXABLE_PYEONGS)[number] };
  }

  const subareaRegion = resolveRegionPath(params.sido, params.sigungu, params.third);
  return subareaRegion ? { region: subareaRegion } : null;
}

/**
 * 평형 페이지는 지역 페이지 중에서도 서로 가장 비슷하다(숫자 하나만 다름).
 * 그래서 등록 업체가 일정 수 이상인 지역에서만 색인을 허용한다.
 */
async function loadPageData(params: { sido: string; sigungu: string; third: string; tail: string }) {
  const resolved = await resolveScenario(params);
  if (!resolved) return null;

  const [signals, policy] = await Promise.all([
    getRegionalSignals(resolved.region.region.name, resolved.region.district.name),
    getRegionIndexPolicy(resolved.region.region.name, resolved.region.district.name),
  ]);
  return { resolved, signals, policy };
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string; sigungu: string; third: string; tail: string }> }): Promise<Metadata> {
  const data = await loadPageData(await params);
  if (!data) return {};
  return getLandingMetadata(data.resolved, {
    signals: data.signals,
    indexable: data.policy.indexPyeong,
  });
}

export default async function ThirdSegmentDobaePage({ params }: { params: Promise<{ sido: string; sigungu: string; third: string; tail: string }> }) {
  const data = await loadPageData(await params);
  if (!data) notFound();

  return <DobaeLandingPage scenario={data.resolved} signals={data.signals} />;
}
