'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  XCircle,
  Sparkles,
  Receipt,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type {
  BossSubscriptionStatusResponse,
  BossSubscriptionState,
  BossPurchaseHistoryItem,
  BossBillingPlan,
  BossCreateSubscriptionRequest,
} from '@/types/boss-billing';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  EmptyState,
  Skeleton,
  SectionHeader,
} from '@/components/boss/ui';

type BadgeTone = 'default' | 'emerald' | 'amber' | 'rose';

const STATE_LABEL: Record<BossSubscriptionState, string> = {
  ACTIVE: '구독중',
  GRACE_PERIOD: '결제 보류',
  EXPIRED: '만료됨',
  NONE: '비활성',
  ERROR: '오류',
};

const STATE_TONE: Record<BossSubscriptionState, BadgeTone> = {
  ACTIVE: 'emerald',
  GRACE_PERIOD: 'amber',
  EXPIRED: 'rose',
  NONE: 'default',
  ERROR: 'rose',
};

function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
    try {
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
      setHistory(historyRes.success !== false ? historyRes.data?.items ?? [] : []);
      setPlans(plansRes.success !== false ? plansRes.data?.plans ?? [] : []);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '결제 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
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
    if (typeof window !== 'undefined' && !window.confirm('정말 구독을 취소하시겠습니까?')) return;
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
    <div className="space-y-4">
      <PageHeader
        eyebrow="Billing"
        title="결제 관리"
        description="구독 상태, 결제 이력, 이용 가능한 플랜을 한곳에서 관리합니다."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => void loadAll()}
            disabled={isLoading}
          >
            새로고침
          </Button>
        }
      />

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-boss-primary/30 bg-boss-primary/10 p-3 text-sm text-boss-primary">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 구독 상태 */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-boss-primary" />
            <h2 className="text-sm font-semibold text-boss-text">현재 구독 상태</h2>
          </div>
          <Badge tone={STATE_TONE[subscriptionState]}>{STATE_LABEL[subscriptionState]}</Badge>
        </div>

        {isLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile label="상품명" value={status?.productName ?? status?.entitlement?.productName ?? '-'} />
            <InfoTile label="시작일" value={formatDate(status?.startDate ?? status?.entitlement?.originalPurchaseDate)} />
            <InfoTile label="만료일" value={formatDate(status?.expirationDate ?? status?.entitlement?.expirationDate)} />
            <InfoTile label="자동 갱신" value={(status?.willRenew ?? status?.entitlement?.willRenew) ? '사용' : '미사용'} />
          </div>
        )}

        {isActive && status?.subscriptionId && (
          <div className="mt-4 flex justify-end border-t border-boss-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              icon={XCircle}
              onClick={() => void handleCancel()}
              disabled={isCancelling}
              className="text-boss-error hover:bg-boss-error/10"
            >
              {isCancelling ? '취소 중...' : '구독 취소'}
            </Button>
          </div>
        )}
      </Card>

      {/* 플랜 목록 */}
      <Card>
        <SectionHeader title="이용 가능한 플랜" />
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <EmptyState title="현재 이용 가능한 플랜이 없습니다" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const purchasing = actionPlanId === plan.planId;
              return (
                <div
                  key={plan.planId}
                  className={`flex flex-col rounded-lg border p-5 transition ${
                    plan.isPopular
                      ? 'border-boss-primary/30 bg-boss-primary/5'
                      : 'border-boss-border bg-boss-surface'
                  }`}
                >
                  {plan.isPopular && (
                    <Badge tone="emerald" className="mb-2 self-start">POPULAR</Badge>
                  )}
                  <h3 className="text-base font-semibold text-boss-text">{plan.title}</h3>
                  {plan.description && (
                    <p className="mt-1 text-xs text-boss-text-muted">{plan.description}</p>
                  )}
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-boss-primary">{formatPrice(plan)}</span>
                    {plan.periodUnit && (
                      <span className="text-[11px] text-boss-text-muted">
                        / {plan.periodLength ?? 1} {plan.periodUnit.toLowerCase()}
                      </span>
                    )}
                  </div>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="mt-4 flex-1 space-y-1.5 text-xs text-boss-text-secondary">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-boss-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant={plan.isPopular ? 'primary' : 'secondary'}
                    size="sm"
                    icon={CreditCard}
                    onClick={() => void handleSubscribe(plan)}
                    disabled={purchasing || isActive}
                    className="mt-5 w-full"
                  >
                    {purchasing ? '처리 중...' : isActive ? '이미 구독중' : '구독 신청'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 구매 이력 */}
      <Card padded={false}>
        <div className="border-b border-boss-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Receipt size={15} className="text-boss-primary" />
            <h2 className="text-sm font-semibold text-boss-text">구매 이력</h2>
          </div>
        </div>
        {isLoading ? (
          <div className="p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-10 w-full rounded" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-6">
            <EmptyState title="구매 이력이 없습니다" />
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>상품</th>
                <th>결제일</th>
                <th>만료일</th>
                <th className="text-right">금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={item.transactionId ?? `${item.productId}-${idx}`}>
                  <td>
                    <p className="font-medium text-boss-text">{item.productName ?? item.productId ?? '-'}</p>
                    {item.store && <p className="text-xs text-boss-text-muted">{item.store}</p>}
                  </td>
                  <td className="text-boss-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {formatDate(item.purchaseDate)}
                    </span>
                  </td>
                  <td className="text-boss-text-secondary">{formatDate(item.expirationDate)}</td>
                  <td className="text-right font-medium text-boss-text">
                    {item.amount != null ? `${item.amount.toLocaleString('ko-KR')} ${item.currency ?? ''}`.trim() : '-'}
                  </td>
                  <td>
                    <Badge tone="default">{item.status ?? '-'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-boss-border bg-boss-bg p-3">
      <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-boss-text">{value}</p>
    </div>
  );
}
