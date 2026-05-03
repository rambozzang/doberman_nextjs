'use client';

// 사장님 결제/구독 관리 페이지
// Flutter 참조:
//  - lib/app/payments/views/subscription_status_page.dart
//  - lib/app/payments/views/subscription_page.dart
//  - lib/app/payments/views/subscription_renewal_history_page.dart

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  XCircle,
  Sparkles,
  Receipt,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type {
  BossSubscriptionStatusResponse,
  BossSubscriptionState,
  BossPurchaseHistoryItem,
  BossBillingPlan,
  BossCreateSubscriptionRequest,
} from '@/types/boss-billing';

const STATE_LABEL: Record<BossSubscriptionState, string> = {
  ACTIVE: '구독중',
  GRACE_PERIOD: '결제 보류',
  EXPIRED: '만료됨',
  NONE: '비활성',
  ERROR: '오류',
};

const STATE_BADGE: Record<BossSubscriptionState, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  GRACE_PERIOD: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  EXPIRED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  NONE: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  ERROR: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return value;
  }
}

function formatPrice(plan: BossBillingPlan): string {
  if (plan.priceString) return plan.priceString;
  if (plan.priceAmount != null) {
    const currency = plan.currencyCode ?? 'KRW';
    try {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(plan.priceAmount);
    } catch {
      return `${plan.priceAmount.toLocaleString('ko-KR')}원`;
    }
  }
  return '가격 문의';
}

export default function BossBillingPage() {
  const [status, setStatus] = useState<BossSubscriptionStatusResponse | null>(null);
  const [history, setHistory] = useState<BossPurchaseHistoryItem[]>([]);
  const [plans, setPlans] = useState<BossBillingPlan[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [actionPlanId, setActionPlanId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [statusRes, historyRes, plansRes] = await Promise.all([
      bossBillingApi.getStatus(),
      bossBillingApi.getHistory(),
      bossBillingApi.getPlans(),
    ]);

    if (statusRes.success === false) {
      setErrorMessage(statusRes.error ?? statusRes.message ?? '구독 정보를 불러오지 못했습니다.');
    } else {
      setStatus(statusRes.data ?? null);
    }

    if (historyRes.success !== false && historyRes.data) {
      setHistory(historyRes.data.items ?? []);
    } else {
      setHistory([]);
    }

    if (plansRes.success !== false && plansRes.data) {
      setPlans(plansRes.data.plans ?? []);
    } else {
      setPlans([]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const subscriptionState: BossSubscriptionState = useMemo(() => {
    if (!status) return 'NONE';
    if (status.status) return status.status;
    if (status.isActive) return 'ACTIVE';
    return 'NONE';
  }, [status]);

  const isActive = subscriptionState === 'ACTIVE' || subscriptionState === 'GRACE_PERIOD';

  const handleSubscribe = useCallback(
    async (plan: BossBillingPlan) => {
      setActionPlanId(plan.planId);
      setActionMessage(null);
      const payload: BossCreateSubscriptionRequest = {
        subsType: plan.productId ?? plan.planId,
        autoRenew: true,
      };
      const res = await bossBillingApi.create(payload);
      if (res.success === false) {
        setActionMessage(res.error ?? res.message ?? '구독 생성에 실패했습니다.');
      } else {
        setActionMessage(res.data?.message ?? '구독이 신청되었습니다.');
        await loadAll();
      }
      setActionPlanId(null);
    },
    [loadAll],
  );

  const handleCancel = useCallback(async () => {
    const subsId = status?.subscriptionId;
    if (!subsId) {
      setActionMessage('취소할 구독 ID를 찾을 수 없습니다.');
      return;
    }
    if (typeof window !== 'undefined') {
      const ok = window.confirm('정말 구독을 취소하시겠습니까?');
      if (!ok) return;
    }
    setIsCancelling(true);
    setActionMessage(null);
    const res = await bossBillingApi.cancel(subsId);
    if (res.success === false) {
      setActionMessage(res.error ?? res.message ?? '구독 취소에 실패했습니다.');
    } else {
      setActionMessage(res.data?.message ?? '구독이 취소되었습니다.');
      await loadAll();
    }
    setIsCancelling(false);
  }, [status?.subscriptionId, loadAll]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CreditCard className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Billing</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl">결제 관리</h1>
            <p className="mt-1 text-sm text-slate-400">
              구독 상태, 결제 이력, 이용 가능한 플랜을 한곳에서 관리합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            새로 고침
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {actionMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 구독 상태 카드 */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold">현재 구독 상태</h2>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATE_BADGE[subscriptionState]}`}
            >
              {STATE_LABEL[subscriptionState]}
            </span>
          </div>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              구독 정보를 불러오는 중...
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoTile
                label="상품명"
                value={status?.productName ?? status?.entitlement?.productName ?? '-'}
              />
              <InfoTile
                label="시작일"
                value={formatDate(
                  status?.startDate ?? status?.entitlement?.originalPurchaseDate,
                )}
              />
              <InfoTile
                label="만료일"
                value={formatDate(status?.expirationDate ?? status?.entitlement?.expirationDate)}
              />
              <InfoTile
                label="자동 갱신"
                value={
                  (status?.willRenew ?? status?.entitlement?.willRenew) ? '사용' : '미사용'
                }
              />
            </div>
          )}

          {isActive && status?.subscriptionId && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={isCancelling}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                구독 취소
              </button>
            </div>
          )}
        </section>

        {/* 플랜 목록 */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-slate-300">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold">이용 가능한 플랜</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              플랜 정보를 불러오는 중...
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
              현재 이용 가능한 플랜이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const purchasing = actionPlanId === plan.planId;
                return (
                  <div
                    key={plan.planId}
                    className={`flex flex-col rounded-2xl border bg-slate-900/60 p-6 transition ${
                      plan.isPopular
                        ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.isPopular && (
                      <span className="mb-3 self-start rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        Popular
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-slate-100">{plan.title}</h3>
                    {plan.description && (
                      <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                    )}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatPrice(plan)}
                      </span>
                      {plan.periodUnit && (
                        <span className="text-xs text-slate-400">
                          / {plan.periodLength ?? 1} {plan.periodUnit.toLowerCase()}
                        </span>
                      )}
                    </div>
                    {plan.features && plan.features.length > 0 && (
                      <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSubscribe(plan)}
                      disabled={purchasing || isActive}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {purchasing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      {isActive ? '이미 구독중' : '구독 신청'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 구매 이력 */}
        <section>
          <div className="mb-4 flex items-center gap-2 text-slate-300">
            <Receipt className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold">구매 이력</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              구매 이력을 불러오는 중...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
              구매 이력이 없습니다.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">상품</th>
                    <th className="px-4 py-3 text-left font-semibold">결제일</th>
                    <th className="px-4 py-3 text-left font-semibold">만료일</th>
                    <th className="px-4 py-3 text-right font-semibold">금액</th>
                    <th className="px-4 py-3 text-left font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {history.map((item, idx) => (
                    <tr key={item.transactionId ?? `${item.productId}-${idx}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.productName ?? item.productId ?? '-'}</div>
                        {item.store && (
                          <div className="mt-0.5 text-xs text-slate-500">{item.store}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {formatDate(item.purchaseDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatDate(item.expirationDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-100">
                        {item.amount != null
                          ? `${item.amount.toLocaleString('ko-KR')} ${item.currency ?? ''}`.trim()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-300">
                          {item.status ?? '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}
