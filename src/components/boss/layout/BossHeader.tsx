'use client';

// 사장님 헤더 — Industry 패턴 (agent.opentohome.com 의 main > header)
//
//   sticky · 면색 95% + blur · 하단 보더 · padding 20px 28px 16px
//   좌: kicker(10px 대문자 "사장님 센터" 또는 `← 상위 화면`) / 제목 26px Barlow Condensed / 설명 12.5px
//   우: 회사 태그(md↑) → 검색(등록한 화면만) → 보조 버튼 → 주요 버튼(accent)
//
// 제목·부제·버튼은 nav.ts 의 PAGE_META 가 정한다. 페이지 안에 h1 을 두지 않는다.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { CONTENT_MAX_WIDTH, getPageMeta } from './nav';
import { useBossSearchBar } from './BossSearchContext';
import { useBossPortal } from './BossPortalContext';

export default function BossHeader() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const search = useBossSearchBar();
  const { company } = useBossPortal();
  // 컨텍스트 객체 안에 inputRef 가 있어 react-hooks/refs 규칙이 객체 전체를 ref 로 오인한다 —
  // 렌더에서 쓰는 값만 먼저 풀어 둔다(ref 는 <input ref maxLength={100}> 에 넘기기만 하고 .current 는 읽지 않는다).
  const searchPlaceholder = search?.placeholder ?? null;
  const searchQuery = search?.query ?? '';
  const setSearchQuery = search?.setQuery;
  const searchInputRef = search?.inputRef;

  const kicker = 'text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-text-muted';

  return (
    <header className="sticky top-[53px] z-30 border-b border-boss-border bg-boss-bg/95 px-5 pb-4 pt-5 backdrop-blur sm:px-7 lg:top-0">
      {/* 면색·하단 보더는 화면 전체 폭을 유지하고, 내용만 본문과 같은 폭으로 가운데 정렬한다 */}
      <div
        className={`flex w-full ${CONTENT_MAX_WIDTH[meta.width ?? 'full']} flex-wrap items-end justify-between gap-x-6 gap-y-3`}
      >
        <div className="min-w-0">
          {meta.back ? (
            <Link
              href={meta.back.href}
              className={`${kicker} inline-flex items-center gap-1 !text-boss-text-muted hover:!text-boss-text`}
            >
              <span aria-hidden>←</span> {meta.back.label}
            </Link>
          ) : (
            <div className={kicker}>사장님 센터</div>
          )}
          <h1 className="mt-0.5 truncate font-boss-head text-[22px] font-semibold leading-tight tracking-[-0.015em] text-boss-text sm:text-[26px]">
            {meta.title}
          </h1>
          {meta.subtitle && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
              {meta.subtitle}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* 회사명·사업자번호 — 사장님이 늘 보고 있어야 하는 표시 항목 */}
          {company?.name && (
            <span className="hidden max-w-[320px] items-center truncate border border-boss-border bg-boss-surface px-2.5 py-[5px] text-[12px] text-boss-text-dim md:inline-flex">
              {company.name}
              {company.bizno ? ` · ${company.bizno}` : ''}
            </span>
          )}

          {/* 전역 검색 — 페이지가 useBossSearch 로 등록했을 때만 노출 */}
          {searchPlaceholder && (
            <div className="relative w-full sm:w-[240px]">
              <Search
                size={14}
                strokeWidth={1.75}
                className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-boss-text-muted"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="boss-input pl-[30px] pr-8"
                maxLength={50}
              />
              <kbd className="pointer-events-none absolute right-[9px] top-1/2 hidden -translate-y-1/2 border border-boss-border px-[5px] py-px font-boss-head text-[11px] text-boss-text-muted sm:block">
                /
              </kbd>
            </div>
          )}

          <Link
            href="/boss/notifications"
            aria-label="알림"
            title="알림"
            className={`grid h-[34px] w-[34px] place-items-center border transition-colors ${
              pathname?.startsWith('/boss/notifications')
                ? 'border-boss-primary bg-boss-elevated !text-boss-primary'
                : 'border-boss-border bg-boss-surface !text-boss-text-dim hover:border-boss-border-hover hover:!text-boss-text'
            }`}
          >
            <Bell size={15} strokeWidth={1.75} />
          </Link>

          {meta.secondary && (
            <Link href={meta.secondary.href} className="boss-btn boss-btn-md boss-btn-secondary">
              {meta.secondary.label}
            </Link>
          )}
          {meta.action && (
            <Link href={meta.action.href} className="boss-btn boss-btn-md boss-btn-primary">
              {meta.action.label}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
