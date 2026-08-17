import Link from 'next/link';
import {
  LANDING_BUILDINGS,
  LANDING_WALLPAPERS,
  INDEXABLE_PYEONGS,
  type LandingScenario,
  type PricePoint,
  formatPriceRange,
  formatWon,
  getFullRegionLabel,
  getGlobalIntentPath,
  getLocalLabel,
  getPricePoint,
  getPriceTable,
  getRegionScenarioPath,
  getRegionSeoPath,
  getSiblingDistricts,
  getSidoPath,
  getRegionUrlLabel,
} from '@/lib/seo/dobaeLanding';
import type { RegionalSignals } from '@/lib/seo/dobaeSignals';
import { robotsMeta } from '@/lib/seo/regionIndexing';

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

function JsonLd({ scenario, title, description, canonical, signals }: {
  scenario: LandingScenario;
  title: string;
  description: string;
  canonical: string;
  signals?: RegionalSignals;
}) {
  // 구조화 데이터의 FAQ 는 화면에 실제로 보이는 문답과 같아야 한다.
  // 다르면 Google 이 구조화 데이터 위반으로 처리한다.
  const areaName = scenario.region ? getFullRegionLabel(scenario.region) : '전국';
  const sidoLabel = scenario.region ? getRegionUrlLabel(scenario.region.region.id) : '지역';
  const vendorAnswer =
    signals?.vendorCount != null && signals.vendorCount > 0
      ? `현재 ${areaName}에 등록된 도배 업체는 ${signals.vendorCount.toLocaleString('ko-KR')}곳입니다.`
      : `${areaName}은 아직 등록 업체 집계가 없습니다. 견적을 요청하시면 인접 지역 업체까지 함께 연결해 드립니다.`;
  const requestAnswer =
    signals?.requestCount != null && signals.requestCount > 0
      ? ` 누적 견적 요청은 ${signals.requestCount.toLocaleString('ko-KR')}건입니다.`
      : '';

  const questions = [
    {
      question: `${areaName}에 등록된 도배 업체는 몇 곳인가요?`,
      answer: `${vendorAnswer}${requestAnswer} 업체 수는 등록 현황에 따라 계속 바뀝니다.`,
    },
    {
      question: `${areaName} 도배 비용은 어떤 기준으로 계산되나요?`,
      answer: `2026 전국 평균표에 ${sidoLabel} 보정계수를 적용한 뒤 평형과 벽지 종류로 계산합니다. 여기에 천장 높이, 철거·보수, 가구 이동 같은 현장 조건이 더해집니다. 이 페이지의 범위는 현장 확인 전 예산을 잡기 위한 참고값입니다.`,
    },
    {
      question: '계산기에서 나온 금액으로 바로 계약해도 되나요?',
      answer: '계산기는 빠른 비교용입니다. 벽면 상태와 가구 이동 여부에 따라 변동될 수 있으므로, 계약 전에는 자재 등급·시공 범위·철거와 보수 포함 여부를 업체와 확인하세요.',
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

/**
 * 지역 규모를 제목·설명에 섞기 위한 꼬리표.
 * 같은 시군구명이 여러 시도에 있어도 시도명 + 실수치로 문자열이 갈린다.
 */
function vendorSuffix(vendorCount?: number | null): string {
  return vendorCount && vendorCount > 0 ? ` · 등록업체 ${vendorCount}곳` : '';
}

function buildTitle(scenario: LandingScenario, vendorCount?: number | null): string {
  // 시도명을 반드시 포함한다. getLocalLabel 만 쓰면 부산 서구와 대구 서구의
  // 제목이 완전히 같아져 Google 이 중복으로 판단한다.
  const local = scenario.region ? getFullRegionLabel(scenario.region) : null;
  if (local && scenario.pyeong) {
    return `${local} ${scenario.pyeong}평 도배 비용 | 2026 기준가${vendorSuffix(vendorCount)} - 도배르만`;
  }
  if (local) return `${local} 도배 견적 | 평수별 비용${vendorSuffix(vendorCount)} - 도배르만`;
  if (scenario.pyeong) return `${scenario.pyeong}평 아파트 도배 비용 | 합지·실크 가격 비교 - 도배르만`;
  if (scenario.wallpaper) {
    const label = LANDING_WALLPAPERS.find((item) => item.key === scenario.wallpaper)?.label ?? '벽지';
    return `${label} 도배 비용 | 평수별 시공 가격·견적 비교 - 도배르만`;
  }
  const building = LANDING_BUILDINGS.find((item) => item.slug === scenario.building)?.label ?? '주거공간';
  return `${building} 도배 비용 | 평수별 가격·업체 비교 - 도배르만`;
}

function buildDescription(scenario: LandingScenario, signals?: RegionalSignals): string {
  const local = scenario.region ? getFullRegionLabel(scenario.region) : '전국';
  const pyeong = scenario.pyeong ? `${scenario.pyeong}평 ` : '';
  const wallpaper = scenario.wallpaper
    ? `${LANDING_WALLPAPERS.find((item) => item.key === scenario.wallpaper)?.label ?? '벽지'} `
    : '합지·실크 벽지 ';
  const building = scenario.building ? `${scenario.building} ` : '';

  // 지역별로 다른 실수치를 문장에 넣어 설명문이 서로 겹치지 않게 한다.
  const facts: string[] = [];
  if (signals?.vendorCount != null && signals.vendorCount > 0) {
    facts.push(`등록 업체 ${signals.vendorCount.toLocaleString('ko-KR')}곳`);
  }
  if (signals?.requestCount != null && signals.requestCount > 0) {
    facts.push(`누적 견적 요청 ${signals.requestCount.toLocaleString('ko-KR')}건`);
  }
  const factText = facts.length > 0 ? ` ${local} ${facts.join(', ')} 기준입니다.` : '';

  return `${local} ${pyeong}${building}${wallpaper}도배 비용을 2026 전국 평균 단가에 지역 보정을 적용해 확인하세요.${factText} 평형별 기준가와 예상 범위, 무료 비교견적 신청을 한 페이지에서 볼 수 있습니다.`;
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

export interface LandingMetaOptions {
  signals?: RegionalSignals;
  /** false 면 noindex,follow 를 준다. 실데이터가 없는 지역 페이지가 여기 해당한다. */
  indexable?: boolean;
}

export function getLandingMetadata(scenario: LandingScenario, options: LandingMetaOptions = {}) {
  const { signals, indexable = true } = options;
  const title = buildTitle(scenario, signals?.vendorCount);
  const description = buildDescription(scenario, signals);
  const canonical = buildCanonical(scenario);
  return {
    title: { absolute: title },
    description,
    keywords: [title.replace(' - 도배르만', ''), '도배 견적', '도배 비용', '도배 업체 비교', '2026 도배 가격'],
    alternates: { canonical },
    robots: robotsMeta(indexable),
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
  const title = buildTitle(scenario, signals?.vendorCount);
  const description = buildDescription(scenario, signals);
  const canonical = buildCanonical(scenario);
  // 화면 문구도 시도명을 포함한 전체 지역명으로 통일한다.
  const local = scenario.region ? getFullRegionLabel(scenario.region) : '전국';
  const siblings = scenario.region ? getSiblingDistricts(scenario.region) : [];
  const sidoLabel = scenario.region ? getRegionUrlLabel(scenario.region.region.id) : null;
  const rows = getMainRows(scenario);
  const mainPrice = scenario.pyeong
    ? getPricePoint(scenario.pyeong, scenario.wallpaper ?? 'silk', scenario.region?.region.id, scenario.building)
    : null;
  const selectedWallpaper = scenario.wallpaper;
  const quickLinks = getLocalLinks(scenario);
  const contentUpdated = '2026년 전국 평균 기준';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <JsonLd scenario={scenario} title={title} description={description} canonical={canonical} signals={signals} />

      <main className="pb-20 pt-20 lg:pt-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* 홈 → 지역 허브 → 시도 → 현재 페이지로 이어지는 계층.
              지역 페이지가 sitemap 으로만 발견되던 고아 구조를 끊는다. */}
          <nav aria-label="현재 위치" className="mb-8 text-sm text-slate-400">
            <Link href="/" className="hover:text-white">도배르만</Link>
            <span className="px-2" aria-hidden="true">/</span>
            <Link href="/regional-guide" className="hover:text-white">지역별 도배</Link>
            {scenario.region && sidoLabel && (
              <>
                <span className="px-2" aria-hidden="true">/</span>
                <Link href={getSidoPath(scenario.region.region.id)} className="hover:text-white">
                  {sidoLabel}
                </Link>
              </>
            )}
            <span className="px-2" aria-hidden="true">/</span>
            <span className="text-slate-300">{scenario.region ? getLocalLabel(scenario.region) : '전국'} 도배</span>
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

          {/* 같은 시도의 다른 시군구로 가로 연결. 지역마다 목록이 달라
              페이지 간 본문 중복도 함께 낮아진다. */}
          {siblings.length > 0 && sidoLabel && (
            <section className="mt-14 border-t border-slate-800 pt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-xl font-bold text-white">{sidoLabel} 다른 지역 도배 비용</h2>
                <Link
                  href={getSidoPath(scenario.region!.region.id)}
                  className="text-sm font-semibold text-blue-300 hover:text-blue-200"
                >
                  {sidoLabel} 전체 지역 보기 →
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {siblings.map((sibling) => (
                  <Link
                    key={sibling.href}
                    href={sibling.href}
                    className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-400 hover:text-white"
                  >
                    {sibling.name} 도배
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-14">
            <h2 className="text-2xl font-bold text-white">{local} 도배 자주 묻는 질문</h2>
            <div className="mt-5 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
              {/* 첫 문답은 해당 지역의 실제 집계를 인용해 지역마다 내용이 달라진다. */}
              <details className="group p-5">
                <summary className="cursor-pointer list-none pr-6 font-semibold text-white">{local}에 등록된 도배 업체는 몇 곳인가요?</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {signals?.vendorCount != null && signals.vendorCount > 0
                    ? `현재 ${local}에 등록된 도배 업체는 ${signals.vendorCount.toLocaleString('ko-KR')}곳입니다.`
                    : `${local}은 아직 등록 업체 집계가 없습니다. 견적을 요청하시면 인접 지역 업체까지 함께 연결해 드립니다.`}
                  {signals?.requestCount != null && signals.requestCount > 0
                    ? ` 누적 견적 요청은 ${signals.requestCount.toLocaleString('ko-KR')}건입니다.`
                    : ''}
                  {' '}업체 수는 등록 현황에 따라 계속 바뀝니다.
                </p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none pr-6 font-semibold text-white">{local} 도배 비용은 어떤 기준으로 계산되나요?</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  2026 전국 평균표에 {sidoLabel ?? '지역'} 보정계수를 적용한 뒤 평형과 벽지 종류로 계산합니다. 여기에 천장 높이, 철거·보수, 가구 이동 같은 현장 조건이 더해집니다. 이 페이지의 범위는 현장 확인 전 예산을 잡기 위한 참고값입니다.
                </p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none pr-6 font-semibold text-white">계산기에서 나온 금액으로 바로 계약해도 되나요?</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">계산기는 빠른 비교용입니다. 벽면 상태와 가구 이동 여부에 따라 변동될 수 있으므로, 계약 전에는 자재 등급·시공 범위·철거와 보수 포함 여부를 업체와 확인하세요.</p>
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
