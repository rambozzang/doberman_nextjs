'use client';

// 사장님 사이드바 — Linear/Vercel 스타일의 컴팩트 네비게이션
// 디자인 변경: gradient orb/blur 제거, hairline border, 정보 밀도 up
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calendar,
  Hammer,
  Wrench,
  Image as ImageIcon,
  FileSignature,
  ListChecks,
  Users,
  TrendingUp,
  CreditCard,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ShoppingCart,
  BarChart3,
  Bell,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
  shortcut?: string;
};

type NavSection = { title: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: '워크스페이스',
    items: [
      { href: '/boss', label: '대시보드', icon: LayoutDashboard, exact: true, shortcut: 'G D' },
      { href: '/boss/chat', label: '채팅', icon: MessageSquare, badge: 'NEW' },
      { href: '/boss/calendar', label: '일정', icon: Calendar },
      { href: '/boss/notifications', label: '알림', icon: Bell },
    ],
  },
  {
    title: '영업',
    items: [
      { href: '/boss/requests', label: '견적 요청', icon: FileText },
      { href: '/boss/orders', label: '주문 관리', icon: ShoppingCart },
      { href: '/boss/estimate', label: '견적서', icon: FileSignature },
      { href: '/boss/portfolio', label: '포트폴리오', icon: ImageIcon },
    ],
  },
  {
    title: '운영',
    items: [
      { href: '/boss/construction', label: '시공 기록', icon: Hammer },
      { href: '/boss/checklist', label: '체크리스트', icon: ListChecks },
      { href: '/boss/as', label: 'AS 요청', icon: Wrench },
    ],
  },
  {
    title: '인사이트',
    items: [
      { href: '/boss/sales', label: '매출 분석', icon: TrendingUp },
      { href: '/boss/statistics', label: '종합 통계', icon: BarChart3 },
      { href: '/boss/community', label: '커뮤니티', icon: Users },
    ],
  },
  {
    title: '계정',
    items: [
      { href: '/boss/billing', label: '구독·결제', icon: CreditCard },
      { href: '/boss/settings', label: '설정', icon: Settings },
    ],
  },
];

const LS_KEY = 'boss_sidebar_collapsed';

export default function BossSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 로컬스토리지 복원
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(LS_KEY) === '1');
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem(LS_KEY, v ? '0' : '1');
      } catch {}
      return !v;
    });
  };

  const isActive = (href: string, exact?: boolean) => {
    if (!pathname) return false;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={`hidden shrink-0 border-r border-white/[0.06] bg-[#0a0a0b] transition-[width] duration-200 md:block ${
        collapsed ? 'w-[56px]' : 'w-56'
      }`}
    >
      <nav className="sticky top-14 flex max-h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {SECTIONS.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? 'mt-4' : ''}>
              {!collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                  {section.title}
                </p>
              )}
              <ul className="space-y-px">
                {section.items.map(({ href, label, icon: Icon, exact, badge, shortcut }) => {
                  const active = isActive(href, exact);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        title={collapsed ? label : undefined}
                        className={`group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors ${
                          active
                            ? 'bg-white/[0.06] text-white'
                            : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'
                        }`}
                      >
                        {active && (
                          <span className="absolute -left-2 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-emerald-400" />
                        )}
                        <Icon
                          size={15}
                          className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate font-medium">{label}</span>
                            {badge && (
                              <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                                {badge}
                              </span>
                            )}
                            {shortcut && !badge && (
                              <kbd className="hidden font-mono text-[10px] text-slate-600 group-hover:inline">
                                {shortcut}
                              </kbd>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] p-2">
          {!collapsed && (
            <Link
              href="/boss/billing/plans"
              className="mb-2 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] px-2.5 py-2 transition-colors hover:bg-emerald-500/[0.08]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20 text-emerald-300">
                <TrendingUp size={12} />
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-[11px] font-semibold text-emerald-200">PRO 업그레이드</p>
                <p className="text-[10px] text-slate-500">무제한 견적·고급 리포트</p>
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
          >
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            {!collapsed && <span className="text-[11px]">접기</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
