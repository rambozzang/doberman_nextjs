'use client';

// 사장님 헤더 — Industry 패턴 (agent.opentohome.com 의 main > header)
//
//   sticky · 면색 95% + blur · 하단 보더 · padding 20px 28px 16px
//   좌: kicker(10px 대문자 "사장님 센터" 또는 `← 상위 화면`) / 제목 26px Barlow Condensed / 설명 12.5px
//   우: 회사 태그(md↑) → 검색(등록한 화면만) → 종(md↑) → 보조 버튼 → 주요 버튼(accent)
//   휴대폰 · 좁은 태블릿(md 미만): 종은 제목 줄 오른쪽 — 예전엔 종 하나가 제목 아래 한 줄(약 50px)을 혼자 차지했다(2026-10-21).
//
// 제목·부제·버튼은 nav.ts 의 PAGE_META 가 정한다. 페이지 안에 h1 을 두지 않는다.
// 문서를 읽어야 제목이 정해지는 화면(세금계산서 상세 · 미리보기 · 수정 — 현금영수증이면 '현금영수증')은 useBossHeaderTitle 로 바꾼다.

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { formatBizNo } from '@/lib/boss/bizno';
import { CONTENT_MAX_WIDTH, getPageMeta } from './nav';
import { useBossSearchBar } from './BossSearchContext';
import { useBossPortal } from './BossPortalContext';

// ── 화면이 정하는 머리 제목(2026-10-21) ──
// 경로를 함께 적어 두어 화면을 옮기면 저절로 무시된다(다른 화면 제목을 덮지 않는다).
type HeaderTitle = { path: string; title: string; subtitle?: string };
let headerTitle: HeaderTitle | null = null;
const headerTitleListeners = new Set<() => void>();
function subscribeHeaderTitle(listener: () => void) {
  headerTitleListeners.add(listener);
  return () => {
    headerTitleListeners.delete(listener);
  };
}
function setHeaderTitle(next: HeaderTitle | null) {
  headerTitle = next;
  headerTitleListeners.forEach((l) => l());
}

/** 이 화면의 머리 제목 · 부제를 바꾼다. title 이 null 이면 PAGE_META 그대로 둔다 */
export function useBossHeaderTitle(title: string | null, subtitle?: string) {
  const pathname = usePathname();
  useEffect(() => {
    if (!title || !pathname) return;
    const mine: HeaderTitle = { path: pathname, title, subtitle };
    setHeaderTitle(mine);
    return () => {
      if (headerTitle === mine) setHeaderTitle(null);
    };
  }, [pathname, title, subtitle]);
}

