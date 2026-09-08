'use client';

// 사장님 좌측 레일 — Industry 패턴 (agent.opentohome.com 의 Rail)
//
//   폭 236px · 바탕 #1d2d3d(accent-900) · 글자 #f5f5f8
//   워드마크 19px/700 tracking .06em + 10px 대문자 부제(55%)
//   항목 14px, 좌측 3px 활성 선 #94bce3 + 흰 14% 배경 / 비활성 75% / hover 흰 10%
//   하단: 플랜 카드(테두리 25%) → 사각 아바타 + 이름/역할 → 로그아웃(테두리)
//
// 좁은 화면(<lg)에서는 상단 네이비 바(워드마크 + 메뉴 버튼)가 되고,
// 메뉴 버튼이 같은 내비를 담은 서랍을 연다.

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Menu, X } from 'lucide-react';
import { useBossAuth } from '@/hooks/useBossAuth';
import { SECTIONS, isNavActive, type NavItem, type NavSection } from './nav';
import { currentBossIsAdmin } from '@/lib/boss/admin';
import { useBossPortal } from './BossPortalContext';
import type { BossSubscriptionStatusResponse } from '@/types/boss-billing';

const RAIL = 'bg-boss-rail text-boss-rail-text';

export default function BossSidebar() {
  const pathname = usePathname();
  const sections = useVisibleSections();
  const router = useRouter();
  const { bossAuth, bossLogout } = useBossAuth();
  const { subscription } = useBossPortal();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // 서랍이 열려 있는 동안 뒤 화면 스크롤을 막는다
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    bossLogout();
    router.replace('/boss/login');
  };

  // 이름은 localStorage(useBossAuth 의 동기 초기값)에서 오므로 서버 HTML 에는 없다.
  // hydration 이 끝나기 전에는 서버와 같은 기본값을 그려 "홍 ≠ 사" 불일치 경고를 막는다.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const displayName = hydrated
    ? (bossAuth.userInfo?.name ?? bossAuth.userInfo?.nickNm ?? bossAuth.userId ?? '사장님')
    : '사장님';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* ── 데스크톱 레일 ── */}
      <aside
        className={`${RAIL} hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-5 lg:py-[22px]`}
      >
        <Wordmark />

        <nav aria-label="사장님 메뉴" className="boss-rail-scroll min-h-0 flex-1 overflow-y-auto">
          {sections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? 'mt-2.5' : ''}>
              <p className="px-5 pb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-rail-text/45">
                {section.title}
              </p>
              {section.items.map((item) => (
                <RailLink
                  key={item.href}
                  item={item}
                  active={isNavActive(pathname, item.href, item.exact, item.exclude)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-3 px-5">
          {/* 낮은 화면(노트북)에서는 카드를 접어 내비가 먼저 보이게 한다 */}
          {/* 결제 기능이 열릴 때까지 구독 카드를 감춘다 */}
          {/* <PlanCard sub={subscription} className="[@media(max-height:860px)]:hidden" /> */}
          <div className="flex items-center justify-between gap-2">
            <AccountRow name={displayName} initial={initial} />
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 border border-boss-rail-text/25 px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-white/10"
            >
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* ── 모바일 상단 바 ── */}
      <div className={`${RAIL} sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 lg:hidden`}>
        <Wordmark compact />
        <div className="flex items-center gap-2">
          <PlanChip sub={subscription} />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            aria-expanded={drawerOpen}
            className="-mr-1 grid h-9 w-9 place-items-center border border-boss-rail-text/25 transition-colors hover:bg-white/10"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ── 모바일 서랍 ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-boss-text/50" onClick={() => setDrawerOpen(false)} />
          <nav
            aria-label="사장님 메뉴"
            className={`${RAIL} absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col gap-4 overflow-hidden py-[22px]`}
          >
            <div className="flex items-start justify-between pr-5">
              <Wordmark />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="메뉴 닫기"
                className="-mr-2 -mt-1 grid h-9 w-9 place-items-center transition-colors hover:bg-white/10"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="boss-rail-scroll min-h-0 flex-1 overflow-y-auto">
              {sections.map((section, idx) => (
                <div key={section.title} className={idx > 0 ? 'mt-4' : ''}>
                  <p className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-rail-text/45">
                    {section.title}
                  </p>
                  {section.items.map((item) => (
                    <RailLink
                      key={item.href}
                      item={item}
                      active={isNavActive(pathname, item.href, item.exact, item.exclude)}
                      touch
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3.5 px-5">
              {/* <PlanCard sub={subscription} /> */}
              <AccountRow name={displayName} initial={initial} />
              <button
                type="button"
                onClick={handleLogout}
                className="border border-boss-rail-text/25 px-3.5 py-2.5 text-left text-[12.5px] font-semibold transition-colors hover:bg-white/10"
              >
                로그아웃
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

// ── 조각 ─────────────────────────────────────────────────────

function Wordmark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 28 : 34;
  return (
    <Link
      href="/boss"
      className={`flex items-center gap-2.5 !text-boss-rail-text ${compact ? '' : 'px-5'}`}
      aria-label="도배르만 사장님 센터 (베타)"
    >
      {/* 로고 — 소비자 사이트와 같은 파일. 검은 바탕이라 레일 위에서 타일처럼 보이게 모서리만 살짝 */}
      <Image
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-[7px] ring-1 ring-white/15"
      />
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="flex items-center gap-2">
          <span className="font-boss-head text-[21px] font-bold leading-none tracking-[0.04em]">도배르만</span>
          {/* 베타 딱지 — 로고 옆에 비스듬히 붙인다 */}
          <span
            aria-hidden
            className="inline-block -translate-y-[2px] -rotate-[8deg] rounded-[3px] bg-[#F5B301] px-[5px] py-[2px] font-boss-head text-[9px] font-extrabold leading-none tracking-[0.14em] text-[#1B1B1B] shadow-[0_1px_0_rgba(0,0,0,0.35)]"
          >
            BETA
          </span>
        </span>
        {!compact && (
          <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.09em] text-boss-rail-text/55">
            사장님 전용 · doberman.kr
          </span>
        )}
      </span>
    </Link>
  );
}

/** 운영자가 아니면 adminOnly 항목을 뺀다 — 마운트 뒤에 판정해 서버 · 첫 화면이 어긋나지 않게 */
function useVisibleSections(): NavSection[] {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    setAdmin(currentBossIsAdmin());
  }, []);
  return useMemo(
    () =>
      SECTIONS.map((s) => ({ ...s, items: s.items.filter((it) => !it.adminOnly || admin) })).filter(
        (s) => s.items.length > 0
      ),
    [admin]
  );
}

function RailLink({ item, active, touch = false }: { item: NavItem; active: boolean; touch?: boolean }) {
  const Icon = item.icon;
  // 활성 표시선은 before 로 겹쳐 그린다 — 자리를 차지하지 않아야 워드마크 · 구역 제목과 글자 시작점이 같다
  const cls = [
    'relative flex w-full items-center gap-2.5 whitespace-nowrap px-5 text-[13.5px] transition-colors',
    'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[""]',
    touch ? 'min-h-[44px] py-2.5' : 'py-[6px]',
    active
      ? 'bg-white/[0.14] !text-boss-rail-text before:bg-boss-rail-active'
      : '!text-boss-rail-text/75 hover:bg-white/10 hover:!text-boss-rail-text',
  ].join(' ');
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener" className={cls}>
        <Icon size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
        <span className="flex-1">{item.label}</span>
        <span className="text-[10px] uppercase tracking-[0.08em] opacity-50">site</span>
      </a>
    );
  }
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined} className={cls}>
      <Icon size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="font-boss-head text-[12px] tabular-nums opacity-55">{item.badge}</span>
      )}
    </Link>
  );
}

