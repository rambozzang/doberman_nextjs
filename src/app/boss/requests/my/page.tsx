'use client';

import { useEffect, useState } from 'react';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
import {
  PageHeader,
  RowList,
  RowItem,
  EmptyState,
  Skeleton,
  Badge,
} from '@/components/boss/ui';
import { Inbox, FileText } from 'lucide-react';

export default function BossMyRequestsPage() {
  const [items, setItems] = useState<BossRequestListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await bossRequestsApi.myList({ page: 0, size: 50 });
        if (cancelled) return;
        if (res.success && res.data) {
          setItems(res.data.content ?? []);
        } else {
          setError(res.message || '목록 조회 실패');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="내가 답변한 견적"
        description="제출한 견적 답변과 진행 상황을 확인하세요."
        breadcrumbs={[{ label: '견적 요청', href: '/boss/requests' }, { label: '내 답변' }]}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="아직 답변한 견적이 없습니다"
          description="견적 요청에 답변하면 여기에 표시됩니다."
        />
      ) : (
        <RowList>
          {items.map((item) => (
            <RowItem
              key={item.id}
              href={`/boss/requests/${item.id}`}
              leading={
                <span className="font-mono text-[11px] text-boss-text-muted">#{item.id}</span>
              }
              title={`${item.buildingType ?? '견적'} · ${item.region ?? ''}`}
              subtitle={item.preferredDate ?? undefined}
              meta={item.status ? <Badge tone="default">{item.status}</Badge> : undefined}
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
