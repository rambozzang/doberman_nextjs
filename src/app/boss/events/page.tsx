'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Coffee, Calendar, RefreshCw, AlertCircle, type LucideIcon } from 'lucide-react';
import { bossNotificationsApi } from '@/lib/api/boss/notifications';
import type {
  BossNotificationItem,
  BossNotificationListResponse,
} from '@/types/boss-notifications';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';

// DataTable 한 행을 표현하는 통합 모델 (정적 이벤트 + API 이벤트 공통)
interface EventRow {
  key: string;
  icon: LucideIcon;
  name: string;
  period: string; // 기간(정적) 또는 등록일(API)
  statusLabel: string;
  statusTone: BadgeTone;
  summary: string;
  href: string;
  actionLabel: string;
  actionVariant: 'primary' | 'secondary';
}

// 상시 운영되는 정적 이벤트 (상세: /boss/events/coffee)
const STATIC_EVENTS: EventRow[] = [
  {
    key: 'static-coffee',
    icon: Coffee,
    name: '커피 쿠폰 이벤트',
    period: '2024.01.01 ~ 2024.12.31',
    statusLabel: '진행 중',
    statusTone: 'amber',
    summary: '참여하신 모든 사장님께 추첨을 통해 스타벅스 아메리카노 쿠폰을 드립니다.',
    href: '/boss/events/coffee',
    actionLabel: '참여',
    actionVariant: 'primary',
  },
];

function pickList(
  data: BossNotificationListResponse | BossNotificationItem[] | undefined,
): BossNotificationItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.list ?? data.content ?? [];
}

function formatDate(s?: string): string {
  if (!s) return '-';
  const m = s.match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return s;
}

function stripHtml(s?: string): string {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default function BossEventsPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
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
      if (res.success) {
        setItems(pickList(res.data));
      } else {
        setError(res.message ?? '이벤트를 불러오지 못했습니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '이벤트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 정적 이벤트 + API 이벤트를 하나의 행 모델로 병합
  const rows = useMemo<EventRow[]>(() => {
    const apiRows: EventRow[] = items.map((item, idx) => ({
      key: `noti-${item.boardId ?? idx}`,
      icon: Sparkles,
      name: item.subject ?? '제목 없음',
      period: formatDate(item.crtDtm),
      statusLabel: '이벤트',
      statusTone: 'emerald',
      summary: stripHtml(item.contents),
      href: `/boss/notifications/${item.boardId ?? ''}`,
      actionLabel: '보기',
      actionVariant: 'secondary',
    }));
    return [...STATIC_EVENTS, ...apiRows];
  }, [items]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((r) =>
      [r.name, r.summary, r.period].some((v) => v.toLowerCase().includes(k)),
    );
  }, [rows, keyword]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="이벤트"
        description="도베르만이 준비한 프로모션과 이벤트를 확인하세요."
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="이벤트명·설명 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => void load()}
          disabled={loading}
        >
          새로고침
        </Button>
        <span className="ml-auto rounded-md bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-muted">
          총 {filtered.length.toLocaleString()}건
        </span>
      </Toolbar>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="진행 중인 이벤트가 없습니다"
          description={
            keyword.trim()
              ? '검색어와 일치하는 이벤트가 없습니다.'
              : '새로운 이벤트가 등록되면 알려드릴게요.'
          }
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>이벤트명</th>
              <th className="whitespace-nowrap">기간/상태</th>
              <th>설명</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const Icon = row.icon;
              return (
                <tr
                  key={row.key}
                  className="cursor-pointer"
                  onClick={() => router.push(row.href)}
                >
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-boss-elevated text-boss-text-muted">
                        <Icon size={13} />
                      </span>
                      <span className="font-medium text-boss-text">{row.name}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <Badge tone={row.statusTone}>{row.statusLabel}</Badge>
                    <span className="mt-1 flex items-center gap-1 text-xs text-boss-text-muted">
                      <Calendar size={11} /> {row.period}
                    </span>
                  </td>
                  <td className="max-w-md text-boss-text-secondary">
                    <span className="line-clamp-1">{row.summary || '-'}</span>
                  </td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={row.actionVariant}
                      size="sm"
                      onClick={() => router.push(row.href)}
                    >
                      {row.actionLabel}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
