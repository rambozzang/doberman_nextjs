'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Card,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
  ViewToggle,
} from '@/components/boss/ui';
import {
  MapPin,
  Clock,
  MessageCircle,
  SlidersHorizontal,
  Inbox,
  Home,
  Ruler,
  Calendar,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
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
  const [items, setItems] = useState<BossRequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [tab, setTab] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossRequestsApi.list({ page: targetPage - 1, size: 24 });
      if (res.success && res.data) {
        setItems(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalCount(res.data.totalCount ?? 0);
      } else {
        setError(res.message || '목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (page === 1) {
      void load(1);
    } else {
      setPage(1);
    }
  }, [load, page]);

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
    <div className="space-y-4">
      <PageHeader
        title="견적 요청"
        description="새로 들어온 견적 요청을 확인하고 답변합니다."
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="지역·건물·고객 검색"
          className="w-56"
        />
        <Button variant="secondary" size="sm" icon={SlidersHorizontal}>
          필터
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleRefresh()}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          새로고침
        </Button>
        <div className="ml-auto">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </Toolbar>

      <ListTabs
        tabs={STATUS_TABS.map(({ key, label }) => ({
          key,
          label,
          count: counts[key],
        }))}
        active={tab}
        onChange={setTab}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <Skeleton className="h-64 rounded-lg" />
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 견적 요청이 없습니다"
          description="필터 조건을 변경하거나 새로고침하세요."
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const badge = statusBadge(item.status);
            return (
              <Card
                key={item.id}
                interactive
                padded={false}
                className="rounded-lg p-3"
              >
                <Link href={`/boss/requests/${item.id}`} className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    {typeof item.answerCount === 'number' && item.answerCount > 0 && (
                      <Badge tone="default">
                        <MessageCircle size={10} /> {item.answerCount}
                      </Badge>
                    )}
                    <span className="ml-auto text-[11px] text-boss-text-muted">
                      #{item.id}
                    </span>
                  </div>
                  <h3 className="mb-0.5 text-sm font-medium text-boss-text">
                    {item.buildingType ?? '견적 요청'}
                    {item.areaSize ? (
                      <span className="ml-1 text-boss-text-secondary">
                        · {item.areaSize}㎡
                      </span>
                    ) : null}
                  </h3>
                  <p className="mb-2 line-clamp-1 text-xs text-boss-text-muted">
                    {item.constructionLocation ?? item.wallpaper ?? '시공 위치 정보 없음'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-boss-border pt-2 text-xs text-boss-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-boss-text-muted" />
                      <span className="truncate">{item.region ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Home size={12} className="text-boss-text-muted" />
                      <span className="truncate">
                        {item.roomCount ? `방 ${item.roomCount}개` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-boss-text-muted" />
                      <span className="truncate">{item.preferredDate ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-boss-text-muted" />
                      <span className="truncate">
                        {relativeTime(item.createdDt ?? item.requestDate)}
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>#</th>
              <th>유형</th>
              <th>지역</th>
              <th>면적</th>
              <th>희망일</th>
              <th>상태</th>
              <th>접수</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const badge = statusBadge(item.status);
              return (
                <tr key={item.id}>
                  <td className="text-boss-text-muted">#{item.id}</td>
                  <td>
                    <Link
                      href={`/boss/requests/${item.id}`}
                      className="font-medium text-boss-text"
                    >
                      {item.buildingType ?? '견적 요청'}
                    </Link>
                  </td>
                  <td className="text-boss-text-secondary">{item.region ?? '-'}</td>
                  <td className="text-boss-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Ruler size={11} className="text-boss-text-muted" />
                      {item.areaSize ? `${item.areaSize}㎡` : '-'}
                    </span>
                  </td>
                  <td className="text-boss-text-secondary">
                    {item.preferredDate ?? '-'}
                  </td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="text-xs text-boss-text-muted">
                    {relativeTime(item.createdDt ?? item.requestDate)}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/boss/requests/${item.id}`}
                      className="inline-flex text-boss-text-muted hover:text-boss-text"
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {!isFiltering && totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          disabled={loading}
        />
      ) : isFiltering ? (
        <div className="flex justify-end border-t border-boss-border pt-3">
          <span className="rounded-md bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-muted">
            현재 페이지 내 필터
          </span>
        </div>
      ) : null}
    </div>
  );
}
