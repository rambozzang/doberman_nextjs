'use client';

// AS 요청 목록 페이지
// Flutter: as_request_list_page.dart 포팅
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Plus,
  RefreshCw,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Link2,
  ChevronDown,
} from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsRequestItem } from '@/types/boss-as';

type StatusFilter = '' | '접수' | '진행중' | '완료';
type SortType = 'CREATED_DT' | 'REQUEST_DATE';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: '접수', label: '접수' },
  { value: '진행중', label: '진행중' },
  { value: '완료', label: '완료' },
];

function statusColor(status: string): string {
  switch (status) {
    case '접수':
      return 'bg-sky-500/10 text-sky-300 ring-sky-500/30';
    case '진행중':
      return 'bg-amber-500/10 text-amber-300 ring-amber-500/30';
    case '완료':
      return 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30';
    case '취소':
      return 'bg-slate-700/40 text-slate-300 ring-slate-600/30';
    default:
      return 'bg-slate-700/40 text-slate-300 ring-slate-600/30';
  }
}

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default function BossAsListPage() {
  const [items, setItems] = useState<AsRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [sortType, setSortType] = useState<SortType>('CREATED_DT');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const load = useCallback(async () => {
    const custId = getBossCustId();
    if (!custId) {
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossAsApi.list(custId, statusFilter || undefined);
      if (res.success !== false && res.data) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message || 'AS 요청 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // 최초 로드 + 상태 필터 변경 시 재조회
  useEffect(() => {
    load();
  }, [load, statusFilter]);

  // 정렬된 목록
  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortType === 'REQUEST_DATE') {
      list.sort((a, b) => (b.requestDate || '').localeCompare(a.requestDate || ''));
    } else {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    return list;
  }, [items, sortType]);

  const currentStatusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? '전체';

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Wrench size={20} className="text-indigo-300" />
            <h1 className="text-2xl font-bold tracking-tight text-white">AS 요청</h1>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {sortedItems.length.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-slate-400">하자보수 AS 요청을 관리하고 처리 상태를 변경하세요.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/boss/as/new"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 text-sm text-indigo-200 hover:border-indigo-400 hover:text-white"
          >
            <Plus size={14} /> 등록
          </Link>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
        </div>
      </div>

      {/* 정렬/필터 바 */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSortType('CREATED_DT')}
            className={`h-8 rounded-md px-3 text-xs font-bold ${
              sortType === 'CREATED_DT' ? 'bg-white text-black' : 'bg-transparent text-slate-300 hover:text-white'
            }`}
          >
            등록일
          </button>
          <button
            type="button"
            onClick={() => setSortType('REQUEST_DATE')}
            className={`h-8 rounded-md px-3 text-xs font-bold ${
              sortType === 'REQUEST_DATE' ? 'bg-white text-black' : 'bg-transparent text-slate-300 hover:text-white'
            }`}
          >
            요청일
          </button>
        </div>

        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setStatusMenuOpen((v) => !v)}
            className="flex h-8 items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:border-slate-600"
          >
            {currentStatusLabel}
            <ChevronDown size={12} />
          </button>
          {statusMenuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setStatusMenuOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-800 ${
                    statusFilter === opt.value ? 'text-emerald-300' : 'text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>
      )}

      {/* 콘텐츠 */}
      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-slate-200">
            {statusFilter ? `'${statusFilter}' 상태의 AS 요청이 없습니다` : '등록된 AS 요청이 없습니다'}
          </p>
          <Link
            href="/boss/as/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/30"
          >
            <Plus size={12} /> AS 요청 등록
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => {
            const defectCount = item.images?.filter((i) => i.imageType === 'DEFECT').length ?? 0;
            const repairCount = item.images?.filter((i) => i.imageType === 'REPAIR').length ?? 0;
            return (
              <Link
                key={item.id}
                href={`/boss/as/${item.id}`}
                className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                {/* 상단: 요청일 + 우선순위 + 상태 */}
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-indigo-300">요청</span>
                  <span className="font-medium text-slate-200">{formatDate(item.requestDate)}</span>
                  <span className="ml-auto" />
                  {item.priority === '긴급' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      <AlertTriangle size={10} /> 긴급
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* 제목 */}
                <h3 className="mb-1 line-clamp-1 text-base font-bold text-white">{item.title}</h3>

                {/* 고객명 + 전화 */}
                <p className="mb-1 line-clamp-1 text-sm text-slate-300">
                  {item.customerName}
                  {item.customerPhone ? ` / ${item.customerPhone}` : ''}
                </p>

                {/* 주소 */}
                {item.address && (
                  <p className="mb-2 line-clamp-1 text-xs text-slate-500">{item.address}</p>
                )}

                {/* 칩 */}
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {item.orderId != null && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-pink-500/15 px-2 py-1 text-[11px] font-semibold text-pink-300">
                      <Link2 size={10} /> 주문연결
                    </span>
                  )}
                  {defectCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-200">
                      <ImageIcon size={10} /> 하자 {defectCount}
                    </span>
                  )}
                  {repairCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                      <CheckCircle2 size={10} /> 수리 {repairCount}
                    </span>
                  )}
                </div>

                {/* 하단 메타 */}
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock size={10} />
                  <span>등록 {formatDate(item.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