export default function BossHeader() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const override = useSyncExternalStore(subscribeHeaderTitle, () => headerTitle, () => null);
  const own = override && override.path === pathname ? override : null;
  // 고객 등록 화면은 ?id= 가 붙으면 수정 화면이다 — 제목 · 부제를 바꿔 준다.
  // useSearchParams 를 쓰면 셸 전체가 Suspense 를 요구해 다른 화면의 사전 렌더가 깨진다.
  const [hasQueryId, setHasQueryId] = useState(false);
  useEffect(() => {
    setHasQueryId(new URLSearchParams(window.location.search).has('id'));
  }, [pathname]);
  const editingCustomer = pathname === '/boss/customers/new' && hasQueryId;
  // 세금계산서 · 현금영수증 수정(?id=) — 문서를 읽기 전에는 종류를 몰라 '문서 수정', 읽으면 화면이 종류에 맞게 바꾼다
  const editingTaxInvoice = pathname === '/boss/tax-invoice/new' && hasQueryId;
  const title = own?.title ?? (editingCustomer ? '고객 수정' : editingTaxInvoice ? '문서 수정' : meta.title);
  const subtitle = own
    ? (own.subtitle ?? meta.subtitle)
    : editingCustomer
      ? '등록한 고객 정보를 고칩니다.'
      : editingTaxInvoice
        ? '저장한 문서를 고칩니다. 저장은 발급이 아닙니다.'
        : meta.subtitle;
  const search = useBossSearchBar();
  const { company } = useBossPortal();
  // 컨텍스트 객체 안에 inputRef 가 있어 react-hooks/refs 규칙이 객체 전체를 ref 로 오인한다 —
  // 렌더에서 쓰는 값만 먼저 풀어 둔다(ref 는 <input ref maxLength={100}> 에 넘기기만 하고 .current 는 읽지 않는다).
  const searchPlaceholder = search?.placeholder ?? null;
  const searchQuery = search?.query ?? '';
  const setSearchQuery = search?.setQuery;
  const searchInputRef = search?.inputRef;

  const kicker = 'text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-text-muted';
  // 휴대폰에서 오른쪽 묶음에 남는 것이 없으면(종은 제목 줄로 옮겼다) 빈 줄이 생기지 않게 숨긴다
  const hasPhoneTools = Boolean(searchPlaceholder || meta.secondary || meta.action);
  const notificationsActive = pathname?.startsWith('/boss/notifications');
  // 종 단추 — display 로 휴대폰(제목 줄) · 넓은 화면(오른쪽 묶음) 중 한 곳에만 보인다. 손가락 화면은 44px(boss-header-icon)
  const bell = (display: string) => (
    <Link
      href="/boss/notifications"
      aria-label="알림"
      title="알림"
      className={`boss-header-icon ${display} h-[34px] w-[34px] flex-none place-items-center border transition-colors ${
        notificationsActive
          ? 'border-boss-primary bg-boss-elevated !text-boss-primary'
          : 'border-boss-border bg-boss-surface !text-boss-text-dim hover:border-boss-border-hover hover:!text-boss-text'
      }`}
    >
      <Bell size={15} strokeWidth={1.75} />
    </Link>
  );

  return (
    // 휴대폰 · 태블릿(lg 미만)은 고정하지 않는다 — 위 막대 · 이 머리 · 아래 메뉴가 화면의 34%를 덮어
    // 내리면 입력칸이 머리 밑에 깔렸다(2026-10-17 세금계산서 점검). 넓은 화면만 위에 붙여 둔다.
    <header className="relative z-30 border-b border-boss-border bg-boss-bg/95 px-5 pb-4 pt-5 backdrop-blur sm:px-7 lg:sticky lg:top-0">
      {/* 면색·하단 보더는 화면 전체 폭을 유지하고, 내용만 본문과 같은 폭으로 가운데 정렬한다 */}
      <div
        className={`flex w-full ${CONTENT_MAX_WIDTH[meta.width ?? 'full']} flex-wrap items-end justify-between gap-x-6 gap-y-3`}
      >
        {/* 휴대폰은 제목 묶음이 한 줄을 다 쓴다(종이 제목 줄 오른쪽 끝에 붙는다). 넓은 화면은 예전처럼 글자 폭만큼 */}
        <div className="w-full min-w-0 md:w-auto">
          {meta.back ? (
            <Link
              href={meta.back.href}
              className={`${kicker} boss-header-back inline-flex items-center gap-1 !text-boss-text-muted hover:!text-boss-text`}
            >
              <span aria-hidden>←</span> {meta.back.label}
            </Link>
          ) : (
            // 구역 머리글(도배르만 운영 등)은 accent 색으로 — 일반 사장님 화면과 구분된다
            meta.kicker ? (
              <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-primary">{meta.kicker}</div>
            ) : (
              <div className={kicker}>사장님 센터</div>
            )
          )}
          <div className="mt-0.5 flex items-center gap-3">
            <h1 className="min-w-0 flex-1 truncate font-boss-head text-[22px] font-semibold leading-tight tracking-[-0.015em] text-boss-text sm:text-[26px]">
              {title}
            </h1>
            {bell('grid md:hidden')}
          </div>
          {subtitle && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`${hasPhoneTools ? 'flex' : 'hidden md:flex'} min-w-0 flex-wrap items-center gap-2`}>
          {/* 회사명·사업자번호 — 사장님이 늘 보고 있어야 하는 표시 항목 */}
          {company?.name && (
            <span className="hidden max-w-[320px] items-center truncate border border-boss-border bg-boss-surface px-2.5 py-[5px] text-[12px] text-boss-text-dim md:inline-flex">
              {company.name}
              {/* 사업자번호는 어디서나 000-00-00000 으로(2026-10-17 — 머리만 숫자 10자리로 보였다) */}
              {company.bizno ? ` · ${formatBizNo(company.bizno)}` : ''}
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

          {bell('hidden md:grid')}

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
