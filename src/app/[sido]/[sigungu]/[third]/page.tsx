import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DobaeLandingPage, { getLandingMetadata } from '@/components/seo/DobaeLandingPage';
import { getAllBaseRegionParams, resolveRegionPath } from '@/lib/seo/dobaeLanding';
import { getRegionalSignals } from '@/lib/seo/dobaeSignals';

export const revalidate = 3600;

const DOBae_SEGMENT = '도배';

function isDobaeSegment(value: string): boolean {
  return decodeURIComponent(value) === DOBae_SEGMENT;
}

export function generateStaticParams() {
  return getAllBaseRegionParams().map((region) => ({ ...region, third: DOBae_SEGMENT }));
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string; sigungu: string; third: string }> }): Promise<Metadata> {
  const { sido, sigungu, third } = await params;
  const region = isDobaeSegment(third) ? resolveRegionPath(sido, sigungu) : null;
  return region ? getLandingMetadata({ region }) : {};
}

export default async function RegionalDobaePage({ params }: { params: Promise<{ sido: string; sigungu: string; third: string }> }) {
  const { sido, sigungu, third } = await params;
  const region = isDobaeSegment(third) ? resolveRegionPath(sido, sigungu) : null;
  if (!region) notFound();

  const signals = await getRegionalSignals(region.region.name, region.district.name);
  return <DobaeLandingPage scenario={{ region }} signals={signals} />;
}
