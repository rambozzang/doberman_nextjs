import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllSidoParams,
  getRegionBySlug,
  getRegionUrlLabel,
  getRegionScenarioPath,
  getSidoPath,
  INDEXABLE_PYEONGS,
} from '@/lib/seo/dobaeLanding';
import { getVendorCountMap, regionKey, buildPolicy } from '@/lib/seo/regionIndexing';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';
const DOBae_SEGMENT = '도배';

/**
 * 시도 허브 (/{시도}/도배)
 *
 * 지역 상세 페이지 1,000여 개가 sitemap 으로만 발견되던 고아 구조였다.
 * 홈 → /regional-guide → 시도 허브 → 시군구 상세로 내려가는 계층을 만들어
 * 모든 색인 대상이 홈에서 3클릭 안에 닿게 한다.
 */
export function generateStaticParams() {
  return getAllSidoParams().map(({ sido }) => ({ sido, sigungu: DOBae_SEGMENT }));
}

function resolve(sidoSlug: string, sigunguSlug: string) {
  if (decodeURIComponent(sigunguSlug) !== DOBae_SEGMENT) return null;
  return getRegionBySlug(sidoSlug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string; sigungu: string }> }): Promise<Metadata> {
  const { sido, sigungu } = await params;
  const region = resolve(sido, sigungu);
  if (!region) return {};

  const label = getRegionUrlLabel(region.id);
  const map = await getVendorCountMap();
  const vendorTotal = region.districts.reduce(
    (sum, district) => sum + (map.get(regionKey(region.name, district.name)) ?? 0),
    0,
  );

  const title = `${label} 도배 비용 | 시군구별 2026 기준가${vendorTotal > 0 ? ` · 등록업체 ${vendorTotal}곳` : ''} - 도배르만`;
  const description = `${label} ${region.districts.length}개 시군구의 도배 비용을 한 곳에서 비교하세요. 평형별 기준가와 지역별 등록 업체 현황, 무료 비교견적 신청을 제공합니다.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}${getSidoPath(region.id)}` },
    // 허브는 링크 가치를 전달하는 페이지라 항상 색인 대상이다.
    robots: { index: true, follow: true },
    openGraph: { title, description, url: `${BASE_URL}${getSidoPath(region.id)}`, type: 'article', locale: 'ko_KR' },
  };
}

export default async function SidoHubPage({ params }: { params: Promise<{ sido: string; sigungu: string }> }) {
  const { sido, sigungu } = await params;
  const region = resolve(sido, sigungu);
  if (!region) notFound();

  const label = getRegionUrlLabel(region.id);
  const map = await getVendorCountMap();

  // 업체가 있는 지역을 먼저 보여준다. 실데이터가 있는 페이지로 링크가 몰려야
  // 크롤링 예산이 의미 있게 쓰인다.
  const districts = region.districts
    .map((district) => {
      const vendorCount = map.get(regionKey(region.name, district.name)) ?? 0;
      return {
        ...district,
        vendorCount,
        policy: buildPolicy(vendorCount),
        href: `/${encodeURIComponent(label)}/${encodeURIComponent(district.name)}/${encodeURIComponent(DOBae_SEGMENT)}`,
      };
    })
    .sort((a, b) => b.vendorCount - a.vendorCount || a.name.localeCompare(b.name, 'ko'));

  const withVendors = districts.filter((district) => district.vendorCount > 0);
  const totalVendors = districts.reduce((sum, district) => sum + district.vendorCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: '도배르만', item: BASE_URL },
              { '@type': 'ListItem', position: 2, name: '지역별 도배', item: `${BASE_URL}/regional-guide` },
              { '@type': 'ListItem', position: 3, name: `${label} 도배`, item: `${BASE_URL}${getSidoPath(region.id)}` },
            ],
          }),
        }}
      />

      <main className="pb-20 pt-20 lg:pt-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="현재 위치" className="mb-8 text-sm text-slate-400">
            <Link href="/" className="hover:text-white">도배르만</Link>
            <span className="px-2" aria-hidden="true">/</span>
            <Link href="/regional-guide" className="hover:text-white">지역별 도배</Link>
            <span className="px-2" aria-hidden="true">/</span>
            <span className="text-slate-300">{label}</span>
          </nav>

          <section className="border-b border-slate-800 pb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {label} 도배 비용 · 시군구별 기준가
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
              {label} {region.districts.length}개 시군구의 2026 도배 기준가를 비교할 수 있습니다.
              {totalVendors > 0
                ? ` 현재 ${label}에 등록된 도배 업체는 ${totalVendors.toLocaleString('ko-KR')}곳이며, ${withVendors.length}개 시군구에 분포합니다.`
                : ' 등록 업체가 집계되면 지역별 현황이 함께 표시됩니다.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote-request" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-500">
                무료 비교견적 신청
              </Link>
              <Link href="/quote-calculator" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-700 px-6 font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
                견적 계산기
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-bold text-white">{label} 시군구별 도배 페이지</h2>
            <p className="mt-2 text-sm text-slate-400">등록 업체가 많은 지역 순으로 표시됩니다.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {districts.map((district) => (
                <li key={district.id}>
                  <Link
                    href={district.href}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 transition hover:border-blue-500/60"
                  >
                    <span className="font-semibold text-slate-200">{district.name} 도배</span>
                    <span className="text-xs text-slate-500">
                      {district.vendorCount > 0 ? `업체 ${district.vendorCount}곳` : '집계 중'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 평형 페이지로 내려가는 링크. 업체가 있는 지역만 노출해
              실데이터 없는 페이지로 링크가 새지 않게 한다. */}
          {withVendors.filter((district) => district.policy.indexPyeong).length > 0 && (
            <section className="mt-14 border-t border-slate-800 pt-10">
              <h2 className="text-xl font-bold text-white">{label} 평형별 도배 비용</h2>
              <div className="mt-6 space-y-6">
                {withVendors
                  .filter((district) => district.policy.indexPyeong)
                  .map((district) => (
                    <div key={district.id}>
                      <p className="text-sm font-semibold text-slate-300">{district.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {INDEXABLE_PYEONGS.map((pyeong) => (
                          <Link
                            key={pyeong}
                            href={getRegionScenarioPath(
                              {
                                region,
                                district: { id: district.id, name: district.name },
                                urlSegments: [label, district.name],
                              },
                              pyeong,
                            )}
                            className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-blue-400 hover:text-white"
                          >
                            {pyeong}평
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
