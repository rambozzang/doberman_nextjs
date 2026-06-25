'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type { BossBillingPlan } from '@/types/boss-billing';
import { PageHeader, Card, Button, EmptyState, Skeleton } from '@/components/boss/ui';
import BillingNav from '../BillingNav';
import { formatPrice, formatPeriod } from '../utils';

export default function BillingPlansPage() {
  const router = useRouter();
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
      }
      setActionPlanId(null);
    },
    [load, router],
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Billing"
        title="요금제"
        description="이용 가능한 요금제를 비교하고 선택하세요."
        breadcrumbs={[{ label: '결제 관리', href: '/boss/billing' }, { label: '요금제' }]}
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

      <Link
        href="/boss/billing"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={14} /> 결제 관리로 돌아가기
      </Link>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-medium text-rose-300 hover:text-rose-200"
          >
            다시 시도
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PlanSkeleton />
          <PlanSkeleton />
          <PlanSkeleton />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="이용 가능한 요금제가 없습니다"
          description="잠시 후 다시 확인해주세요."
          action={
            <Button variant="secondary" icon={RefreshCw} onClick={() => void load()}>
              새로 고침
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isProcessing = actionPlanId === plan.planId;
            return (
              <Card
                key={plan.planId}
                className={`relative flex flex-col rounded-2xl border-slate-800 bg-slate-900/40 p-6 ${
                  plan.isPopular
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      <Sparkles size={10} />
                      인기
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-100">{plan.title}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                )}

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatPrice(plan)}
                  </span>
                  <span className="text-xs text-slate-400">{formatPeriod(plan)}</span>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant="primary"
                  size="md"
                  icon={isProcessing ? Loader2 : CreditCard}
                  className="mt-6 w-full"
                  onClick={() => void handleSelect(plan)}
                  disabled={isProcessing}
                >
                  {isProcessing ? '처리 중...' : '선택'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlanSkeleton() {
  return (
    <Card className="rounded-2xl border-slate-800 bg-slate-900/40 p-6">
      <Skeleton className="mb-2 h-5 w-24" />
      <Skeleton className="mb-4 h-4 w-full" />
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="mb-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Skeleton className="h-10 w-full" />
    </Card>
  );
}
