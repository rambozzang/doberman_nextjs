'use client';

// 모바일 하단 탭 — 참조에는 없지만 현장(휴대폰) 사용 편의상 남긴다.
// 네이비 레일과 같은 색, 사각. 라벨 10.5px, 선택 = 흰색 + 상단 3px 하늘색 선(레일 활성 표시와 같은 색).
// 가운데는 생성 액션(고객 등록)을 강조한다. 터치 타겟 52px.
// 라벨은 앱과 같은 말을 쓴다: 웹견적 · 고객.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Plus, MessageSquare, type LucideIcon } from 'lucide-react';

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** 가운데 강조(생성) 액션 */
  accent?: boolean;
};

const TABS: Tab[] = [
  { href: '/boss', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/boss/requests', label: '웹견적', icon: FileText },
  { href: '/boss/customers/new', label: '고객 등록', icon: Plus, accent: true },
  { href: '/boss/chat', label: '채팅', icon: MessageSquare },
];

export default function BossMobileTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-white/10 bg-boss-rail pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="주요 화면"
    >
      {TABS.map(({ href, label, icon: Icon, exact, accent }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname?.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 border-t-[3px] pb-1 pt-1.5 !text-boss-rail-text ${
              active ? 'border-boss-rail-active bg-white/[0.14]' : 'border-transparent'
            }`}
          >
            {accent ? (
              <span className="grid h-[24px] w-[24px] place-items-center bg-boss-primary text-boss-primary-foreground">
                <Icon size={15} strokeWidth={2} />
              </span>
            ) : (
              <Icon
                size={18}
                strokeWidth={1.5}
                className={active ? 'opacity-100' : 'opacity-70'}
              />
            )}
            <span className={`text-[10.5px] ${active ? 'font-semibold' : 'font-medium opacity-70'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
