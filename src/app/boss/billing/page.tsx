'use client';

// 구독 · 결제 — Industry 패턴 (참조 agent/billing)
//
//   BillingNav(Seg) + 새로고침
//   → 구독 상태 패널(SubscriptionPanel: 플랜명 · 남은 일수 40px · 진행바 · 시작/만료 dl)
//   → 요금제 패널: 사각 플랜 카드 나열, 추천 플랜은 accent 테두리 + outline 태그
//   → 결제 내역 표(최근) + "전체 보기 →"
//
// 화면 제목은 헤더(PAGE_META)가 그린다. 구독 취소는 되돌릴 수 없어 ConfirmDialog 를 거친다.
// 결제 · 취소가 성공하면 셸(레일 플랜 카드)도 같이 갱신한다 — useBossPortal().refreshSubscription().

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type {
  BossSubscriptionStatusResponse,
  BossSubscriptionState,
  BossPurchaseHistoryItem,
  BossBillingPlan,
  BossCreateSubscriptionRequest,
} from '@/types/boss-billing';
import {
  AlertBanner,
  Badge,
  Button,
  ButtonLink,
  CardHead,
  ConfirmDialog,
  ContentCard,
  DataTable,
  EmptyState,
  Panel,
  Skeleton,
  Tag,
} from '@/components/boss/ui';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import BillingNav from './BillingNav';
import SubscriptionPanel from './SubscriptionPanel';
import { formatAmount, formatDate, formatPeriod, formatPrice, historyStatusTone } from './utils';

