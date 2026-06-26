'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/boss/ui';
import Link from 'next/link';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossOrderItem, OrderSortType } from '@/types/boss';
import {
  Search,
  RefreshCw,
  LayoutGrid,
  Rows3,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MapPin,
  Phone,
  Calendar,
  Wallet,
  ArrowUpRight,
  Plus,
  ListChecks,
  Image as ImageIcon,
  FilePlus,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

const SORT_OPTIONS: { key: OrderSortType; label: string }[] = [
  { key: 'CREATED_DT', label: '등록일' },
  { key: 'ESTIMATE_DATE', label: '견적일' },
  { key: 'WORK_DATE', label: '작업일' },
  { key: 'TODAY', label: '오늘' },
];

function statusBadge(code?: string) {
  const c = (code ?? '').toUpperCase();
  if (c.includes('NEW') || c.includes('대기')) return { label: '대기', cls: 'bg-boss-elevated/40 text-boss-text ring-boss-border/30' };
  if (c.includes('CONFIRM') || c.includes('확정')) return { label: '확정', cls: 'bg-boss-primary/10 text-boss-primary ring-boss-primary/30' };
  if (c.includes('PROGRESS') || c.includes('진행')) return { label: '진행', cls: 'bg-boss-info/10 text-boss-info ring-boss-info/30' };
  if (c.includes('DONE') || c.includes('완료')) return { label: '완료', cls: 'bg-violet-500/10 text-violet-400 ring-violet-500/30' };
  if (c.includes('CANCEL') || c.includes('취소')) return { label: '취소', cls: 'bg-boss-error/10 text-boss-error ring-boss-error/30' };
  return { label: code || '신규', cls: 'bg-boss-elevated/40 text-boss-text-secondary ring-boss-border/30' };
}

function formatMoney(n?: number) {
  if (!n) return '-';
  return '₩' + n.toLocaleString('ko-KR');
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

export default function BossOrderListPage() {
  const [items, setItems] = useState<BossOrderItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [sortType, setSortType] = useState<OrderSortType>('CREATED_DT');
  const [keyword, setKeyword] = useState('');

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossOrdersApi.list({ page, size: 24, sortType });
      if (res.success && res.data) {
        setItems(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalCount(res.data.totalCount ?? (res.data.content?.length ?? 0));
      } else {
        setError(res.message || '주문 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 주문 목록을 불러오지 못했습니다.');
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
        const res = await bossOrdersApi.list({ page, size: 24, sortType });
        if (cancelled) return;
        if (res.success && res.data) {
          setItems(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 1);
          setTotalCount(res.data.totalCount ?? (res.data.content?.length ?? 0));
        } else {
          setError(res.message || '주문 목록을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 주문 목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, sortType]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.name, it.phone, it.address1, it.address2, it.memo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, it) => sum + (it.totalAmount ?? 0), 0),
    [filtered],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">주문 관리</h1>
            <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-xs font-semibold text-boss-text-secondary">
              {totalCount.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-boss-text-muted">
            확정된 주문과 시공 일정을 한눈에 관리하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/boss/orders/new">
            <Button variant="primary" icon={FilePlus} size="sm">
              주문 등록
            </Button>
          </Link>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="고객명·전화·주소"
              className="h-9 w-56 rounded-lg border border-boss-border bg-boss-surface pl-9 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
            />
          </div>
          <button
            type="button"
            onClick={reload}
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
          <Link
            href="/boss/orders/quick"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-medium text-boss-text shadow-boss-md hover:bg-boss-primary-hover"
          >
            <Plus size={14} /> 빠른 주문
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-boss-border bg-boss-surface/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">총 주문</p>
          <p className="mt-1 text-lg font-bold text-boss-text">{totalCount.toLocaleString()}건</p>
        </div>
        <div className="rounded-xl border border-boss-border bg-boss-surface/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">현재 페이지 합계</p>
          <p className="mt-1 text-lg font-bold text-boss-primary">{formatMoney(totalAmount)}</p>
        </div>
        <div className="rounded-xl border border-boss-border bg-boss-surface/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">정렬</p>
          <p className="mt-1 text-lg font-bold text-boss-text">
            {SORT_OPTIONS.find((s) => s.key === sortType)?.label ?? '-'}
          </p>
        </div>
        <div className="rounded-xl border border-boss-border bg-boss-surface/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">표시 중</p>
          <p className="mt-1 text-lg font-bold text-boss-text">{filtered.length}건</p>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-boss-border">
        {SORT_OPTIONS.map(({ key, label }) => {
          const active = sortType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSortType(key);
                setPage(1);
              }}
              className={`relative px-4 py-2.5 text-sm transition-colors ${
                active ? 'text-boss-text' : 'text-boss-text-muted hover:text-boss-text'
              }`}
            >
              {label}
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
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-boss-border bg-boss-surface" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">표시할 주문이 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">상단의 빠른 주문으로 첫 주문을 등록해보세요.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const badge = statusBadge(item.statusCd);
            const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ') || '-';
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/50 p-4 transition-all hover:-translate-y-0.5 hover:border-boss-primary/20 hover:shadow-boss-lg hover:shadow-emerald-500/5"
              >
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight size={16} className="text-boss-primary" />
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {item.isExistChecklist === 'Y' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-boss-warning/10 px-2 py-0.5 text-[10px] text-boss-warning ring-1 ring-inset ring-amber-500/30">
                      <ListChecks size={10} /> 체크리스트
                    </span>
                  )}
                  {(item.imageCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-boss-elevated px-2 py-0.5 text-[10px] text-boss-text-secondary">
                      <ImageIcon size={10} /> {item.imageCount}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-boss-text-muted">#{item.id}</span>
                </div>

                <h3 className="mb-1 line-clamp-1 text-base font-semibold text-boss-text">
                  {item.name ?? '고객명 없음'}
                </h3>
                <p className="mb-3 line-clamp-1 text-xs text-boss-text-muted">{fullAddr}</p>

                <div className="grid grid-cols-2 gap-2 border-t border-boss-border pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <Phone size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.phone ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <Calendar size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.workDate ?? item.estimateDate ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <MapPin size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.post ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-boss-primary">
                    <Wallet size={12} />
                    <span className="truncate">{formatMoney(item.totalAmount)}</span>
                  </div>
                </div>

                <p className="mt-2 text-right text-[10px] text-boss-text-muted">{relativeTime(item.createdDt)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/30">
          <table className="w-full text-sm">
            <thead className="border-b border-boss-border bg-boss-surface text-xs uppercase tracking-wider text-boss-text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">고객</th>
                <th className="px-4 py-3 text-left font-medium">전화</th>
                <th className="px-4 py-3 text-left font-medium">주소</th>
                <th className="px-4 py-3 text-left font-medium">작업일</th>
                <th className="px-4 py-3 text-right font-medium">금액</th>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-4 py-3 text-left font-medium">등록</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((item) => {
                const badge = statusBadge(item.statusCd);
                return (
                  <tr key={item.id} className="transition-colors hover:bg-boss-elevated/40">
                    <td className="px-4 py-3 text-xs text-boss-text-muted">#{item.id}</td>
                    <td className="px-4 py-3 font-medium text-boss-text">{item.name ?? '-'}</td>
                    <td className="px-4 py-3 text-boss-text-secondary">{item.phone ?? '-'}</td>
                    <td className="px-4 py-3 text-boss-text-secondary">
                      <span className="block max-w-[260px] truncate">
                        {[item.address1, item.address2].filter(Boolean).join(' ') || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-boss-text-secondary">{item.workDate ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-boss-primary">
                      {formatMoney(item.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-boss-text-muted">{relativeTime(item.createdDt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}
    </div>
  );
}
