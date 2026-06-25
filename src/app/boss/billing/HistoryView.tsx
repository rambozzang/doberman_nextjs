'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Loader2,
  Receipt,
  RefreshCw,
  Store,
} from 'lucide-react';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type { BossPurchaseHistoryItem } from '@/types/boss-billing';
import { PageHeader, Card, Button, EmptyState, Skeleton, Badge } from '@/components/boss/ui';
import BillingNav from './BillingNav';
import { formatDate } from './utils';

interface HistoryViewProps {
  title: string;
  description: string;
  eyebrow?: string;
  breadcrumbLabel: string;
  icon?: React.ElementType;
}

export default function HistoryView({
  title,
  description,
  eyebrow = 'Billing',
  breadcrumbLabel,
  icon: HeaderIcon = Receipt,
}: HistoryViewProps) {
  const [items, setItems] = useState<BossPurchaseHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await bossBillingApi.getHistory();
    if (res.success === false) {
      setError(res.error ?? res.message ?? '결제 내역을 불러오지 못했습니다.');
      setItems([]);
    } else {
      setItems(res.data?.items ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={[{ label: '결제 관리', href: '/boss/billing' }, { label: breadcrumbLabel }]}
        actions={
          <Button
            variant="secondary"
            icon={isLoading ? Loader2 : RefreshCw}
            onClick={() => void load()}
            disabled={isLoading}
          >
            새로 고침
          </Button>
        }
      />

      <BillingNav />

      <Link
        href="/boss/billing"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={14} /> 결제 관리로 돌아가기
      </Link>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-medium text-rose-300 hover:text-rose-200"
          >
            다시 시도
          </button>
        </div>
      )}

      <Card className="rounded-2xl border-slate-800 bg-slate-900/40 p-0">
        <div className="flex items-center gap-2 border-b border-slate-800/70 px-5 py-4 text-slate-100">
          <HeaderIcon className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>

        {isLoading ? (
          <div className="p-5">
            <Skeleton className="mb-3 h-8 w-full" />
            <Skeleton className="mb-3 h-8 w-full" />
            <Skeleton className="mb-3 h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Receipt}
              title="내역이 없습니다"
              description="결제 및 갱신 내역이 여기에 표시됩니다."
              action={
                <Button variant="secondary" icon={RefreshCw} onClick={() => void load()}>
                  새로 고침
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/70 text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">거래 ID</th>
                  <th className="px-5 py-3 text-left font-semibold">상품</th>
                  <th className="px-5 py-3 text-left font-semibold">결제일</th>
                  <th className="px-5 py-3 text-left font-semibold">만료일</th>
                  <th className="px-5 py-3 text-right font-semibold">금액</th>
                  <th className="px-5 py-3 text-left font-semibold">스토어</th>
                  <th className="px-5 py-3 text-left font-semibold">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {items.map((item, idx) => (
                  <tr
                    key={item.transactionId ?? `${item.productId ?? 'item'}-${idx}`}
                    className="hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-400">
                      {item.transactionId ?? '-'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-100">
                        {item.productName ?? item.productId ?? '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-500" />
                        {formatDate(item.purchaseDate)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-300">
                      {formatDate(item.expirationDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-100">
                      {item.amount != null
                        ? `${item.amount.toLocaleString('ko-KR')} ${item.currency ?? ''}`.trim()
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Store size={13} />
                        {item.store ?? '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <Badge tone={item.status === 'SUCCESS' ? 'emerald' : 'default'}>
                        {item.status ?? '-'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
