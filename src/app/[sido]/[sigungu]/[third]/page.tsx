import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DobaeLandingPage, { getLandingMetadata } from '@/components/seo/DobaeLandingPage';
import { getAllBaseRegionParams, resolveRegionPath } from '@/lib/seo/dobaeLanding';
import { getRegionalSignals } from '@/lib/seo/dobaeSignals';
import { getRegionIndexPolicy } from '@/lib/seo/regionIndexing';

export const revalidate = 3600;

const DOBae_SEGMENT = '도배';

function isDobaeSegment(value: string): boolean {
  return decodeURIComponent(value) === DOBae_SEGMENT;
}

export function generateStaticParams() {
  return getAllBaseRegionParams().map((region) => ({ ...region, third: DOBae_SEGMENT }));
}

async function loadPageData(params: { sido: string; sigungu: string; third: string }) {
  const region = isDobaeSegment(params.third) ? resolveRegionPath(params.sido, params.sigungu) : null;
  if (!region) return null;

  const [signals, policy] = await Promise.all([
    getRegionalSignals(region.region.name, region.district.name),
    getRegionIndexPolicy(region.region.name, region.district.name),
  ]);
  return { region, signals, policy };
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string; sigungu: string; third: string }> }): Promise<Metadata> {
  const data = await loadPageData(await params);
  if (!data) return {};
  return getLandingMetadata(
    { region: data.region },
    { signals: data.signals, indexable: data.policy.indexBase },
  );
}

export default async function RegionalDobaePage({ params }: { params: Promise<{ sido: string; sigungu: string; third: string }> }) {
  const data = await loadPageData(await params);
  if (!data) notFound();

  return <DobaeLandingPage scenario={{ region: data.region }} signals={data.signals} />;
}
