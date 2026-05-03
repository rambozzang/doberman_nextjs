'use client';

import { useEffect, useMemo, useState } from 'react';
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
    return { label: status || '신규', cls: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30' };
  }
  if (s.includes('progress') || s.includes('진행')) {
    return { label: status || '진행', cls: 'bg-sky-500/10 text-sky-300 ring-sky-500/30' };
  }
  if (s.includes('done') || s.includes('완료')) {
    return { label: status || '완료', cls: 'bg-violet-500/10 text-violet-300 ring-violet-500/30' };
  }
  return { label: status || '신규', cls: 'bg-slate-700/40 text-slate-300 ring-slate-600/30' };
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

  const load = async (resetPage = false) => {
    setLoading(true);
    setError(null);
    try {
      const targetPage = resetPage ? 1 : page;
      const res = await bossRequestsApi.list({ page: targetPage, size: 24 });
      if (res.success && res.data) {
        setItems(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalCount(res.data.totalCount ?? 0);
        if (resetPage) setPage(1);
      } else {
        setError(res.message || '목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossRequestsApi.list({ page, size: 24 });
        if (cancelled) return;
        if (res.success && res.data) {
          setItems(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 1);
          setTotalCount(res.data.totalCount ?? 0);
        } else {
          setError(res.message || '목록을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

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

  return (
    <div className="space-y-5">
      {/* Toolbar header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">견적 요청</h1>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {totalCount.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            새로 들어온 견적 요청을 빠르게 확인하고 답변하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="지역·건물·고객 검색"
              className="h-9 w-56 rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <SlidersHorizontal size={14} /> 필터
          </button>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <div className="flex h-9 items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === 'grid' ? 'bg-slate-800 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label="그리드 보기"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === 'list' ? 'bg-slate-800 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label="리스트 보기"
            >
              <Rows3 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800">
        {STATUS_TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
              {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Content */}
      {loading && items.length === 0 ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-slate-200">표시할 견적 요청이 없습니다</p>
          <p className="mt-1 text-xs text-slate-500">필터 조건을 변경하거나 새로고침해보세요.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const badge = statusBadge(item.status);
            return (
              <Link
                key={item.id}
                href={`/boss/requests/${item.id}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight size={16} className="text-emerald-400" />
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  {typeof item.answerCount === 'number' && item.answerCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      <MessageCircle size={10} /> {item.answerCount}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-slate-500">#{item.id}</span>
                </div>

                <h3 className="mb-1 line-clamp-1 text-base font-semibold text-white">
                  {item.buildingType ?? '견적 요청'}
                  {item.areaSize ? <span className="ml-1 text-emerald-300">· {item.areaSize}㎡</span> : null}
                </h3>
                <p className="mb-3 line-clamp-1 text-xs text-slate-400">
                  {item.constructionLocation ?? item.wallpaper ?? '시공 위치 정보 없음'}
                </p>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin size={12} className="text-slate-500" />
                    <span className="truncate">{item.region ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Home size={12} className="text-slate-500" />
                    <span className="truncate">{item.roomCount ? `방 ${item.roomCount}개` : '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar size={12} className="text-slate-500" />
                    <span className="truncate">{item.preferredDate ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock size={12} className="text-slate-500" />
                    <span className="truncate">{relativeTime(item.createdDt ?? item.requestDate)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
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
                    className="group cursor-pointer transition-colors hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <Link href={`/boss/requests/${item.id}`}>#{item.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/boss/requests/${item.id}`} className="font-medium text-slate-100">
                        {item.buildingType ?? '견적 요청'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.region ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Ruler size={11} className="text-slate-500" />
                        {item.areaSize ? `${item.areaSize}㎡` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.preferredDate ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {relativeTime(item.createdDt ?? item.requestDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/boss/requests/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs text-emerald-300 opacity-0 transition-opacity group-hover:opacity-100"
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
      {totalPages > 1 && (
        <nav className="flex items-center justify-between border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            페이지 {page} / {totalPages} · 총 {totalCount.toLocaleString()}건
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft size={12} /> 이전
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-40"
            >
              다음 <ChevronRight size={12} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
