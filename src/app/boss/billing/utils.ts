import type {
  BossSubscriptionState,
  BossBillingPlan,
} from '@/types/boss-billing';

export const STATE_LABEL: Record<BossSubscriptionState, string> = {
  ACTIVE: '구독중',
  GRACE_PERIOD: '결제 보류',
  EXPIRED: '만료됨',
  NONE: '비활성',
  ERROR: '오류',
};

export const STATE_BADGE_CLASS: Record<BossSubscriptionState, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  GRACE_PERIOD: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  EXPIRED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  NONE: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  ERROR: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return value;
  }
}

export function formatPrice(plan: BossBillingPlan): string {
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

export function formatPeriod(plan: BossBillingPlan): string {
  if (!plan.periodUnit) return '';
  const unitMap: Record<string, string> = {
    MONTH: '개월',
    YEAR: '년',
    DAY: '일',
    WEEK: '주',
  };
  const unit = unitMap[plan.periodUnit] ?? plan.periodUnit.toLowerCase();
  return `/ ${plan.periodLength ?? 1}${unit}`;
}
