'use client';

// 사장님 헤더 — B2B admin top bar
// - PC 우선, 모바일은 햄버거로 폴리백
// - 테마 전환 버튼 포함
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useBossAuth } from '@/hooks/useBossAuth';
import { useBossTheme } from '@/components/boss/BossThemeProvider';
import {
  Bell,
  LogOut,
  User,
  Building2,
  ChevronDown,
  Settings,
  HelpCircle,
  Menu,
  X,
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
  ShoppingCart,
  BarChart3,
  Sun,
  Moon,
  Briefcase,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

type MobileNavItem = { href: string; label: string; icon: LucideIcon; exclude?: string[] };

const MOBILE_NAV: MobileNavItem[] = [
  { href: '/boss', label: '대시보드', icon: LayoutDashboard },
  { href: '/boss/requests', label: '견적 요청', icon: FileText },
  { href: '/boss/orders', label: '주문 관리', icon: ShoppingCart },
  { href: '/boss/chat', label: '고객 채팅', icon: MessageSquare },
  { href: '/boss/calendar', label: '일정', icon: Calendar },
  { href: '/boss/construction', label: '시공 기록', icon: Hammer },
  { href: '/boss/checklist', label: '체크리스트', icon: ListChecks },
  { href: '/boss/as', label: 'AS 요청', icon: Wrench },
  { href: '/boss/receipt', label: '영수증 관리', icon: Receipt },
  { href: '/boss/portfolio', label: '포트폴리오', icon: ImageIcon },
  { href: '/boss/estimate', label: '견적서', icon: FileSignature },
  { href: '/boss/sales', label: '매출 분석', icon: TrendingUp },
  { href: '/boss/statistics', label: '종합 통계', icon: BarChart3 },
  { href: '/boss/community', label: '커뮤니티', icon: Users, exclude: ['/boss/community/jobs'] },
  { href: '/boss/community/jobs', label: '구인 / 구직', icon: Briefcase },
  { href: '/boss/billing', label: '구독·결제', icon: CreditCard },
  { href: '/boss/settings', label: '설정', icon: Settings },
];

export default function BossHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { bossAuth, bossLogout } = useBossAuth();
  const { resolvedTheme, toggleTheme } = useBossTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    bossLogout();
    router.replace('/boss/login');
  };

  const displayName =
    bossAuth.userInfo?.name ?? bossAuth.userInfo?.nickNm ?? bossAuth.userId ?? '사장님';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-boss-border bg-boss-surface/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* 모바일 햄버거 */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex rounded-md p-1.5 text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text md:hidden"
            aria-label="메뉴 열기"
          >
            <Menu size={20} />
          </button>

          {/* 로고 */}
          <Link href="/boss" className="flex shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-boss-elevated ring-1 ring-inset ring-boss-border">
              <Building2 size={14} className="text-boss-primary" />
            </div>
            <div className="hidden leading-tight md:flex md:flex-col">
              <span className="text-[13px] font-semibold text-boss-text">도배륭</span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-boss-text-muted">
                PRO
              </span>
            </div>
          </Link>

          {/* 데스크톱 여백 */}
          <div className="hidden flex-1 md:block" />

          {/* 우측 액션 */}
          <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md p-1.5 text-boss-text-muted transition-colors hover:bg-boss-elevated hover:text-boss-text"
              aria-label={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
            >
              {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              href="/boss/help"
              className="hidden rounded-md p-1.5 text-boss-text-muted transition-colors hover:bg-boss-elevated hover:text-boss-text md:inline-flex"
              aria-label="도움말"
            >
              <HelpCircle size={16} />
            </Link>
            <Link
              href="/boss/notifications"
              className="relative rounded-md p-1.5 text-boss-text-muted transition-colors hover:bg-boss-elevated hover:text-boss-text"
              aria-label="알림"
            >
              <Bell size={16} />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-boss-primary ring-2 ring-boss-surface" />
            </Link>

            <span className="mx-1 h-5 w-px bg-boss-border" />

            {bossAuth.isAuthenticated ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md p-1 pr-1.5 text-sm transition-colors hover:bg-boss-elevated"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-boss-primary/15 text-[10px] font-bold text-boss-primary ring-1 ring-inset ring-boss-primary/25">
                    {initial}
                  </div>
                  <span className="hidden text-[12px] font-medium text-boss-text md:inline">
                    {displayName}
                  </span>
                  <ChevronDown size={12} className="hidden text-boss-text-muted md:inline" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 overflow-hidden rounded-lg border border-boss-border bg-boss-surface shadow-boss-lg">
                    <div className="border-b border-boss-border px-3 py-2.5">
                      <p className="text-[13px] font-semibold text-boss-text">{displayName}</p>
                      <p className="truncate text-[11px] text-boss-text-muted">
                        {bossAuth.userInfo?.email ?? '사장님 계정'}
                      </p>
                    </div>
                    <div className="py-1">
                      <MenuLink href="/boss/me" icon={User} onClick={() => setMenuOpen(false)}>
                        내 정보
                      </MenuLink>
                      <MenuLink href="/boss/me/company" icon={Building2} onClick={() => setMenuOpen(false)}>
                        회사 정보
                      </MenuLink>
                      <MenuLink href="/boss/settings" icon={Settings} onClick={() => setMenuOpen(false)}>
                        설정
                      </MenuLink>
                    </div>
                    <div className="border-t border-boss-border py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-boss-error transition-colors hover:bg-boss-error/10"
                      >
                        <LogOut size={13} /> 로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/boss/login"
                className="rounded-md bg-boss-primary px-2.5 py-1.5 text-[12px] font-medium text-boss-primary-foreground hover:bg-boss-primary-hover"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 모바일 네비게이션 오버레이 */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav className="absolute left-0 top-0 h-full w-[260px] border-r border-boss-border bg-boss-surface p-4 shadow-boss-lg">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/boss" className="flex items-center gap-2" onClick={() => setMobileNavOpen(false)}>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-boss-elevated ring-1 ring-inset ring-boss-border">
                  <Building2 size={14} className="text-boss-primary" />
                </div>
                <span className="text-[13px] font-semibold text-boss-text">도배륭 PRO</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-1.5 text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
                aria-label="메뉴 닫기"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="space-y-px">
              {MOBILE_NAV.map(({ href, label, icon: Icon, exclude }) => {
                const active =
                  !exclude?.some((p) => pathname === p || pathname?.startsWith(p + '/')) &&
                  (pathname === href || pathname?.startsWith(href + '/'));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${
                        active
                          ? 'bg-boss-elevated text-boss-text'
                          : 'text-boss-text-secondary hover:bg-boss-elevated/50 hover:text-boss-text'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-boss-primary' : 'text-boss-text-muted'} />
                      <span className="font-medium">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof User;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-boss-text-secondary transition-colors hover:bg-boss-elevated hover:text-boss-text"
    >
      <Icon size={13} className="text-boss-text-muted" /> {children}
    </Link>
  );
}
