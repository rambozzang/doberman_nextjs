'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { bossNotificationsApi } from '@/lib/api/boss/notifications';
import type {
  BossNotificationItem,
  BossNotificationListResponse,
} from '@/types/boss-notifications';
import {
  PageHeader,
  Card,
  RowList,
  RowItem,
  RowThumb,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

function pickList(
  data: BossNotificationListResponse | BossNotificationItem[] | undefined,
): BossNotificationItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.list ?? data.content ?? [];
}

function formatDate(s?: string): string {
  if (!s) return '';
  const m = s.match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return s;
}

export default function BossEventsPage() {
  const [items, setItems] = useState<BossNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossNotificationsApi.list({
          typeCd: 'NOTI',
          typeDtCd: 'AD',
          pageNum: 0,
          pageSize: 30,
          sortDesc: 'crtDtm',
        });
        if (!alive) return;
        if (res.success) {
          setItems(pickList(res.data));
        } else {
          setError(res.message ?? '이벤트를 불러오지 못했습니다.');
        }
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '이벤트를 불러오지 못했습니다.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="이벤트"
        description="도배르만이 준비한 프로모션과 이벤트를 확인하세요."
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="진행 중인 이벤트가 없습니다"
          description="새로운 이벤트가 등록되면 알려드릴게요."
        />
      ) : (
        <RowList>
          {items.map((item) => (
            <RowItem
              key={item.boardId ?? item.subject}
              href={`/boss/notifications/${item.boardId ?? ''}`}
              leading={<RowThumb icon={Sparkles} />}
              title={item.subject ?? '제목 없음'}
              subtitle={item.contents ? item.contents.replace(/<[^>]+>/g, '') : undefined}
              tags={<Badge tone="emerald">EVENT</Badge>}
              meta={
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} /> {formatDate(item.crtDtm)}
                </span>
              }
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
