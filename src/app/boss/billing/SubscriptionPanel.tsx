'use client';

// 구독 상태 패널 — Industry 패턴 (참조 대시보드 QuotaPanel)
//
//   kicker "현재 플랜" + 플랜명 17px + 상태 태그
//   → 큰 숫자 40px Barlow Condensed (만료까지 남은 일수) + 진행바(기간 경과율)
//   → dl 2칸(MetricBox: 시작일 · 만료일) → 상태별 설명 → 액션
//
// 숫자는 응답에 있는 날짜에서만 계산한다. 날짜가 없으면 숫자·바를 그리지 않는다
// (0 일 · 0% 막대는 "만료" 로 읽힌다 — 참조 원칙: 값이 없으면 그리지 않는다).
// /boss/billing 과 /boss/billing/status 가 같이 쓴다.

import type { ReactNode } from 'react';
import type { BossSubscriptionState, BossSubscriptionStatusResponse } from '@/types/boss-billing';
import { Bar, DescRow, MetricBox, Skeleton, Tag } from '@/components/boss/ui';
import { STATE_LABEL, STATE_TONE, daysUntil, formatDate, periodProgress } from './utils';

const STATE_NOTE: Record<BossSubscriptionState, string> = {
  ACTIVE: '만료일까지 이용할 수 있습니다. 자동 갱신을 켜 두면 만료일에 같은 플랜으로 이어집니다.',
  GRACE_PERIOD:
    '결제가 확인되지 않아 보류 중입니다. 결제 수단을 확인해주세요 — 보류 기간이 지나면 만료됩니다.',
  EXPIRED: '구독이 만료되었습니다. 계속 이용하려면 요금제에서 다시 신청해주세요.',
  NONE: '구독 중인 플랜이 없습니다. 요금제를 비교하고 신청하세요.',
  ERROR: '구독 정보를 확인하지 못했습니다. 새로고침해도 같으면 고객센터로 문의해주세요.',
};

export default function SubscriptionPanel({
  status,
  state,
  loading = false,
  actions,
}: {
  status: BossSubscriptionStatusResponse | null;
  state: BossSubscriptionState;
  loading?: boolean;
  /** 패널 하단 액션(구독 취소 · 요금제 보기 등) */
  actions?: ReactNode;
}) {
  const ent = status?.entitlement;
  const productName = status?.productName ?? ent?.productName ?? null;
  const startDate = status?.startDate ?? ent?.originalPurchaseDate ?? null;
  const expirationDate = status?.expirationDate ?? ent?.expirationDate ?? null;
  const willRenew = status?.willRenew ?? ent?.willRenew;

  const days = daysUntil(expirationDate);
  const pct = periodProgress(startDate, expirationDate);
  const warn = state === 'GRACE_PERIOD' || state === 'EXPIRED' || (days != null && days <= 7);

  if (loading) {
    return (
      <section className="boss-card flex flex-col gap-3.5 p-5" aria-busy>
        <div>
          <p className="boss-kicker">현재 플랜</p>
          <Skeleton className="mt-1.5 h-5 w-40" />
        </div>
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </section>
    );
  }

  return (
    <section className="boss-card flex flex-col gap-3.5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="boss-kicker">현재 플랜</p>
          <h3 className="boss-section-title truncate">{productName ?? '구독 중인 플랜 없음'}</h3>
        </div>
        <Tag tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Tag>
      </div>

      {days != null ? (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className={`font-boss-head text-[40px] font-semibold leading-none tabular-nums tracking-[-0.01em] ${
              days < 0 ? 'text-boss-error' : 'text-boss-text'
            }`}
          >
            {days < 0 ? `+${Math.abs(days)}` : days}
          </span>
          <span className="text-[13.5px] tabular-nums text-boss-text-secondary">
            {days < 0 ? '일 지남' : '일 남음'} · {formatDate(expirationDate)} 만료
          </span>
        </div>
      ) : (
        <p className="text-[13.5px] text-boss-text-secondary">만료일 정보가 없습니다.</p>
      )}

      {pct != null && <Bar pct={pct} height={8} tone={warn ? 'warn' : 'accent'} />}

      <dl className="grid grid-cols-2 gap-3">
        <MetricBox label="시작일" value={formatDate(startDate)} />
        <MetricBox label="만료일" value={formatDate(expirationDate)} />
      </dl>

      <dl>
        <DescRow label="자동 갱신" value={willRenew == null ? '-' : willRenew ? '사용' : '미사용'} />
        {ent?.store && <DescRow label="결제 스토어" value={ent.store} />}
        {status?.subscriptionId && (
          <DescRow
            label="구독 ID"
            value={<span className="font-boss-head font-medium">{status.subscriptionId}</span>}
          />
        )}
      </dl>

      <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">{STATE_NOTE[state]}</p>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </section>
  );
}
