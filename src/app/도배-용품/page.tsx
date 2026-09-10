// 도배 용품 — 쿠팡 파트너스 상품 소개 페이지 (소비자 사이트)
//
// 상품은 사장님 사이트 /boss/store 에서 운영자가 담는다. 여기서는 읽기만 한다.
// 링크는 파트너스 딥링크라 이 페이지를 거쳐 사면 수수료가 잡힌다.
// 쿠팡 파트너스 규정: 고지 문구를 눈에 띄게, 가격은 달라질 수 있음을 알린다.

import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBagIcon, ArrowRightIcon, CalculatorIcon, FileTextIcon } from 'lucide-react';
import { fetchStoreCatalog } from '@/lib/api/store';
import { COUPANG_PARTNERS_NOTICE } from '@/types/store';
import { encodePath } from '@/lib/seo/dobaeLanding';
import StoreCatalogView from './StoreCatalogView';

// Next.js 16.3.x 가 한글 라우트 경로(정적/ISR 페이지)를 빌드 타임에 미리 그릴 때
// InvalidCharacterError 로 빌드가 죽는 버그가 있어(원인은 Next.js 내부, 이 페이지
// 콘텐츠와 무관 — 같은 증상이 한글 경로 페이지 전반에서 재현됨) ISR(10분 캐시) 대신
// 매 요청마다 그리는 동적 렌더링으로 우회한다. 카탈로그가 항상 최신으로 보이는 효과는
// 있지만 캐시 이점은 없다 — Next.js 가 고치면 revalidate = 600 으로 되돌리면 된다.
export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';

export const metadata: Metadata = {
  title: '도배 용품 추천 | 벽지 · 풀 · 초배지 · 도배 공구 - 도배르만',
  description:
    '셀프 도배와 현장 시공에 필요한 벽지, 도배풀, 초배지, 부직포, 도배 공구를 한눈에 모았습니다. 도배 전문가가 고른 용품을 쿠팡에서 바로 확인하세요.',
  keywords: '도배용품, 셀프도배, 도배풀, 초배지, 부직포, 도배공구, 벽지추천, 도배준비물, 도배세트',
  openGraph: {
    title: '도배 용품 추천 | 벽지 · 풀 · 초배지 · 도배 공구 - 도배르만',
    description: '셀프 도배와 현장 시공에 필요한 도배 용품을 한눈에.',
    type: 'website',
    locale: 'ko_KR',
    url: `${BASE_URL}${encodePath('/도배-용품')}`,
  },
  alternates: { canonical: `${BASE_URL}${encodePath('/도배-용품')}` },
};

export default async function StorePage() {
  const catalog = await fetchStoreCatalog();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 히어로 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 pt-20 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/25">
              <ShoppingBagIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                도배 용품
              </span>
              <br />
              <span className="text-xl font-normal text-slate-300 md:text-3xl">
                도배 전문가가 고른 벽지 · 풀 · 초배지 · 공구
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              셀프 도배를 준비하거나 현장에서 바로 필요한 용품을 모았습니다. 쿠팡에서 가격과 후기를 확인하고 바로
              주문하세요.
            </p>

            {/* 쿠팡 파트너스 고지 — 규정상 눈에 띄는 자리에 */}
            <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {COUPANG_PARTNERS_NOTICE}
            </p>
          </div>
        </div>
      </section>

      {/* 상품 */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <StoreCatalogView catalog={catalog} />
        </div>
      </section>

      {/* 다음 행동 — 도배는 결국 견적이다 */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            <Link
              href="/quote-request"
              className="group flex items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-5 transition-colors hover:border-blue-400/60 hover:bg-slate-800"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
                <FileTextIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">직접 하기 어렵다면 무료 견적</p>
                <p className="text-sm text-slate-400">전국 도배 전문가에게 비교 견적을 받아 보세요.</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-blue-300" />
            </Link>
            <Link
              href="/quote-calculator"
              className="group flex items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-5 transition-colors hover:border-purple-400/60 hover:bg-slate-800"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                <CalculatorIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">도배 비용 계산기</p>
                <p className="text-sm text-slate-400">평수와 벽지 종류로 예상 비용을 바로 계산합니다.</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-purple-300" />
            </Link>
          </div>
          <p className="mx-auto mt-8 max-w-4xl text-center text-xs leading-relaxed text-slate-500">
            상품 가격과 배송 정보는 등록 시점 기준이며 쿠팡에서 달라질 수 있습니다. 구매는 쿠팡에서 이루어지며, 도배르만은
            판매 · 배송 · 교환에 관여하지 않습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
