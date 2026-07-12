'use client';

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
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

export default function BossChecklistPage() {
  const [data, setData] = useState<CheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>('');

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

  const fmtMoney = (v?: string) => {
    if (!v) return '0';
    const n = Number(String(v).replace(/,/g, ''));
    if (Number.isNaN(n)) return v;
    return n.toLocaleString('ko-KR');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="체크리스트"
        description="현장 실측 체크리스트를 작성하고 인쇄용으로 출력하세요."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={load}
              disabled={loading}
            >
              새로고침
            </Button>
            <Link href="/boss/checklist/new">
              <Button variant="primary" size="sm" icon={Plus}>
                새 체크리스트
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && !data ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : !data ? (
        <EmptyState
          icon={Inbox}
          title="등록된 체크리스트가 없습니다"
          description="새 체크리스트를 작성해 보세요."
          action={
            <Link href="/boss/checklist/new">
              <Button variant="primary" size="sm" icon={Plus}>
                새 체크리스트
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Badge tone="emerald">
              <ClipboardCheck size={10} /> 작성됨
            </Badge>
            <span className="text-xs text-boss-text-muted">고객 ID: {data.customerId || customerId}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-bg p-3">
              <Home size={14} className="shrink-0 text-boss-text-muted" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">주거형태</p>
                <p className="text-sm text-boss-text">{data.housingType || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-bg p-3">
              <Ruler size={14} className="shrink-0 text-boss-text-muted" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">면적</p>
                <p className="text-sm text-boss-text">{data.areaText ? `${data.areaText}㎡` : '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-bg p-3">
              <Wallet size={14} className="shrink-0 text-boss-text-muted" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">총액</p>
                <p className="text-sm font-semibold text-boss-primary">{fmtMoney(data.totalPrice)}원</p>
              </div>
            </div>
          </div>

          {data.bigo && (
            <div className="mt-4 rounded-lg border border-boss-border bg-boss-bg p-3 text-sm text-boss-text-secondary">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">비고</p>
              {data.bigo}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-boss-border pt-4">
            <Link href={`/boss/checklist/${encodeURIComponent(data.customerId || customerId)}/print`}>
              <Button variant="secondary" size="sm" icon={Printer}>
                인쇄
              </Button>
            </Link>
            <Link href="/boss/checklist/new?edit=1">
              <Button variant="secondary" size="sm">
                수정
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={handleDelete}
              className="ml-auto text-boss-error hover:bg-boss-error/10"
            >
              삭제
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
