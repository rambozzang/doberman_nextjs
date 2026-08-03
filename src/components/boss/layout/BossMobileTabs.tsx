'use client';

// 모바일 하단 탭 — onGo 리디자인 시안 모바일 규칙
//
// 시안: 하단 탭 4개만 노출하고 나머지는 프로필/메뉴에서 진입.
//       라벨 10.5px, 선택 700 흰색 / 비선택 #6c7093, 터치 타겟 44px 이상.
//       가운데는 생성 액션을 강조한다.
//
// 도배 대응: 대시보드 · 견적 요청 · 주문 등록(강조) · 채팅

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
  { href: '/boss/requests', label: '견적 요청', icon: FileText },
  { href: '/boss/orders/quick', label: '주문 등록', icon: Plus, accent: true },
  { href: '/boss/chat', label: '채팅', icon: MessageSquare },
];

export default function BossMobileTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-none items-stretch border-t border-boss-border bg-boss-rail px-1.5 pb-[env(safe-area-inset-bottom)] md:hidden"
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
            // 터치 타겟 44px 이상 (시안 모바일 규칙)
            className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 pb-1 pt-2"
          >
            {accent ? (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-chip bg-boss-primary text-boss-primary-foreground">
                <Icon size={15} />
              </span>
            ) : (
              <Icon
                size={17}
                className={active ? 'text-boss-primary' : 'text-boss-text-muted'}
              />
            )}
            <span
              className={`text-[10.5px] ${
                active ? 'font-bold !text-white' : 'font-medium !text-boss-text-muted'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
