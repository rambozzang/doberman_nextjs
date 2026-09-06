'use client';

// 결제 내역 · 갱신 관리 공용 표 — Industry 패턴 (참조 agent/billing 의 내 광고 현황 표)
//
//   BillingNav(Seg) + 우측 "전체 n건" + 새로고침 → 패널 안 표(DataTable).
//   화면 제목은 헤더(PAGE_META)가 그린다. 첫 조회 실패와 0건은 문구를 달리 한다.
//   /boss/billing/history 와 /boss/billing/renewals 가 같은 API(getHistory)를 본다.

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type { BossPurchaseHistoryItem } from '@/types/boss-billing';
import {
  AlertBanner,
  Button,
  CardHead,
  ContentCard,
  DataTable,
  EmptyState,
  RowSkeleton,
  Tag,
} from '@/components/boss/ui';
import BillingNav from './BillingNav';
import { formatAmount, formatDate, historyStatusTone } from './utils';

interface HistoryViewProps {
  /** 표 패널 제목 (예: 결제 내역 · 갱신 관리) */
  title: string;
  /** 0건일 때 안내 — 화면마다 "왜 비었는지" 가 다르다 */
  emptyDescription: string;
}

export default function HistoryView({ title, emptyDescription }: HistoryViewProps) {
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <BillingNav />
        <div className="flex items-center gap-3">
          {!isLoading && !error && (
            <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
              전체 {items.length.toLocaleString('ko-KR')}건
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => void load()}
            disabled={isLoading}
          >
            새로고침
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      <ContentCard>
        <CardHead title={title} />

        {isLoading ? (
          <RowSkeleton rows={4} />
        ) : error ? (
          <div className="p-5">
            <EmptyState
              title="내역을 불러오지 못했습니다"
              description="네트워크 상태를 확인하고 다시 시도해주세요. 계속 실패하면 고객센터로 문의해주세요."
              action={
                <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void load()}>
                  다시 시도
                </Button>
              }
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState title="아직 내역이 없습니다" description={emptyDescription} />
          </div>
        ) : (
          <DataTable className="border-0 shadow-none">
            <thead>
              <tr>
                <th>거래 ID</th>
                <th>상품</th>
                <th>결제일</th>
                <th>만료일</th>
                <th className="text-right">금액</th>
                <th>스토어</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.transactionId ?? `${item.productId ?? 'item'}-${idx}`}>
                  <td className="font-boss-head text-[12.5px] text-boss-text-muted">
                    {item.transactionId ?? '-'}
                  </td>
                  <td className="font-medium">{item.productName ?? item.productId ?? '-'}</td>
                  <td className="font-boss-head tabular-nums">{formatDate(item.purchaseDate)}</td>
                  <td className="font-boss-head tabular-nums">{formatDate(item.expirationDate)}</td>
                  <td className="num font-semibold">{formatAmount(item.amount, item.currency)}</td>
                  <td className="text-[12.5px] text-boss-text-secondary">{item.store ?? '-'}</td>
                  <td>
                    <Tag tone={historyStatusTone(item.status)}>{item.status ?? '-'}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </ContentCard>
    </div>
  );
}
