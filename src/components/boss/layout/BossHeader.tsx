'use client';

// 사장님 헤더 — 컴팩트한 top bar
// 디자인 변경: gradient 로고 제거, hairline border, 검색 항상 표시, 메뉴 정돈
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useBossAuth } from '@/hooks/useBossAuth';
import {
  Bell,
  LogOut,
  User,
  Search,
  Building2,
  ChevronDown,
  Settings,
  HelpCircle,
} from 'lucide-react';

export default function BossHeader() {
  const router = useRouter();
  const { bossAuth, bossLogout } = useBossAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Cmd/Ctrl+K 검색 포커스
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const el = document.getElementById('boss-global-search') as HTMLInputElement | null;
        el?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    bossLogout();
    router.replace('/boss/login');
  };

  const displayName =
    bossAuth.userInfo?.name ?? bossAuth.userInfo?.nickNm ?? bossAuth.userId ?? '사장님';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0b]/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4">
        {/* 로고 */}
        <Link href="/boss" className="flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] ring-1 ring-inset ring-white/10">
            <Building2 size={14} className="text-emerald-400" />
          </div>
          <div className="hidden leading-tight md:flex md:flex-col">
            <span className="text-[13px] font-semibold text-white">도배르만</span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
              PRO
            </span>
          </div>
        </Link>

        <span className="hidden h-5 w-px bg-white/10 md:block" />

        {/* 검색 */}
        <div className="flex flex-1 items-center">
          <div className="relative w-full max-w-md">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600"
            />
            <input
              id="boss-global-search"
              type="text"
              placeholder="견적, 고객, 시공 검색..."
              className="h-8 w-full rounded-md border border-white/[0.06] bg-white/[0.03] pl-8 pr-12 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/40 focus:bg-white/[0.04] focus:outline-none"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-white/10 bg-white/[0.03] px-1 text-[10px] font-medium text-slate-500">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* 우측 액션 */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/boss/help"
            className="hidden rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200 md:inline-flex"
            aria-label="도움말"
          >
            <HelpCircle size={16} />
          </Link>
          <Link
            href="/boss/notifications"
            className="relative rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
            aria-label="알림"
          >
            <Bell size={16} />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0a0b]" />
          </Link>

          <span className="mx-1 h-5 w-px bg-white/10" />

          {bossAuth.isAuthenticated ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-md p-1 pr-1.5 text-sm transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/15 text-[10px] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                  {initial}
                </div>
                <span className="hidden text-[12px] font-medium text-slate-200 md:inline">
                  {displayName}
                </span>
                <ChevronDown size={12} className="hidden text-slate-600 md:inline" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 overflow-hidden rounded-lg border border-white/10 bg-[#0f0f11] shadow-2xl shadow-black/60">
                  <div className="border-b border-white/[0.06] px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-white">{displayName}</p>
                    <p className="truncate text-[11px] text-slate-500">
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
                  <div className="border-t border-white/[0.06] py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-rose-300 transition-colors hover:bg-rose-500/10"
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
              className="rounded-md bg-emerald-500 px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-emerald-400"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
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
      className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
    >
      <Icon size={13} className="text-slate-500" /> {children}
    </Link>
  );
}
