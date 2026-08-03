'use client';

// 견적 요청 — onGo 리디자인 시안의 목록 패턴
// 화면 제목/부제는 상단바(BossHeader)가 담당하므로 페이지 내 헤더를 두지 않는다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
import {
  Toolbar,
  Button,
  ListTabs,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  RowSkeleton,
  RowActions,
  AlertBanner,
} from '@/components/boss/ui';
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';
import { RefreshCw, Inbox } from 'lucide-react';

type StatusFilter = 'all' | 'new' | 'progress' | 'done';
type BadgeTone = 'default' | 'emerald' | 'sky' | 'violet';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'progress', label: '진행 중' },
  { key: 'done', label: '완료' },
];

function statusBadge(status?: string) {
  const s = (status ?? '').toLowerCase();
  if (s.includes('new') || s.includes('신규') || s.includes('대기')) {
    return { label: status || '신규', tone: 'emerald' as BadgeTone };
  }
  if (s.includes('progress') || s.includes('진행')) {
    return { label: status || '진행', tone: 'sky' as BadgeTone };
  }
  if (s.includes('done') || s.includes('완료')) {
    return { label: status || '완료', tone: 'violet' as BadgeTone };
  }
  return { label: status || '신규', tone: 'default' as BadgeTone };
}

function relativeTime(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR');
}

export default function BossRequestListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossRequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<StatusFilter>('all');

  // 상단바 검색(`/` 로 포커스)을 이 화면에 연결한다
  const { query: keyword } = useBossSearch('지역 · 건물 · 고객');

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossRequestsApi.list({ page: targetPage - 1, size: 24 });
      if (res.success && res.data) {
        setItems(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 1);
      } else {
        setError(res.message || '목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  useEffect(() => {
    setPage(1);
  }, [tab, keyword]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== 'all') {
      list = list.filter((it) => {
        const s = (it.status ?? '').toLowerCase();
        if (tab === 'new') return s.includes('new') || s.includes('신규') || s.includes('대기') || !s;
        if (tab === 'progress') return s.includes('progress') || s.includes('진행');
        if (tab === 'done') return s.includes('done') || s.includes('완료');
        return true;
      });
    }
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((it) =>
        [it.region, it.buildingType, it.customerName, it.constructionLocation, it.wallpaper]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(k)),
      );
    }
    return list;
  }, [items, tab, keyword]);

  const counts = useMemo(() => {
    const c = { all: items.length, new: 0, progress: 0, done: 0 };
    items.forEach((it) => {
      const s = (it.status ?? '').toLowerCase();
      if (s.includes('progress') || s.includes('진행')) c.progress++;
      else if (s.includes('done') || s.includes('완료')) c.done++;
      else c.new++;
    });
    return c;
  }, [items]);

  const isFiltering = tab !== 'all' || keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-3.5">
      <Toolbar>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => (page === 1 ? load(1) : setPage(1))}
          disabled={loading}
        >
          새로고침
        </Button>
        {isFiltering && (
          <span className="text-[11px] text-boss-text-muted">
            <span className="font-boss-mono text-boss-primary">{filtered.length}</span> 건 일치 ·
            현재 페이지 내 필터
          </span>
        )}
        <span className="ml-auto font-boss-mono text-[10.5px] text-boss-text-muted">
          전체 {items.length.toLocaleString('ko-KR')}
        </span>
      </Toolbar>

      <ListTabs
        tabs={STATUS_TABS.map(({ key, label }) => ({ key, label, count: counts[key] }))}
        active={tab}
        onChange={setTab}
      />

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load(page)}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && items.length === 0 ? (
        <div className="rounded-card border border-boss-border bg-boss-surface">
          <RowSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 견적 요청이 없습니다"
          description="필터 조건을 변경하거나 새로고침하세요."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">#</th>
              <th>유형</th>
              <th>지역</th>
              <th className="whitespace-nowrap">희망일</th>
              <th>상태</th>
              <th className="text-center whitespace-nowrap">답변</th>
              <th className="whitespace-nowrap">접수</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const badge = statusBadge(item.status);
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/requests/${item.id}`)}
                >
                  <td className="whitespace-nowrap font-boss-mono text-[11px] text-boss-text-muted">
                    {item.id}
                  </td>
                  <td>
                    <span className="font-semibold text-boss-text">
                      {item.buildingType ?? '견적 요청'}
                    </span>
                    {item.areaSize ? (
                      <span className="ml-1.5 font-boss-mono text-[11px] text-boss-text-secondary">
                        {item.areaSize}㎡
                      </span>
                    ) : null}
                    {item.roomCount ? (
                      <span className="ml-1.5 text-[11px] text-boss-text-muted">
                        방 {item.roomCount}개
                      </span>
                    ) : null}
                  </td>
                  <td className="text-boss-text-secondary">{item.region ?? '-'}</td>
                  <td className="whitespace-nowrap font-boss-mono text-[12px] text-boss-text-secondary">
                    {item.preferredDate ?? '-'}
                  </td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="num text-boss-text-secondary">
                    {typeof item.answerCount === 'number' && item.answerCount > 0
                      ? item.answerCount
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap font-boss-mono text-[11px] text-boss-text-muted">
                    {relativeTime(item.createdDt ?? item.requestDate)}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <RowActions
                      editLabel="답변"
                      onEdit={() => router.push(`/boss/requests/${item.id}`)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {!isFiltering && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      )}
    </div>
  );
}
