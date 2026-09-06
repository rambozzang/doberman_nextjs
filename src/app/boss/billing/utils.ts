// 구독 · 결제 화면 공용 — 상태 라벨 · 색 · 포맷터 (Industry 패턴)
//
// 상태 색은 ui/index.tsx 의 StatusTone(ok · warn · bad · neutral) 으로만 표현한다.
// 화면마다 색 클래스를 따로 두지 않는다 — 배지 색쌍은 토큰(pill-*)이 정한다.

import type { StatusTone } from '@/components/boss/ui';
import type { BossSubscriptionState, BossBillingPlan } from '@/types/boss-billing';

export const STATE_LABEL: Record<BossSubscriptionState, string> = {
  ACTIVE: '구독중',
  GRACE_PERIOD: '결제 보류',
  EXPIRED: '만료됨',
  NONE: '비활성',
  ERROR: '오류',
};

export const STATE_TONE: Record<BossSubscriptionState, StatusTone> = {
  ACTIVE: 'ok',
  GRACE_PERIOD: 'warn',
  EXPIRED: 'bad',
  NONE: 'neutral',
  ERROR: 'bad',
};

/** 결제 내역 상태 → 배지 색. 모르는 값은 중립으로 둔다 — 지어내지 않는다. */
export function historyStatusTone(status?: string | null): StatusTone {
  switch ((status ?? '').toUpperCase()) {
    case 'SUCCESS':
    case 'PAID':
    case 'ACTIVE':
      return 'ok';
    case 'PENDING':
      return 'warn';
    case 'REFUNDED':
    case 'FAILED':
    case 'CANCELLED':
    case 'CANCELED':
      return 'bad';
    default:
      return 'neutral';
  }
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
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

export function formatAmount(amount?: number | null, currency?: string | null): string {
  if (amount == null) return '-';
  return `${amount.toLocaleString('ko-KR')} ${currency ?? ''}`.trim();
}

/** 만료일까지 남은 일수. 날짜가 없거나 해석 불가면 null — 그때는 숫자를 그리지 않는다. */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

/** 구독 기간 경과율(0~100). 시작·만료 둘 다 있어야 계산한다. */
export function periodProgress(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
  const pct = ((Date.now() - s) / (e - s)) * 100;
  return Math.max(0, Math.min(100, pct));
}
