'use client';

// 도배 용품 — 분류 탭 + 상품 카드. 서버가 넘긴 목록을 그리기만 한다.
// "쿠팡에서 보기"는 새 창으로 파트너스 링크를 열고, 클릭 수만 조용히 센다.

import { useMemo, useState } from 'react';
import { ExternalLinkIcon, PackageIcon, RocketIcon, TruckIcon } from 'lucide-react';
import { storeApi } from '@/lib/api/store';
import { STORE_CATEGORY_ORDER, type StoreCatalog, type StoreProduct } from '@/types/store';

function won(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '';
  return `${n.toLocaleString('ko-KR')}원`;
}

export default function StoreCatalogView({ catalog }: { catalog: StoreCatalog }) {
  const [tab, setTab] = useState<string>('ALL');

  const categories = useMemo(() => {
    const byCode = new Map(catalog.categories.map((c) => [c.code, c]));
    return STORE_CATEGORY_ORDER.map((code) => byCode.get(code)).filter(
      (c): c is NonNullable<typeof c> => !!c && c.count > 0
    );
  }, [catalog.categories]);

  const products = useMemo(
    () => (tab === 'ALL' ? catalog.products : catalog.products.filter((p) => p.categoryCode === tab)),
    [catalog.products, tab]
  );

  if (catalog.products.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-800/60 px-6 py-14 text-center">
        <PackageIcon className="mx-auto mb-3 h-10 w-10 text-slate-500" />
        <p className="text-lg font-semibold text-white">상품을 준비하고 있습니다</p>
        <p className="mt-1 text-sm text-slate-400">도배 전문가가 고른 용품을 곧 소개합니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* 분류 탭 */}
      <div className="mb-6 flex flex-wrap justify-center gap-2" role="tablist" aria-label="상품 분류">
        <TabButton active={tab === 'ALL'} onClick={() => setTab('ALL')}>
          전체 <span className="ml-1 text-xs opacity-70">{catalog.products.length}</span>
        </TabButton>
        {categories.map((c) => (
          <TabButton key={c.code} active={tab === c.code} onClick={() => setTab(c.code)}>
            {c.label} <span className="ml-1 text-xs opacity-70">{c.count}</span>
          </TabButton>
        ))}
      </div>

      {/* 상품 카드 */}
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-blue-400 bg-blue-500/20 text-white'
          : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({ product: p }: { product: StoreProduct }) {
  const onOpen = () => {
    // 집계는 실패해도 그만 — 링크 이동을 막지 않는다
    void storeApi.click(p.id).catch(() => {});
  };
  return (
    <a
      href={p.productUrl}
      target="_blank"
      rel="nofollow sponsored noopener"
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/60 transition-colors hover:border-blue-400/60 hover:bg-slate-800"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {p.productImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- 쿠팡 CDN 이미지, 도메인이 고정되지 않는다
          <img
            src={p.productImage}
            alt={p.productName}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <PackageIcon className="h-10 w-10" />
          </div>
        )}
        {(p.isRocket || p.isFreeShipping) && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {p.isRocket && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                <RocketIcon className="h-3 w-3" /> 로켓배송
              </span>
            )}
            {p.isFreeShipping && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                <TruckIcon className="h-3 w-3" /> 무료배송
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-blue-300">{p.categoryLabel}</p>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white">{p.productName}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-base font-bold text-white sm:text-lg">{won(p.productPrice) || '가격 보기'}</p>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 group-hover:text-blue-300">
            쿠팡 <ExternalLinkIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </a>
  );
}
