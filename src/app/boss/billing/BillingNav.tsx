'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Activity, Layers, RefreshCw, Receipt } from 'lucide-react';

const tabs = [
  { href: '/boss/billing', label: '결제 관리', icon: CreditCard },
  { href: '/boss/billing/status', label: '결제 현황', icon: Activity },
  { href: '/boss/billing/plans', label: '요금제', icon: Layers },
  { href: '/boss/billing/renewals', label: '정기 갱신', icon: RefreshCw },
  { href: '/boss/billing/history', label: '결제 내역', icon: Receipt },
];

export default function BillingNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              isActive
                ? 'border-boss-primary/20 bg-boss-primary/15 text-boss-primary'
                : 'border-boss-border bg-boss-surface text-boss-text-muted hover:border-boss-border hover:text-boss-text'
            }`}
          >
            <Icon size={13} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
