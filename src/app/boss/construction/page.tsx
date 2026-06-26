'use client';

// 시공 기록 목록 페이지 (boss B2B 다크 테마)
// Flutter `construction_record_list_page.dart` 포팅
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Hammer,
  Plus,
  RefreshCw,
  Search,
  ImageIcon,
  Link2,
  Calendar,
  ArrowUpRight,
  Inbox,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { bossConstructionApi, normalizeConstructionRecord } from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionRecord } from '@/types/boss-construction';

type SortType = 'CREATED_DT' | 'CONSTRUCTION_DATE';
type StatusFilter = 'all' | '진행중' | '완료';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '진행중', label: '진행중' },
  { key: '완료', label: '완료' },
];

function formatDate(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function totalImageCount(item: ConstructionRecord): number {
  return item.beforeImages.length + item.duringImages.length + item.afterImages.length;
}

function thumbnail(item: ConstructionRecord): string | null {
  if (item.afterImages.length > 0) return item.afterImages[0];
  if (item.duringImages.length > 0) return item.duringImages[0];
  if (item.beforeImages.length > 0) return item.beforeImages[0];
  return null;
}

export default function BossConstructionListPage() {
  const [items, setItems] = useState<ConstructionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('CREATED_DT');
  const [statusTab, setStatusTab] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');

  const load = async () => {
    const payload = BossAuthManager.getJwtPayload();
    const custId = payload?.sub;
    if (!custId) {
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossConstructionApi.list(custId);
      if (res.success && res.data) {
        const list = (res.data as unknown[]).map((r) => normalizeConstructionRecord(r));
        setItems(list);
      } else {
        setError(res.message || '시공 기록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 시공 기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusTab !== 'all') {
      list = list.filter((it) => it.status === statusTab);
    }
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((it) =>
        [it.title, it.description ?? '']
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(k)),
      );
    }
    if (sort === 'CONSTRUCTION_DATE') {
      list.sort((a, b) => (b.constructionDate || '').localeCompare(a.constructionDate || ''));
    } else {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    return list;
  }, [items, statusTab, keyword, sort]);

  const counts = useMemo(() => {
    const c = { all: items.length, 진행중: 0, 완료: 0 };
    items.forEach((it) => {
      if (it.status === '완료') c['완료']++;
      else c['진행중']++;
    });
    return c;
  }, [items]);

  const totalImages = useMemo(
    () => items.reduce((sum, it) => sum + totalImageCount(it), 0),
    [items],
  );

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Hammer size={20} className="text-boss-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">시공 기록</h1>
            <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-xs font-semibold text-boss-text-secondary">
              {items.length.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-boss-text-muted">
            완료한 시공 내역과 시공 전/중/후 사진을 한 곳에서 관리하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="제목·설명 검색"
              className="h-9 w-56 rounded-lg border border-boss-border bg-boss-surface pl-9 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
            />
          </div>
          <div className="flex h-9 items-center rounded-lg border border-boss-border bg-boss-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSort('CREATED_DT')}
              className={`h-8 rounded-md px-3 ${
                sort === 'CREATED_DT' ? 'bg-boss-elevated text-boss-primary' : 'text-boss-text-muted'
              }`}
            >
              등록일순
            </button>
            <button
              type="button"
              onClick={() => setSort('CONSTRUCTION_DATE')}
              className={`h-8 rounded-md px-3 ${
                sort === 'CONSTRUCTION_DATE' ? 'bg-boss-elevated text-boss-primary' : 'text-boss-text-muted'
              }`}
            >
              시공일순
            </button>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/construction/new"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-semibold text-emerald-950 hover:bg-boss-primary-hover"
          >
            <Plus size={14} /> 시공 기록 등록
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-boss-border bg-boss-surface p-4">
          <p className="text-xs text-boss-text-muted">전체</p>
          <p className="mt-1 text-xl font-bold text-boss-text">{counts.all}</p>
        </div>
        <div className="rounded-xl border border-boss-border bg-boss-surface p-4">
          <p className="flex items-center gap-1 text-xs text-boss-text-muted">
            <Clock3 size={12} /> 진행중
          </p>
          <p className="mt-1 text-xl font-bold text-boss-warning">{counts['진행중']}</p>
        </div>
        <div className="rounded-xl border border-boss-border bg-boss-surface p-4">
          <p className="flex items-center gap-1 text-xs text-boss-text-muted">
            <CheckCircle2 size={12} /> 완료
          </p>
          <p className="mt-1 text-xl font-bold text-boss-primary">{counts['완료']}</p>
        </div>
        <div className="rounded-xl border border-boss-border bg-boss-surface p-4">
          <p className="flex items-center gap-1 text-xs text-boss-text-muted">
            <ImageIcon size={12} /> 등록 사진
          </p>
          <p className="mt-1 text-xl font-bold text-boss-info">{totalImages}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap items-center gap-1 border-b border-boss-border">
        {STATUS_TABS.map(({ key, label }) => {
          const active = statusTab === key;
          const count = key === 'all' ? counts.all : counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusTab(key)}
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
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-boss-primary" />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 그리드 */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-boss-border bg-boss-surface"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">표시할 시공 기록이 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">
            새 시공 기록을 등록하거나 필터를 변경해보세요.
          </p>
          <Link
            href="/boss/construction/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-boss-primary px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-boss-primary-hover"
          >
            <Plus size={12} /> 시공 기록 등록
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const thumb = thumbnail(item);
            const total = totalImageCount(item);
            const isDone = item.status === '완료';
            return (
              <Link
                key={String(item.id)}
                href={`/boss/construction/${item.id}`}
                className="group relative overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/50 transition-all hover:-translate-y-0.5 hover:border-boss-primary/20 hover:shadow-boss-lg hover:shadow-emerald-500/5"
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-boss-bg">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-boss-text-muted">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  {/* 상태 배지 */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                        isDone
                          ? 'bg-boss-primary/20 text-boss-primary ring-boss-primary/30'
                          : 'bg-boss-warning/20 text-boss-warning ring-amber-500/30'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={10} /> : <Clock3 size={10} />}
                      {item.status}
                    </span>
                  </div>
                  {/* 사진 카운트 */}
                  {total > 0 && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-boss-text backdrop-blur">
                      <ImageIcon size={10} /> {total}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-boss-text-secondary">
                      <Calendar size={11} />
                      {formatDate(item.constructionDate)}
                    </div>
                    {item.orderId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-boss-info/20 px-2 py-0.5 text-[10px] text-boss-info ring-1 ring-inset ring-boss-info/30">
                        <Link2 size={10} /> 주문 #{item.orderId}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 본문 */}
                <div className="p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[11px] text-boss-text-muted">#{String(item.id)}</span>
                    <ArrowUpRight
                      size={14}
                      className="ml-auto text-boss-primary opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                  <h3 className="mb-1 line-clamp-1 text-base font-semibold text-boss-text">
                    {item.title || '제목 없음'}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-xs text-boss-text-muted">
                    {item.description || '설명이 없습니다.'}
                  </p>
                  {/* BEFORE/DURING/AFTER mini stats */}
                  <div className="grid grid-cols-3 gap-2 border-t border-boss-border pt-3 text-xs">
                    <div className="rounded-md bg-boss-elevated/60 px-2 py-1.5 text-center">
                      <p className="text-[10px] text-boss-text-muted">시공 전</p>
                      <p className="font-semibold text-boss-text">{item.beforeImages.length}</p>
                    </div>
                    <div className="rounded-md bg-boss-elevated/60 px-2 py-1.5 text-center">
                      <p className="text-[10px] text-boss-text-muted">시공 중</p>
                      <p className="font-semibold text-boss-text">{item.duringImages.length}</p>
                    </div>
                    <div className="rounded-md bg-boss-elevated/60 px-2 py-1.5 text-center">
                      <p className="text-[10px] text-boss-text-muted">시공 후</p>
                      <p className="font-semibold text-boss-text">{item.afterImages.length}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}