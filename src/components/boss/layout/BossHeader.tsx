'use client';

// 사장님 상단바 — onGo 리디자인 시안
// height 56px / bg #181a27 / border-bottom #23263c / padding 0 18px / gap 14px
//
// 좌: 화면 제목 14px/600 + 부제 12px #6c7093 (ellipsis)
// 우: 검색 240px(`/` 키캡) → 보조 버튼 → 주요 버튼(accent)
//
// 시안 주의: 상단바 요소는 모두 white-space: nowrap.
//   한국어 버튼 라벨이 글자 단위로 줄바꿈되는 문제가 있었다.
//
// 로고와 계정 메뉴는 시안대로 좌측 레일에 있다. 모바일에서만 상단바에 유지한다.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bell, Menu, X, HelpCircle, Search } from 'lucide-react';
import { SECTIONS, isNavActive, getPageMeta } from './nav';
import { useBossSearchBar } from './BossSearchContext';

export default function BossHeader() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const meta = getPageMeta(pathname);
  const search = useBossSearchBar();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="flex h-14 flex-none items-center gap-3.5 border-b border-boss-border bg-boss-shell px-4 md:px-[18px]">
        {/* 모바일 햄버거 */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="-ml-1 inline-flex flex-none rounded-chip p-1.5 text-boss-text-muted transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:text-boss-text md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu size={18} />
        </button>

        {/* 화면 제목 / 부제 */}
        <h1 className="flex-none whitespace-nowrap text-[14px] font-semibold text-boss-text">
          {meta.title}
        </h1>
        {meta.subtitle && (
          <p className="hidden min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-boss-text-muted lg:block">
            {meta.subtitle}
          </p>
        )}

        <div className="min-w-2 flex-1" />

        {/* 전역 검색 — 페이지가 useBossSearch 로 등록했을 때만 노출 */}
        {search?.placeholder && (
          <div className="relative hidden w-60 flex-[0_1_240px] sm:block" style={{ minWidth: 92 }}>
            <Search
              size={13}
              className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-boss-text-muted"
            />
            <input
              ref={search.inputRef}
              type="text"
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              placeholder={search.placeholder}
              className="h-[34px] w-full rounded-[8px] border border-boss-border-soft bg-transparent pl-[30px] pr-8 text-[12px] text-boss-text outline-none transition-colors duration-[120ms] ease-out placeholder:text-boss-text-muted focus:border-boss-border-hover"
            />
            <kbd className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 rounded-[4px] border border-boss-border-strong px-[5px] py-px font-boss-mono text-[10px] text-boss-text-muted">
              /
            </kbd>
          </div>
        )}

        {/* 우측 액션 */}
        <div className="flex flex-none items-center gap-1.5">
          <Link
            href="/boss/help"
            className="hidden rounded-chip p-1.5 !text-boss-text-muted transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:!text-boss-text md:inline-flex"
            aria-label="도움말"
          >
            <HelpCircle size={16} />
          </Link>
          <Link
            href="/boss/notifications"
            className="rounded-chip p-1.5 !text-boss-text-muted transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:!text-boss-text"
            aria-label="알림"
          >
            <Bell size={16} />
          </Link>

          {meta.secondary && (
            <Link
              href={meta.secondary.href}
              className="boss-btn boss-btn-md boss-btn-secondary ml-1 hidden md:inline-flex"
            >
              {meta.secondary.label}
            </Link>
          )}
          {meta.action && (
            <Link href={meta.action.href} className="boss-btn boss-btn-md boss-btn-primary ml-0.5">
              {meta.action.label}
            </Link>
          )}
        </div>
      </header>

      {/* 모바일 내비게이션 오버레이 */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <nav className="boss-scroll absolute left-0 top-0 h-full w-[260px] overflow-y-auto border-r border-boss-border bg-boss-rail px-3 py-4">
            <div className="mb-[18px] flex items-center justify-between px-2">
              <Link
                href="/boss"
                className="flex items-center gap-[9px]"
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="h-[22px] w-[22px] rounded-[6px] bg-boss-primary" />
                <span className="text-[16px] font-bold tracking-[-0.01em] !text-boss-text">
                  도배르만
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-chip p-1.5 text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
                aria-label="메뉴 닫기"
              >
                <X size={16} />
              </button>
            </div>

            {SECTIONS.map((section, idx) => (
              <div key={section.title} className={idx > 0 ? 'mt-[18px]' : ''}>
                <p className="boss-mono-label mb-1.5 px-[9px]">{section.title}</p>
                <div className="flex flex-col gap-0.5">
                  {section.items.map(({ href, label, icon: Icon, exact, exclude }) => {
                    const active = isNavActive(pathname, href, exact, exclude);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileNavOpen(false)}
                        // 모바일 터치 타겟 44px 이상 (시안 모바일 규칙)
                        className={`flex min-h-[44px] items-center gap-2.5 rounded-[8px] px-[9px] py-2 text-[13px] transition-colors duration-[120ms] ease-out ${
                          active
                            ? 'bg-[var(--boss-ac-dim)] font-bold !text-white shadow-[inset_0_0_0_1px_rgb(var(--boss-border-strong))]'
                            : 'font-medium !text-boss-text-tertiary hover:bg-boss-hover hover:!text-white'
                        }`}
                      >
                        <Icon
                          size={16}
                          className={active ? 'text-boss-primary' : 'opacity-75'}
                        />
                        <span className="truncate">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
