'use client';

// 구독 · 결제 하위 화면 내비 — Industry 패턴 (참조 Seg : 붙은 사각 버튼, 선택은 accent 채움)
//
// 라벨은 nav.ts PAGE_META 의 화면 제목과 같게 둔다 — 헤더 제목과 탭 이름이 어긋나면
// 지금 어디에 있는지 두 번 읽게 된다.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/boss/billing', label: '구독 · 결제' },
  { href: '/boss/billing/status', label: '구독 상태' },
  { href: '/boss/billing/plans', label: '요금제' },
  { href: '/boss/billing/renewals', label: '갱신 관리' },
  { href: '/boss/billing/history', label: '결제 내역' },
];

export default function BillingNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="구독 · 결제 화면"
      className="boss-scroll mb-4 inline-flex max-w-full overflow-x-auto border border-boss-border"
    >
      {TABS.map((tab, i) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-none items-center whitespace-nowrap px-3 py-[7px] text-[13px] transition-colors duration-[120ms] ease-out ${
              i > 0 ? 'border-l border-boss-border' : ''
            } ${
              active
                ? 'bg-boss-primary font-semibold !text-boss-primary-foreground'
                : 'bg-boss-bg !text-boss-text hover:bg-boss-hover'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
