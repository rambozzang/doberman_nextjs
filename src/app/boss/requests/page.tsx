'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
import {
  MapPin,
  Clock,
  MessageCircle,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Rows3,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Home,
  Ruler,
  Calendar,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'new' | 'progress' | 'done';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'progress', label: '진행 중' },
  { key: 'done', label: '완료' },
];

function statusBadge(status?: string) {
  const s = (status ?? '').toLowerCase();
  if (s.includes('new') || s.includes('신규') || s.includes('대기')) {
    return { label: status || '신규', cls: 'bg-boss-primary/10 text-boss-primary ring-boss-primary/30' };
  }
  if (s.includes('progress') || s.includes('진행')) {
    return { label: status || '진행', cls: 'bg-boss-info/10 text-boss-info ring-boss-info/30' };
  }
  if (s.includes('done') || s.includes('완료')) {
    return { label: status || '완료', cls: 'bg-violet-500/10 text-violet-400 ring-violet-500/30' };
  }
  return { label: status || '신규', cls: 'bg-boss-elevated/40 text-boss-text-secondary ring-boss-border/30' };
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
      const res = await bossRequestsApi.list({ page: targetPage, size: 24 });
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
  const displayCount = isFiltering ? filtered.length : totalCount;

  return (
    <div className="space-y-5">
      {/* Toolbar header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">견적 요청</h1>
            <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-xs font-semibold text-boss-text-secondary">
              {displayCount.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-boss-text-muted">
            새로 들어온 견적 요청을 빠르게 확인하고 답변하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="지역·건물·고객 검색"
              className="h-9 w-56 rounded-lg border border-boss-border bg-boss-surface pl-9 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
            />
          </div>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
          >
            <SlidersHorizontal size={14} /> 필터
          </button>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <div className="flex h-9 items-center rounded-lg border border-boss-border bg-boss-surface p-0.5">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === 'grid' ? 'bg-boss-elevated text-boss-primary' : 'text-boss-text-muted hover:text-boss-text-secondary'
              }`}
              aria-label="그리드 보기"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === 'list' ? 'bg-boss-elevated text-boss-primary' : 'text-boss-text-muted hover:text-boss-text-secondary'
              }`}
              aria-label="리스트 보기"
            >
              <Rows3 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-boss-border">
        {STATUS_TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                active ? 'text-boss-text' : 'text-boss-text-muted hover:text-boss-text'
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-boss-primary/20 text-boss-primary' : 'bg-boss-elevated text-boss-text-muted'
                }`}
              >
                {count}
              </span>
              {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-boss-primary" />}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* Content */}
      {loading && items.length === 0 ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-boss-border bg-boss-surface"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">표시할 견적 요청이 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">필터 조건을 변경하거나 새로고침해보세요.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const badge = statusBadge(item.status);
            return (
              <Link
                key={item.id}
                href={`/boss/requests/${item.id}`}
                className="group relative overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/50 p-4 transition-all hover:-translate-y-0.5 hover:border-boss-primary/20 hover:shadow-boss-lg hover:shadow-emerald-500/5"
              >
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight size={16} className="text-boss-primary" />
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  {typeof item.answerCount === 'number' && item.answerCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-boss-elevated px-2 py-0.5 text-[10px] text-boss-text-secondary">
                      <MessageCircle size={10} /> {item.answerCount}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-boss-text-muted">#{item.id}</span>
                </div>

                <h3 className="mb-1 line-clamp-1 text-base font-semibold text-boss-text">
                  {item.buildingType ?? '견적 요청'}
                  {item.areaSize ? <span className="ml-1 text-boss-primary">· {item.areaSize}㎡</span> : null}
                </h3>
                <p className="mb-3 line-clamp-1 text-xs text-boss-text-muted">
                  {item.constructionLocation ?? item.wallpaper ?? '시공 위치 정보 없음'}
                </p>

                <div className="grid grid-cols-2 gap-2 border-t border-boss-border pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <MapPin size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.region ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <Home size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.roomCount ? `방 ${item.roomCount}개` : '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <Calendar size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.preferredDate ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <Clock size={12} className="text-boss-text-muted" />
                    <span className="truncate">{relativeTime(item.createdDt ?? item.requestDate)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/30">
          <table className="w-full text-sm">
            <thead className="border-b border-boss-border bg-boss-surface text-xs uppercase tracking-wider text-boss-text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">유형</th>
                <th className="px-4 py-3 text-left font-medium">지역</th>
                <th className="px-4 py-3 text-left font-medium">면적</th>
                <th className="px-4 py-3 text-left font-medium">희망일</th>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-4 py-3 text-left font-medium">접수</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((item) => {
                const badge = statusBadge(item.status);
                return (
                  <tr
                    key={item.id}
                    className="group cursor-pointer transition-colors hover:bg-boss-elevated/40"
                  >
                    <td className="px-4 py-3 text-xs text-boss-text-muted">
                      <Link href={`/boss/requests/${item.id}`}>#{item.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/boss/requests/${item.id}`} className="font-medium text-boss-text">
                        {item.buildingType ?? '견적 요청'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-boss-text-secondary">{item.region ?? '-'}</td>
                    <td className="px-4 py-3 text-boss-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Ruler size={11} className="text-boss-text-muted" />
                        {item.areaSize ? `${item.areaSize}㎡` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-boss-text-secondary">{item.preferredDate ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-boss-text-muted">
                      {relativeTime(item.createdDt ?? item.requestDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/boss/requests/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs text-boss-primary opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        보기 <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isFiltering && totalPages > 1 ? (
        <nav className="flex items-center justify-between border-t border-boss-border pt-4">
          <p className="text-xs text-boss-text-muted">
            페이지 {page} / {totalPages} · 총 {totalCount.toLocaleString()}건
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 items-center gap-1 rounded-lg border border-boss-border bg-boss-surface px-3 text-xs text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-40"
            >
              <ChevronLeft size={12} /> 이전
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-8 items-center gap-1 rounded-lg border border-boss-border bg-boss-surface px-3 text-xs text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-40"
            >
              다음 <ChevronRight size={12} />
            </button>
          </div>
        </nav>
      ) : isFiltering ? (
        <div className="flex justify-end border-t border-boss-border pt-4">
          <span className="rounded-md bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-muted">
            현재 페이지 내 필터
          </span>
        </div>
      ) : null}
    </div>
  );
}