// 구독 상태 → 레일 카드 문구. 없는 값을 지어내지 않는다 — 응답이 없으면 안내만 둔다.
function planView(sub: BossSubscriptionStatusResponse | null) {
  const active = sub?.isActive === true || sub?.status === 'ACTIVE';
  const name = sub?.productName ?? sub?.entitlement?.productName;
  const exp = sub?.expirationDate ?? sub?.entitlement?.expirationDate;
  const expText = exp ? exp.slice(0, 10) : null;
  if (active) {
    return {
      value: name ?? 'PRO',
      sub: expText ? `${expText}까지` : sub?.willRenew ? '자동 갱신' : '이용 중',
      tone: 'ok' as const,
    };
  }
  if (sub?.status === 'GRACE_PERIOD') {
    return { value: '결제 보류', sub: '결제 수단을 확인하세요', tone: 'warn' as const };
  }
  if (sub?.status === 'EXPIRED') {
    return { value: '만료', sub: '다시 구독하면 바로 이어집니다', tone: 'warn' as const };
  }
  return { value: '무료', sub: 'PRO 로 견적 무제한 · 고급 리포트', tone: 'none' as const };
}

function PlanCard({
  sub,
  className = '',
}: {
  sub: BossSubscriptionStatusResponse | null;
  className?: string;
}) {
  const v = planView(sub);
  return (
    <Link
      href="/boss/billing"
      className={`flex flex-col gap-1 border border-boss-rail-text/25 px-3.5 py-3 !text-boss-rail-text transition-colors hover:bg-white/10 ${className}`}
    >
      <span className="text-[10px] uppercase tracking-[0.09em] text-boss-rail-text/55">구독 플랜</span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-boss-head text-[22px] font-bold leading-none tracking-[-0.01em]">
          {v.value}
        </span>
        {v.tone === 'warn' && (
          <span className="h-[7px] w-[7px] bg-boss-warning" aria-hidden />
        )}
      </span>
      <span className="text-[11.5px] leading-relaxed text-boss-rail-text/70">{v.sub}</span>
    </Link>
  );
}

function PlanChip({ sub }: { sub: BossSubscriptionStatusResponse | null }) {
  const v = planView(sub);
  return (
    <Link
      href="/boss/billing"
      className="border border-boss-rail-text/25 px-2 py-1 font-boss-head text-[12px] !text-boss-rail-text tabular-nums"
    >
      {v.value}
    </Link>
  );
}

function AccountRow({ name, initial }: { name: string; initial: string }) {
  return (
    <Link href="/boss/me" className="flex min-w-0 items-center gap-2.5 !text-boss-rail-text">
      <span
        aria-hidden
        className="grid h-[34px] w-[34px] shrink-0 place-items-center bg-white/15 font-boss-head text-[14px] font-bold"
      >
        {initial || '·'}
      </span>
      <span className="flex min-w-0 flex-col leading-[1.35]">
        <span className="truncate text-[13px]">{name}</span>
        <span className="truncate text-[10px] uppercase tracking-[0.09em] text-boss-rail-text/55">
          사장님
        </span>
      </span>
    </Link>
  );
}
