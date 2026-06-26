'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
  Package,
  RefreshCw,
  Repeat,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type { BossSubscriptionStatusResponse, BossSubscriptionState } from '@/types/boss-billing';
import { PageHeader, Card, Button, Badge, Skeleton } from '@/components/boss/ui';
import BillingNav from '../BillingNav';
import { formatDate, STATE_LABEL } from '../utils';

const STATE_TONE: Record<BossSubscriptionState, 'emerald' | 'amber' | 'rose' | 'default'> = {
  ACTIVE: 'emerald',
  GRACE_PERIOD: 'amber',
  EXPIRED: 'rose',
  NONE: 'default',
  ERROR: 'rose',
};

export default function BillingStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<BossSubscriptionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await bossBillingApi.getStatus();
    if (res.success === false) {
      setError(res.error ?? res.message ?? '구독 정보를 불러오지 못했습니다.');
      setStatus(null);
    } else {
      setStatus(res.data ?? null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const subscriptionState: BossSubscriptionState = useMemo(() => {
    if (!status) return 'NONE';
    if (status.status) return status.status;
    if (status.isActive) return 'ACTIVE';
    return 'NONE';
  }, [status]);

  const isActive = subscriptionState === 'ACTIVE' || subscriptionState === 'GRACE_PERIOD';

  const handleCancel = useCallback(async () => {
    const subsId = status?.subscriptionId;
    if (!subsId) {
      toast.error('취소할 구독 ID를 찾을 수 없습니다.');
      return;
    }
    if (!window.confirm('정말 구독을 취소하시겠습니까?')) return;

    setIsCancelling(true);
    const res = await bossBillingApi.cancel(subsId);
    if (res.success === false) {
      toast.error(res.error ?? res.message ?? '구독 취소에 실패했습니다.');
    } else {
      toast.success(res.data?.message ?? '구독이 취소되었습니다.');
      router.refresh();
      await load();
    }
    setIsCancelling(false);
  }, [status?.subscriptionId, load, router]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Billing"
        title="결제 현황"
        description="현재 구독 상태와 만료일, 자동 갱신 설정을 확인하세요."
        breadcrumbs={[{ label: '결제 관리', href: '/boss/billing' }, { label: '결제 현황' }]}
        actions={
          <Button
            variant="secondary"
            icon={isLoading ? Loader2 : RefreshCw}
            onClick={() => void load()}
            disabled={isLoading}
          >
            새로 고침
          </Button>
        }
      />

      <BillingNav />

      <LinkBack />

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-boss-error/10 px-4 py-3 text-sm text-boss-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-medium text-boss-error hover:text-boss-error"
          >
            다시 시도
          </button>
        </div>
      )}

      <Card className="rounded-2xl border-boss-border bg-boss-surface">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-boss-text">
            <Activity className="h-5 w-5 text-boss-primary" />
            <h2 className="text-base font-semibold">현재 구독 상태</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <Badge tone={STATE_TONE[subscriptionState]}>{STATE_LABEL[subscriptionState]}</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              icon={Package}
              label="상품명"
              value={status?.productName ?? status?.entitlement?.productName ?? '-'}
            />
            <InfoTile
              icon={Calendar}
              label="시작일"
              value={formatDate(status?.startDate ?? status?.entitlement?.originalPurchaseDate)}
            />
            <InfoTile
              icon={CreditCard}
              label="만료일"
              value={formatDate(status?.expirationDate ?? status?.entitlement?.expirationDate)}
            />
            <InfoTile
              icon={Repeat}
              label="자동 갱신"
              value={(status?.willRenew ?? status?.entitlement?.willRenew) ? '사용' : '미사용'}
            />
          </div>
        )}

        {isActive && status?.subscriptionId && !isLoading && (
          <div className="mt-6 flex justify-end border-t border-boss-border/70 pt-5">
            <Button
              variant="danger"
              icon={isCancelling ? Loader2 : XCircle}
              onClick={() => void handleCancel()}
              disabled={isCancelling}
            >
              구독 취소
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function LinkBack() {
  return (
    <Link
      href="/boss/billing"
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-text"
    >
      <ArrowLeft size={14} /> 결제 관리로 돌아가기
    </Link>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-boss-border bg-boss-bg/60 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-boss-text-muted">
        <Icon size={12} />
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-boss-text">{value}</div>
    </div>
  );
}

function SkeletonTile() {
  return (
    <div className="rounded-xl border border-boss-border bg-boss-bg/60 px-4 py-3">
      <Skeleton className="mb-2 h-3 w-16" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
