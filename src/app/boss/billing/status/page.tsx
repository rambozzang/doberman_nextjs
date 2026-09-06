'use client';

// 구독 상태 — Industry 패턴 (참조 대시보드 QuotaPanel)
//
//   BillingNav(Seg) + 새로고침 → 구독 상태 패널(SubscriptionPanel) 하나.
//   화면 제목은 헤더(PAGE_META)가 그린다. 구독 취소는 ConfirmDialog 를 거치고,
//   성공하면 셸의 구독 정보도 갱신한다(useBossPortal().refreshSubscription()).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type { BossSubscriptionStatusResponse, BossSubscriptionState } from '@/types/boss-billing';
import { AlertBanner, Button, ButtonLink, ConfirmDialog } from '@/components/boss/ui';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import BillingNav from '../BillingNav';
import SubscriptionPanel from '../SubscriptionPanel';

export default function BillingStatusPage() {
  const router = useRouter();
  const { refreshSubscription } = useBossPortal();
  const [status, setStatus] = useState<BossSubscriptionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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

    setIsCancelling(true);
    const res = await bossBillingApi.cancel(subsId);
    if (res.success === false) {
      toast.error(res.error ?? res.message ?? '구독 취소에 실패했습니다.');
    } else {
      toast.success(res.data?.message ?? '구독이 취소되었습니다.');
      router.refresh();
      await load();
      refreshSubscription();
    }
    setIsCancelling(false);
    setCancelOpen(false);
  }, [status?.subscriptionId, load, router, refreshSubscription]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <BillingNav />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => void load()}
          disabled={isLoading}
        >
          새로고침
        </Button>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      <SubscriptionPanel
        status={status}
        state={subscriptionState}
        loading={isLoading}
        actions={
          <>
            <ButtonLink href="/boss/billing/plans" variant="secondary" size="sm">
              요금제 비교
            </ButtonLink>
            <ButtonLink href="/boss/billing/history" variant="secondary" size="sm">
              결제 내역
            </ButtonLink>
            {isActive && status?.subscriptionId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelOpen(true)}
                disabled={isCancelling}
                className="!text-boss-error"
              >
                {isCancelling ? '취소 중…' : '구독 취소'}
              </Button>
            )}
          </>
        }
      />

      <ConfirmDialog
        open={cancelOpen}
        title="구독을 취소하시겠습니까?"
        description="취소하면 자동 갱신이 멈추고 만료일 이후에는 플랜 혜택을 이용할 수 없습니다. 다시 이용하려면 요금제에서 새로 신청해야 합니다."
        confirmLabel="구독 취소"
        loading={isCancelling}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => void handleCancel()}
      />
    </div>
  );
}
