'use client';

// 사장님 체크리스트 목록 페이지
// Flutter `lib/app/check_list/check_lilst_page.dart` 의 React 포팅 버전
// - 현재 로그인 사장님의 customerId 로 단일 체크리스트를 조회
// - 데이터가 있으면 카드 1건, 없으면 빈 상태 노출
// - 신규 작성 / 인쇄 페이지로 이동, 삭제 기능 제공
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ClipboardCheck,
  Plus,
  Printer,
  Trash2,
  RefreshCw,
  Inbox,
  Home,
  Ruler,
  Wallet,
} from 'lucide-react';
import { bossChecklistApi } from '@/lib/api/boss/checklist';
import { getBossCustId } from '@/lib/api/boss/as';
import type { CheckData } from '@/types/boss-checklist';

export default function BossChecklistPage() {
  const [data, setData] = useState<CheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>('');

  // 체크리스트 조회
  const load = useCallback(async () => {
    const cid = getBossCustId();
    setCustomerId(cid);
    if (!cid) {
      setError('로그인 정보가 없습니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossChecklistApi.get(cid);
      if (res.success) {
        setData(res.data ?? null);
      } else {
        // 데이터 없음은 에러로 취급하지 않음
        setData(null);
      }
    } catch {
      setError('체크리스트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 삭제 처리
  const handleDelete = async () => {
    if (!customerId) return;
    if (!confirm('체크리스트를 삭제하시겠습니까?')) return;
    try {
      const res = await bossChecklistApi.remove(customerId);
      if (res.success !== false) {
        toast.success('삭제되었습니다.');
        setData(null);
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  // 천 단위 콤마
  const fmtMoney = (v?: string) => {
    if (!v) return '0';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return n.toLocaleString('ko-KR');
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ClipboardCheck size={22} className="text-boss-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">체크리스트</h1>
          </div>
          <p className="text-sm text-boss-text-muted">
            현장 실측 체크리스트를 작성하고 인쇄용으로 출력하세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/checklist/new"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-medium text-boss-text hover:bg-boss-primary-hover"
          >
            <Plus size={14} /> 새 체크리스트
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 컨텐츠 */}
      {loading && !data ? (
        <div className="h-40 animate-pulse rounded-2xl border border-boss-border bg-boss-surface" />
      ) : !data ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">등록된 체크리스트가 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">새 체크리스트를 작성해 보세요.</p>
          <Link
            href="/boss/checklist/new"
            className="mt-4 flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-4 text-sm font-medium text-boss-text hover:bg-boss-primary-hover"
          >
            <Plus size={14} /> 새 체크리스트
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-boss-border bg-boss-surface/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-boss-primary/10 px-2 py-0.5 text-[10px] font-semibold text-boss-primary ring-1 ring-inset ring-boss-primary/30">
              작성됨
            </span>
            <span className="text-xs text-boss-text-muted">고객 ID: {data.customerId || customerId}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-bg/40 p-3">
              <Home size={14} className="text-boss-text-muted" />
              <div className="text-xs text-boss-text-muted">주거형태</div>
              <div className="ml-auto text-sm text-boss-text">
                {data.housingType || '-'}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-bg/40 p-3">
              <Ruler size={14} className="text-boss-text-muted" />
              <div className="text-xs text-boss-text-muted">면적</div>
              <div className="ml-auto text-sm text-boss-text">
                {data.areaText ? `${data.areaText}㎡` : '-'}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-bg/40 p-3">
              <Wallet size={14} className="text-boss-text-muted" />
              <div className="text-xs text-boss-text-muted">총액</div>
              <div className="ml-auto text-sm font-semibold text-boss-primary">
                {fmtMoney(data.totalPrice)}원
              </div>
            </div>
          </div>

          {data.bigo && (
            <div className="mt-4 rounded-lg border border-boss-border bg-boss-bg/40 p-3 text-sm text-boss-text-secondary">
              <div className="mb-1 text-[10px] font-semibold uppercase text-boss-text-muted">비고</div>
              {data.bigo}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-boss-border pt-4">
            <Link
              href={`/boss/checklist/${encodeURIComponent(data.customerId || customerId)}/print`}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text hover:border-boss-primary/20 hover:text-boss-primary"
            >
              <Printer size={14} /> 인쇄
            </Link>
            <Link
              href={`/boss/checklist/new?edit=1`}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text hover:border-boss-border hover:text-boss-text"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-rose-800/60 bg-rose-950/30 px-3 text-sm text-boss-error hover:bg-rose-950/60"
            >
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