export default function BossBillingPage() {
  const { refreshSubscription } = useBossPortal();
  const [status, setStatus] = useState<BossSubscriptionStatusResponse | null>(null);
  const [history, setHistory] = useState<BossPurchaseHistoryItem[]>([]);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [plans, setPlans] = useState<BossBillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionPlanId, setActionPlanId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  // 서버에 구독 API 자체가 없는 상태(준비 중)와 진짜 통신 오류를 구분한다
  const [notReady, setNotReady] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setNotReady(false);
    try {
      const [statusRes, historyRes, plansRes] = await Promise.all([
        bossBillingApi.getStatus(),
        bossBillingApi.getHistory(),
        bossBillingApi.getPlans(),
      ]);
      if (statusRes.success === false) {
        // 백엔드에 결제 API 가 아직 없다("No static resource api/subscription/...").
        // 이걸 빨간 오류로 띄우면 사장님에게는 고장난 화면으로 보인다 — 준비 중으로 안내한다.
        const raw = `${statusRes.error ?? ''} ${statusRes.message ?? ''}`;
        if (/No static resource|Not Found|404/i.test(raw)) {
          setNotReady(true);
        } else {
          setErrorMessage(statusRes.error ?? statusRes.message ?? '구독 정보를 불러오지 못했습니다.');
        }
      } else {
        setStatus(statusRes.data ?? null);
      }
      setHistoryFailed(historyRes.success === false);
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
        refreshSubscription();
      }
      setActionPlanId(null);
    },
    [loadAll, refreshSubscription],
  );

  const handleCancel = useCallback(async () => {
    const subsId = status?.subscriptionId;
    if (!subsId) {
      setActionMessage('취소할 구독 ID를 찾을 수 없습니다.');
      return;
    }
    setIsCancelling(true);
    setActionMessage(null);
    const res = await bossBillingApi.cancel(subsId);
    if (res.success === false) {
      setActionMessage(res.error ?? res.message ?? '구독 취소에 실패했습니다.');
    } else {
      setActionMessage(res.data?.message ?? '구독이 취소되었습니다.');
      await loadAll();
      refreshSubscription();
    }
    setIsCancelling(false);
    setCancelOpen(false);
  }, [status?.subscriptionId, loadAll, refreshSubscription]);

  const recentHistory = history.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <BillingNav />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => void loadAll()}
          disabled={isLoading}
        >
          새로고침
        </Button>
      </div>

      {notReady && (
        <AlertBanner tone="info">
          결제 · 구독 기능은 준비 중입니다. 지금은 <b>무료 플랜</b>으로 모든 기본 기능을 쓰실 수 있고, 이용에 제한은
          없습니다. 준비되면 이 화면에서 안내해 드리겠습니다.
        </AlertBanner>
      )}

      {errorMessage && !notReady && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="secondary" size="sm" onClick={() => void loadAll()}>
              다시 시도
            </Button>
          }
        >
          {errorMessage}
        </AlertBanner>
      )}

      {actionMessage && <AlertBanner tone="info">{actionMessage}</AlertBanner>}

      {/* 구독 상태 */}
      <SubscriptionPanel
        status={status}
        state={subscriptionState}
        loading={isLoading}
        actions={
          <>
            <ButtonLink href="/boss/billing/plans" variant="secondary" size="sm">
              요금제 비교
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

      {/* 요금제 */}
      <Panel kicker="요금제" title="이용 가능한 플랜">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            title={notReady ? '요금제는 준비 중입니다' : '지금 신청할 수 있는 플랜이 없습니다'}
            description={
              notReady
                ? '유료 요금제가 준비되면 여기에서 바로 신청할 수 있습니다. 그때까지는 무료로 쓰시면 됩니다.'
                : '플랜 정보를 받아오지 못했거나 판매 중인 플랜이 없습니다. 새로고침해도 같으면 고객센터로 문의해주세요.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const purchasing = actionPlanId === plan.planId;
              return (
                <div
                  key={plan.planId}
                  className={`flex flex-col gap-2 border bg-boss-inset p-4 ${
                    plan.isPopular ? 'border-boss-primary' : 'border-boss-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-boss-head text-[15px] font-semibold leading-snug text-boss-text">
                      {plan.title}
                    </p>
                    {plan.isPopular && <Badge tone="violet">추천</Badge>}
                  </div>
                  {plan.description && (
                    <p className="text-[12px] leading-relaxed text-boss-text-secondary">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="font-boss-head text-[26px] font-semibold leading-none tabular-nums text-boss-text">
                      {formatPrice(plan)}
                    </span>
                    {plan.periodUnit && (
                      <span className="text-[12px] text-boss-text-muted">{formatPeriod(plan)}</span>
                    )}
                  </div>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="flex-1 space-y-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
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
                    size="sm"
                    onClick={() => void handleSubscribe(plan)}
                    disabled={purchasing || isActive}
                    className="mt-1 w-full"
                  >
                    {purchasing ? '처리 중…' : isActive ? '구독 중' : '구독 신청'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* 결제 내역 (최근) */}
      <ContentCard>
        <CardHead
          title="결제 내역"
          meta={history.length > 0 ? `최근 ${recentHistory.length}건` : undefined}
          action="전체 보기 →"
          actionHref="/boss/billing/history"
        />
        {isLoading ? (
          <div className="p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-9 w-full" />
            ))}
          </div>
        ) : historyFailed ? (
          <div className="p-5">
            <EmptyState
              title={notReady ? '아직 결제 내역이 없습니다' : '결제 내역을 불러오지 못했습니다'}
              description={
                notReady
                  ? '결제 기능이 열리면 여기에 내역이 쌓입니다.'
                  : '네트워크 상태를 확인하고 새로고침해주세요.'
              }
              action={
                <Button variant="secondary" size="sm" onClick={() => void loadAll()}>
                  다시 시도
                </Button>
              }
            />
          </div>
        ) : history.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="아직 결제 내역이 없습니다"
              description="플랜을 신청하면 결제 · 갱신 기록이 여기에 쌓입니다."
            />
          </div>
        ) : (
          <DataTable className="border-0 shadow-none">
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
              {recentHistory.map((item, idx) => (
                <tr key={item.transactionId ?? `${item.productId}-${idx}`}>
                  <td>
                    <p className="font-medium">{item.productName ?? item.productId ?? '-'}</p>
                    {item.store && <p className="text-[11.5px] text-boss-text-muted">{item.store}</p>}
                  </td>
                  <td className="font-boss-head tabular-nums">{formatDate(item.purchaseDate)}</td>
                  <td className="font-boss-head tabular-nums">{formatDate(item.expirationDate)}</td>
                  <td className="num font-semibold">{formatAmount(item.amount, item.currency)}</td>
                  <td>
                    <Tag tone={historyStatusTone(item.status)}>{item.status ?? '-'}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </ContentCard>

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
