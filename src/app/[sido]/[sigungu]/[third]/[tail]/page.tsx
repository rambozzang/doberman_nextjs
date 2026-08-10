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

export async function generateMetadata({ params }: { params: Promise<{ sido: string; sigungu: string; third: string; tail: string }> }): Promise<Metadata> {
  const resolved = await resolveScenario(await params);
  return resolved ? getLandingMetadata(resolved) : {};
}

export default async function ThirdSegmentDobaePage({ params }: { params: Promise<{ sido: string; sigungu: string; third: string; tail: string }> }) {
  const resolved = await resolveScenario(await params);
  if (!resolved) notFound();

  const signals = await getRegionalSignals(resolved.region.region.name, resolved.region.district.name);
  return <DobaeLandingPage scenario={resolved} signals={signals} />;
}
