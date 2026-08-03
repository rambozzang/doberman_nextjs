'use client';

// 사장님 좌측 레일 — onGo 리디자인 시안
// width 216px / bg #14161f / border-right #23263c / padding 16px 12px
//
// 로고    : padding 4px 8px 18px, 22×22 accent 사각(radius 6px) + 워드마크 16px/700
// 내비    : gap 2px, 항목 padding 8px 9px / radius 8px / 12.5px / gap 10px
//           기본 #9598bb 500 · hover bg #1d2030 #fff · 선택 700 #fff + ac-dim + inset 1px #2e3250
//           좌측 16px 마크(시안은 글리프, 여기서는 Lucide 아이콘) · 우측 배지 mono 10px
// 하단    : margin-top auto, gap 10px — 사용량 카드 + 계정 행(26px 아바타 + ⋯ 메뉴)

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  User,
  Building2,
  Settings,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useBossAuth } from '@/hooks/useBossAuth';
import { SECTIONS, isNavActive } from './nav';

const LS_KEY = 'boss_sidebar_collapsed';

export default function BossSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { bossAuth, bossLogout } = useBossAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(LS_KEY) === '1');
    } catch {}
  }, []);

  // 계정 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggle = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem(LS_KEY, v ? '0' : '1');
      } catch {}
      return !v;
    });
  };

  const handleLogout = () => {
    bossLogout();
    router.replace('/boss/login');
  };

  const displayName =
    bossAuth.userInfo?.name ?? bossAuth.userInfo?.nickNm ?? bossAuth.userId ?? '사장님';
  const email = bossAuth.userInfo?.email ?? '사장님 계정';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-boss-border bg-boss-rail px-3 py-4 transition-[width] duration-200 md:flex ${
        collapsed ? 'w-[60px]' : 'w-[216px]'
      }`}
    >
      {/* 로고 — padding 4px 8px 18px */}
      <Link
        href="/boss"
        className={`flex items-center gap-[9px] pb-[18px] pt-1 ${collapsed ? 'justify-center' : 'px-2'}`}
      >
        <span className="h-[22px] w-[22px] flex-none rounded-[6px] bg-boss-primary" />
        {!collapsed && (
          <span className="text-[16px] font-bold tracking-[-0.01em] !text-boss-text">
            도배르만
          </span>
        )}
      </Link>

      {/* 내비 */}
      <nav className="boss-scroll min-h-0 flex-1 overflow-y-auto">
        {SECTIONS.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? 'mt-[18px]' : ''}>
            {!collapsed && <p className="boss-mono-label mb-1.5 px-[9px]">{section.title}</p>}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, icon: Icon, exact, badge, exclude }) => {
                const active = isNavActive(pathname, href, exact, exclude);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-2.5 rounded-[8px] px-[9px] py-2 text-[12.5px] transition-colors duration-[120ms] ease-out ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-[var(--boss-ac-dim)] font-bold !text-white shadow-[inset_0_0_0_1px_rgb(var(--boss-border-strong))]'
                        : 'font-medium !text-boss-text-tertiary hover:bg-boss-hover hover:!text-white'
                    }`}
                  >
                    {/* 시안의 16px 마크 자리 */}
                    <span className="flex w-4 flex-none justify-center">
                      <Icon size={15} className={active ? 'text-boss-primary' : 'opacity-75'} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {badge && (
                          <span className="font-boss-mono text-[10px] text-boss-text-muted">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 하단 — 플랜 카드 + 계정 + 접기 */}
      <div className="mt-auto flex flex-col gap-2.5 pt-2.5">
        {!collapsed && (
          // 시안의 "이번 달 업로드 62/120" 진행바 자리.
          // 구독 사용량 API가 아직 없어 목업 수치 대신 업그레이드 안내를 둔다.
          // 사용량 데이터가 생기면 label + mono 값 + 4px 진행바 구조로 교체할 것.
          <Link
            href="/boss/billing/plans"
            className="rounded-control border border-boss-border bg-boss-shell px-3 py-[11px] transition-colors duration-[120ms] ease-out hover:border-boss-border-hover"
          >
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="!text-boss-text-secondary">PRO 업그레이드</span>
              <ChevronRight size={12} className="text-boss-primary" />
            </div>
            <p className="mt-2 text-[10px] !text-boss-text-muted">무제한 견적 · 고급 리포트</p>
          </Link>
        )}

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`flex w-full items-center gap-[9px] rounded-[8px] px-2 py-1.5 transition-colors duration-[120ms] ease-out hover:bg-boss-hover ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[#2b2f47] text-[11px] text-boss-text-dim">
              {initial}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[12px] font-semibold text-boss-text">
                    {displayName}
                  </span>
                  <span className="block truncate text-[10px] text-boss-text-muted">{email}</span>
                </span>
                <span className="text-[11px] text-boss-text-muted">⋯</span>
              </>
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="boss-card-content absolute bottom-full left-0 z-50 mb-1.5 w-full min-w-[188px]"
            >
              <MenuLink href="/boss/me" icon={User}>
                내 정보
              </MenuLink>
              <MenuLink href="/boss/me/company" icon={Building2}>
                회사 정보
              </MenuLink>
              <MenuLink href="/boss/settings" icon={Settings}>
                설정
              </MenuLink>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-boss-border-row px-3 py-2 text-[12px] text-boss-error transition-colors duration-[120ms] ease-out hover:bg-boss-pill-bad"
              >
                <LogOut size={13} /> 로그아웃
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="flex h-7 w-full items-center justify-center gap-1.5 rounded-chip text-boss-text-muted transition-colors duration-[120ms] ease-out hover:bg-boss-hover hover:text-boss-text"
        >
          {collapsed ? <PanelLeft size={13} /> : <PanelLeftClose size={13} />}
          {!collapsed && <span className="text-[11px]">접기</span>}
        </button>
      </div>
    </aside>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 px-3 py-2 text-[12px] !text-boss-text-secondary transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:!text-boss-text"
    >
      <Icon size={13} className="text-boss-text-muted" /> {children}
    </Link>
  );
}
