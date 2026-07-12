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
  Briefcase,
  Receipt,
  Contact,
  PenTool,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
  shortcut?: string;
  exclude?: string[];
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
      { href: '/boss/customers', label: '고객 관리', icon: Contact },
    ],
  },
  {
    title: '운영',
    items: [
      { href: '/boss/construction', label: '시공 기록', icon: Hammer },
      { href: '/boss/checklist', label: '체크리스트', icon: ListChecks },
      { href: '/boss/as', label: 'AS 요청', icon: Wrench },
      { href: '/boss/receipt', label: '영수증 관리', icon: Receipt },
      { href: '/boss/signature', label: '고객 서명', icon: PenTool },
    ],
  },
  {
    title: '인사이트',
    items: [
      { href: '/boss/sales', label: '매출 분석', icon: TrendingUp },
      { href: '/boss/statistics', label: '종합 통계', icon: BarChart3 },
      { href: '/boss/community', label: '커뮤니티', icon: Users, exclude: ['/boss/community/jobs'] },
      { href: '/boss/community/jobs', label: '구인 / 구직', icon: Briefcase },
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

  const isActive = (href: string, exact?: boolean, exclude?: string[]) => {
    if (!pathname) return false;
    if (exclude?.some((p) => pathname === p || pathname.startsWith(p + '/'))) return false;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={`hidden shrink-0 border-r border-boss-border bg-boss-bg transition-[width] duration-200 md:block ${
        collapsed ? 'w-[56px]' : 'w-56'
      }`}
    >
      <nav className="sticky top-14 flex max-h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {SECTIONS.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? 'mt-4' : ''}>
              {!collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-boss-text-muted">
                  {section.title}
                </p>
              )}
              <ul className="space-y-px">
                {section.items.map(({ href, label, icon: Icon, exact, badge, shortcut, exclude }) => {
                  const active = isActive(href, exact, exclude);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        title={collapsed ? label : undefined}
                        className={`group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors ${
                          active
                            ? 'bg-boss-elevated text-boss-text'
                            : 'text-boss-text-secondary hover:bg-boss-elevated/50 hover:text-boss-text'
                        }`}
                      >
                        {active && (
                          <span className="absolute -left-2 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-boss-primary" />
                        )}
                        <Icon
                          size={15}
                          className={active ? 'text-boss-primary' : 'text-boss-text-muted group-hover:text-boss-text-secondary'}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate font-medium">{label}</span>
                            {badge && (
                              <span className="rounded bg-boss-primary/10 px-1 py-0.5 text-[9px] font-semibold uppercase text-boss-primary ring-1 ring-inset ring-boss-primary/20">
                                {badge}
                              </span>
                            )}
                            {shortcut && !badge && (
                              <kbd className="hidden font-mono text-[10px] text-boss-text-muted group-hover:inline">
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

        <div className="border-t border-boss-border p-2">
          {!collapsed && (
            <Link
              href="/boss/billing/plans"
              className="mb-2 flex items-center gap-2 rounded-md border border-boss-primary/20 bg-boss-primary/5 px-2.5 py-2 transition-colors hover:bg-boss-primary/10"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-boss-primary/15 text-boss-primary">
                <TrendingUp size={12} />
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-[11px] font-semibold text-boss-primary">PRO 업그레이드</p>
                <p className="text-[10px] text-boss-text-muted">무제한 견적·고급 리포트</p>
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
          >
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            {!collapsed && <span className="text-[11px]">접기</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
