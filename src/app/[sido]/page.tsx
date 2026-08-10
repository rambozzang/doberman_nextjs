import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DobaeLandingPage, { getLandingMetadata } from '@/components/seo/DobaeLandingPage';
import { GLOBAL_INTENT_SLUGS, parseGlobalIntent } from '@/lib/seo/dobaeLanding';

export const revalidate = 3600;

const SUFFIX = '-도배비용';

function getScenario(slug: string) {
  const decoded = decodeURIComponent(slug);
  if (!decoded.endsWith(SUFFIX)) return null;
  return parseGlobalIntent(decoded.slice(0, -SUFFIX.length));
}

export function generateStaticParams() {
  return GLOBAL_INTENT_SLUGS.map((keyword) => ({ sido: `${keyword}${SUFFIX}` }));
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string }> }): Promise<Metadata> {
  const scenario = getScenario((await params).sido);
  return scenario ? getLandingMetadata(scenario) : {};
}

export default async function GlobalDobaeIntentPage({ params }: { params: Promise<{ sido: string }> }) {
  const scenario = getScenario((await params).sido);
  if (!scenario) notFound();
  return <DobaeLandingPage scenario={scenario} />;
}
