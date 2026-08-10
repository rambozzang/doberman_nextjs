import Link from 'next/link';
import {
  LANDING_BUILDINGS,
  LANDING_WALLPAPERS,
  INDEXABLE_PYEONGS,
  type LandingScenario,
  type PricePoint,
  formatPriceRange,
  formatWon,
  getGlobalIntentPath,
  getLocalLabel,
  getPricePoint,
  getPriceTable,
  getRegionScenarioPath,
  getRegionSeoPath,
} from '@/lib/seo/dobaeLanding';
import type { RegionalSignals } from '@/lib/seo/dobaeSignals';

interface DobaeLandingPageProps {
  scenario: LandingScenario;
  signals?: RegionalSignals;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';

function PriceTable({ rows, selectedWallpaper }: { rows: PricePoint[]; selectedWallpaper?: string }) {
  const visibleRows = selectedWallpaper
    ? rows.filter((row) => row.wallpaper === selectedWallpaper)
    : rows;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/80">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-800/90 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">평형</th>
            <th scope="col" className="px-4 py-3 font-semibold">벽지</th>
            <th scope="col" className="px-4 py-3 font-semibold">2026 기준가</th>
            <th scope="col" className="px-4 py-3 font-semibold">예상 범위</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
          {visibleRows.map((row) => (
            <tr key={`${row.pyeong}-${row.wallpaper}`} className="text-slate-200">
              <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">{row.pyeong}평</th>
              <td className="whitespace-nowrap px-4 py-3">{row.label}</td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-blue-300">{formatWon(row.adjustedPrice)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-400">{formatPriceRange(row.range)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonLd({ scenario, title, description, canonical }: {
  scenario: LandingScenario;
  title: string;
  description: string;
  canonical: string;
}) {
  const areaName = scenario.region ? getLocalLabel(scenario.region) : '전국';
  const questions = [
    {
      question: `${areaName} 도배 비용은 어떻게 달라지나요?`,
      answer: '평형, 벽지 종류, 철거·보수 여부, 가구 이동과 같은 현장 조건에 따라 달라집니다. 이 페이지의 가격은 2026 전국 평균표에 지역 보정계수를 적용한 참고 범위입니다.',
    },
    {
      question: '계산기 가격과 실제 견적이 다른 이유는 무엇인가요?',
      answer: '계산기는 입력한 조건의 기준가를 보여주며, 실제 견적은 벽면 상태·시공 범위·현장 접근성·부가 작업을 확인한 뒤 확정됩니다.',
    },
    {
      question: '도배 업체 비교견적은 무료인가요?',
      answer: '도배르만에서 기본 견적 요청과 업체 비교를 무료로 신청할 수 있습니다. 최종 계약 전에는 작업 범위와 포함 옵션을 업체와 확인하세요.',
    },
  ];

  const breadcrumbItems = [
    { name: '도배르만', url: BASE_URL },
    { name: '도배 견적 계산기', url: `${BASE_URL}/quote-calculator` },
    { name: title, url: canonical },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            description,
            url: canonical,
            inLanguage: 'ko-KR',
            about: { '@type': 'Service', name: `${areaName} 도배 견적 비교` },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              item: item.url,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: questions.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }),
        }}
      />
    </>
  );
}

function buildTitle(scenario: LandingScenario): string {
  const local = scenario.region ? getLocalLabel(scenario.region) : null;
  if (local && scenario.pyeong) return `${local} ${scenario.pyeong}평 도배 비용 | 합지·실크 가격 비교 - 도배르만`;
  if (local) return `${local} 도배 견적 | 평수별 도배 비용·업체 비교 - 도배르만`;
  if (scenario.pyeong) return `${scenario.pyeong}평 아파트 도배 비용 | 합지·실크 가격 비교 - 도배르만`;
  if (scenario.wallpaper) {
    const label = LANDING_WALLPAPERS.find((item) => item.key === scenario.wallpaper)?.label ?? '벽지';
    return `${label} 도배 비용 | 평수별 시공 가격·견적 비교 - 도배르만`;
  }
  const building = LANDING_BUILDINGS.find((item) => item.slug === scenario.building)?.label ?? '주거공간';
  return `${building} 도배 비용 | 평수별 가격·업체 비교 - 도배르만`;
}

function buildDescription(scenario: LandingScenario): string {
  const local = scenario.region ? getLocalLabel(scenario.region) : '전국';
  const pyeong = scenario.pyeong ? `${scenario.pyeong}평 ` : '';
  const wallpaper = scenario.wallpaper
    ? `${LANDING_WALLPAPERS.find((item) => item.key === scenario.wallpaper)?.label ?? '벽지'} `
    : '합지·실크 벽지 ';
  const building = scenario.building ? `${scenario.building} ` : '';
  return `${local} ${pyeong}${building}${wallpaper}도배 비용을 2026 전국 평균 단가와 비교해보세요. 평수별 기준가, 예상 범위, 업체 수와 무료 비교견적 신청 방법을 한 페이지에서 확인할 수 있습니다.`;
}

function buildCanonical(scenario: LandingScenario): string {
  if (scenario.region) {
    if (scenario.pyeong) return `${BASE_URL}${getRegionScenarioPath(scenario.region, scenario.pyeong)}`;
    return `${BASE_URL}${getRegionSeoPath(scenario.region)}`;
  }
  if (scenario.pyeong) return `${BASE_URL}${getGlobalIntentPath(`${scenario.pyeong}평`)}`;
  if (scenario.wallpaper) {
    const slug = LANDING_WALLPAPERS.find((item) => item.key === scenario.wallpaper)?.slug ?? '실크벽지';
    return `${BASE_URL}${getGlobalIntentPath(slug)}`;
  }
  return `${BASE_URL}${getGlobalIntentPath(scenario.building ?? '아파트')}`;
}

export function getLandingMetadata(scenario: LandingScenario) {
  const title = buildTitle(scenario);
  const description = buildDescription(scenario);
  const canonical = buildCanonical(scenario);
  return {
    title: { absolute: title },
    description,
    keywords: [title.replace(' - 도배르만', ''), '도배 견적', '도배 비용', '도배 업체 비교', '2026 도배 가격'],
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article' as const, locale: 'ko_KR' },
  };
}

function getMainRows(scenario: LandingScenario): PricePoint[] {
  const regionId = scenario.region?.region.id;
  const building = scenario.building;
  if (scenario.pyeong) return getPriceTable([scenario.pyeong], regionId, building);
  if (scenario.wallpaper) {
    return INDEXABLE_PYEONGS.map((pyeong) => getPricePoint(pyeong, scenario.wallpaper!, regionId, building)).filter(
      (point): point is PricePoint => Boolean(point),
    );
  }
  return getPriceTable([24, 32, 34], regionId, building);
}

function getLocalLinks(scenario: LandingScenario) {
  if (!scenario.region) return [];
  return INDEXABLE_PYEONGS.map((pyeong) => ({
    label: `${pyeong}평 비용 보기`,
    href: getRegionScenarioPath(scenario.region!, pyeong),
  }));
}

export default function DobaeLandingPage({ scenario, signals }: DobaeLandingPageProps) {
  const title = buildTitle(scenario);
  const description = buildDescription(scenario);
  const canonical = buildCanonical(scenario);
  const local = scenario.region ? getLocalLabel(scenario.region) : '전국';
  const rows = getMainRows(scenario);
  const mainPrice = scenario.pyeong
    ? getPricePoint(scenario.pyeong, scenario.wallpaper ?? 'silk', scenario.region?.region.id, scenario.building)
    : null;
  const selectedWallpaper = scenario.wallpaper;
  const quickLinks = getLocalLinks(scenario);
  const contentUpdated = '2026년 전국 평균 기준';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <JsonLd scenario={scenario} title={title} description={description} canonical={canonical} />

      <main className="pb-20 pt-20 lg:pt-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="현재 위치" className="mb-8 text-sm text-slate-400">
            <Link href="/" className="hover:text-white">도배르만</Link>
            <span className="px-2" aria-hidden="true">/</span>
            <Link href="/quote-calculator" className="hover:text-white">도배 견적 계산기</Link>
            <span className="px-2" aria-hidden="true">/</span>
            <span className="text-slate-300">{local} 도배</span>
          </nav>

          <section className="border-b border-slate-800 pb-12">
            <p className="mb-4 text-sm font-semibold tracking-wide text-blue-300">{contentUpdated} · 기준가 공개</p>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {title.replace(' - 도배르만', '')}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote-request" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-500">
                무료 비교견적 신청
              </Link>
              <Link href="/quote-calculator" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-700 px-6 font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
                내 조건으로 다시 계산
              </Link>
            </div>
          </section>

          <section aria-label="지역 및 서비스 현황" className="grid gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-3">
            <div className="bg-slate-900/90 p-5">
              <p className="text-sm text-slate-400">지역</p>
              <p className="mt-2 text-xl font-bold text-white">{local}</p>
            </div>
            <div className="bg-slate-900/90 p-5">
              <p className="text-sm text-slate-400">등록 도배 업체</p>
              <p className="mt-2 text-xl font-bold text-white">{signals?.vendorCount != null ? `${signals.vendorCount.toLocaleString('ko-KR')}곳` : '집계 중'}</p>
              <p className="mt-1 text-xs text-slate-500">공개 업체 데이터 기준</p>
            </div>
            <div className="bg-slate-900/90 p-5">
              <p className="text-sm text-slate-400">견적 요청 누적</p>
              <p className="mt-2 text-xl font-bold text-white">{signals?.requestCount != null ? `${signals.requestCount.toLocaleString('ko-KR')}건` : '집계 중'}</p>
              <p className="mt-1 text-xs text-slate-500">공개 요청 검색 API 기준</p>
            </div>
          </section>

          {mainPrice && (
            <section className="mt-10 rounded-xl border border-blue-500/30 bg-blue-950/30 p-6 sm:p-8">
              <p className="text-sm font-semibold text-blue-300">빠른 기준가</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{scenario.pyeong}평 {scenario.wallpaper ? LANDING_WALLPAPERS.find((item) => item.key === scenario.wallpaper)?.label : '실크벽지'} 도배</h2>
              <p className="mt-3 text-3xl font-bold text-blue-200 sm:text-4xl">{formatPriceRange(mainPrice.range)}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">지역 보정 기준가 {formatWon(mainPrice.adjustedPrice)}. 철거, 퍼티, 곰팡이 제거, 가구 이동, 천장 높이와 현장 접근성은 별도 반영될 수 있습니다.</p>
            </section>
          )}

          <section className="mt-14">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-300">가격표</p>
                <h2 className="mt-1 text-2xl font-bold text-white">{local} 도배 비용 기준표</h2>
              </div>
              <p className="text-sm text-slate-400">전체 도배·기본 옵션 제외 기준</p>
            </div>
            <PriceTable rows={rows} selectedWallpaper={selectedWallpaper} />
            <p className="mt-3 text-sm leading-6 text-slate-500">기준가는 도배르만 계산기의 2026 전국 평균표에 지역·주거형태 보정값을 적용한 참고값입니다. 실제 계약 전에는 작업 범위와 포함 항목을 업체 견적서로 확인하세요.</p>
          </section>

          <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-bold text-white">가격이 달라지는 항목</h2>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                <li><strong className="text-white">벽지 종류:</strong> 합지보다 실크·천연·수입벽지 순으로 자재비가 높아집니다.</li>
                <li><strong className="text-white">현장 상태:</strong> 기존 벽지 철거, 벽면 보수, 곰팡이 제거가 있으면 추가 작업비가 붙습니다.</li>
                <li><strong className="text-white">주거 형태:</strong> 빌라·단독주택은 층고와 자재 이동 조건에 따라 아파트와 달라질 수 있습니다.</li>
                <li><strong className="text-white">거주 여부:</strong> 가구 이동과 보양이 필요한 거주 중 시공은 공실보다 작업 시간이 늘어날 수 있습니다.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-bold text-white">함께 많이 찾는 조건</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {LANDING_WALLPAPERS.map((item) => (
                  <Link key={item.key} href={getGlobalIntentPath(item.slug)} className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-400 hover:text-white">
                    {item.label} 도배 비용
                  </Link>
                ))}
                {LANDING_BUILDINGS.map((item) => (
                  <Link key={item.slug} href={getGlobalIntentPath(item.slug)} className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-400 hover:text-white">
                    {item.label} 도배
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {quickLinks.length > 0 && (
            <section className="mt-14 border-t border-slate-800 pt-10">
              <h2 className="text-xl font-bold text-white">{local} 평형별 도배 비용</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500/60 hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-14">
            <h2 className="text-2xl font-bold text-white">{local} 도배 자주 묻는 질문</h2>
            <div className="mt-5 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
              <details className="group p-5">
                <summary className="cursor-pointer list-none pr-6 font-semibold text-white">{local} 도배 비용은 어떤 기준으로 계산되나요?</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">평형과 벽지 종류를 기본으로 계산한 뒤 지역, 주거 형태, 천장 높이, 철거·보수 등 추가 작업을 반영합니다. 이 페이지의 범위는 현장 확인 전 예산을 잡기 위한 참고값입니다.</p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none pr-6 font-semibold text-white">계산기에서 나온 금액으로 바로 계약해도 되나요?</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">계산기는 빠른 비교용입니다. 벽면 상태와 가구 이동 여부에 따라 변동될 수 있으므로, 계약 전에는 자재 등급·시공 범위·철거와 보수 포함 여부를 업체와 확인하세요.</p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none pr-6 font-semibold text-white">도배르만에서 업체 비교견적을 신청할 수 있나요?</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">네. 평형, 벽지, 주거 형태, 시공 지역을 입력하면 조건에 맞는 무료 비교견적을 신청할 수 있습니다.</p>
              </details>
            </div>
          </section>

          <section className="mt-14 rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-white">조건을 입력하고 더 정확하게 계산하세요</h2>
                <p className="mt-2 text-sm text-slate-400">방 개수, 천장 높이, 철거·보수·가구 이동까지 반영할 수 있습니다.</p>
              </div>
              <Link href="/quote-calculator" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-500">견적 계산기 열기</Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
