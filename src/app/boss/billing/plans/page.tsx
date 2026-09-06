'use client';

// 요금제 — Industry 패턴 (참조 agent/billing 의 광고 상품 카드)
//
//   BillingNav(Seg) + 새로고침 → 사각 플랜 패널 나열(sm 2열 · lg 3열).
//   추천 플랜은 accent 테두리 + outline 태그(Badge tone="violet"). 가격은 26px Barlow Condensed.
//   화면 제목은 헤더(PAGE_META)가 그린다. 신청이 성공하면 셸의 구독 정보도 갱신한다.

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type { BossBillingPlan } from '@/types/boss-billing';
import { AlertBanner, Badge, Button, EmptyState, Skeleton } from '@/components/boss/ui';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import BillingNav from '../BillingNav';
import { formatPrice, formatPeriod } from '../utils';

export default function BillingPlansPage() {
  const router = useRouter();
  const { refreshSubscription } = useBossPortal();
  const [plans, setPlans] = useState<BossBillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPlanId, setActionPlanId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await bossBillingApi.getPlans();
    if (res.success === false) {
      setError(res.error ?? res.message ?? '요금제 정보를 불러오지 못했습니다.');
      setPlans([]);
    } else {
      setPlans(res.data?.plans ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = useCallback(
    async (plan: BossBillingPlan) => {
      setActionPlanId(plan.planId);
      const res = await bossBillingApi.create({
        subsType: plan.productId ?? plan.planId,
        autoRenew: true,
      });
      if (res.success === false) {
        toast.error(res.error ?? res.message ?? '요금제 선택에 실패했습니다.');
      } else {
        toast.success(res.data?.message ?? '구독이 신청되었습니다.');
        router.refresh();
        await load();
        refreshSubscription();
      }
      setActionPlanId(null);
    },
    [load, router, refreshSubscription],
  );

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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PlanSkeleton />
          <PlanSkeleton />
          <PlanSkeleton />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          title={error ? '요금제를 불러오지 못했습니다' : '지금 신청할 수 있는 요금제가 없습니다'}
          description={
            error
              ? '네트워크 상태를 확인하고 새로고침해주세요.'
              : '판매 중인 요금제가 없습니다. 잠시 후 다시 확인하거나 고객센터로 문의해주세요.'
          }
          action={
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void load()}>
              새로고침
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isProcessing = actionPlanId === plan.planId;
            return (
              <section
                key={plan.planId}
                className={`boss-card flex flex-col gap-2.5 p-5 ${
                  plan.isPopular ? '!border-boss-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="boss-section-title">{plan.title}</h3>
                  {plan.isPopular && <Badge tone="violet">추천</Badge>}
                </div>
                {plan.description && (
                  <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
                    {plan.description}
                  </p>
                )}

                <div className="flex items-baseline gap-1">
                  <span className="font-boss-head text-[26px] font-semibold leading-none tabular-nums text-boss-text">
                    {formatPrice(plan)}
                  </span>
                  <span className="text-[12px] text-boss-text-muted">{formatPeriod(plan)}</span>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="flex-1 space-y-1.5 border-t border-boss-border-row pt-2.5 text-[12.5px] leading-relaxed text-boss-text-secondary">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <span className="mt-[7px] h-1 w-1 flex-none bg-boss-primary" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant={plan.isPopular ? 'primary' : 'secondary'}
                  size="md"
                  className="mt-2 w-full"
                  onClick={() => void handleSelect(plan)}
                  disabled={isProcessing}
                >
                  {isProcessing ? '처리 중…' : '이 플랜 신청'}
                </Button>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-[12px] leading-relaxed text-boss-text-muted">
        신청하면 자동 갱신으로 시작됩니다. 구독 취소는 구독 상태 화면에서 할 수 있습니다.
      </p>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="boss-card p-5" aria-busy>
      <Skeleton className="mb-2 h-5 w-24" />
      <Skeleton className="mb-4 h-4 w-full" />
      <Skeleton className="mb-5 h-8 w-32" />
      <div className="mb-5 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
