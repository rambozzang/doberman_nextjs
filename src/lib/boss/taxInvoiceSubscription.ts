// 전자 발급 구독(2026-10-17 정책) — 앱과 같은 말 · 같은 값
//
// 공동인증서를 등록한 날부터 1개월 무료, 이후 월 16,800원 · 연 168,000원(2개월 할인) 앱 구독.
// 현금영수증만 쓰는 사장님은 공동인증서를 등록하지 않으므로 첫 현금영수증 발급일부터 1개월 무료다(2026-10-21).
// 세금계산서 · 현금영수증은 같은 구독 하나로 쓴다. 구독 · 결제는 도배르만 앱에서만 한다(웹 결제 없음). 발급 비용(팝빌 포인트)은 도배르만이 부담한다.
// 상태 판정은 서버(GET /taxinvoices/electronic/subscription)가 하고, 웹은 그대로 보여 주기만 한다.

import type { TaxInvoiceSubscriptionStatus } from '@/types/boss-taxinvoice';

export const TAX_SUBSCRIPTION_MONTHLY = 16_800;
export const TAX_SUBSCRIPTION_YEARLY = 168_000;

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** 요금 한 줄 — "월 16,800원 · 연 168,000원" */
export const TAX_SUBSCRIPTION_PRICE = `월 ${won(TAX_SUBSCRIPTION_MONTHLY)} · 연 ${won(TAX_SUBSCRIPTION_YEARLY)}`;

/** 정책 요약 — 안내 · 등록 · 운영 화면이 같은 문장을 쓴다 */
export const TAX_SUBSCRIPTION_POLICY = `공동인증서를 등록한 날부터 1개월 무료, 이후 ${TAX_SUBSCRIPTION_PRICE}(연간은 2개월 할인) 앱 구독으로 횟수 제한 없이 전자 발급합니다.`;

/** 현금영수증만 쓰는 사장님 — 공동인증서를 등록하지 않으니 첫 발급일부터 센다(2026-10-21) */
export const TAX_SUBSCRIPTION_CASH_ONLY = '현금영수증만 쓰면 첫 현금영수증 발급일부터 1개월 무료, 이후 같은 구독(세금계산서 · 현금영수증 공통)입니다.';

/** 구독하지 않아도 되는 것 */
export const TAX_SUBSCRIPTION_FREE_USES = '세금계산서 · 현금영수증 작성, 서식 미리보기 · PDF, 발급 기록 관리는 구독 없이 계속 쓸 수 있습니다.';

/** 구독하는 곳 — 웹에는 결제가 없다 */
export const TAX_SUBSCRIPTION_WHERE = '구독은 도배르만 앱의 세금계산서 화면에서 합니다. 앱에서 구독한 뒤 이 화면에서 다시 확인을 누르세요.';

export type SubscriptionTone = 'ok' | 'info' | 'warn' | 'neutral';

export interface SubscriptionView {
  tone: SubscriptionTone;
  tag: string;
  text: string;
  /** 앱에서 구독해야 계속 발급할 수 있다 */
  needsSubscription: boolean;
}

/** "2026-11-17T09:30:00" → "2026-11-17". 모르는 값은 null */
export function subscriptionDate(v?: string | null): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec((v ?? '').trim());
  return m ? m[1] : null;
}

/** 서버 구독 상태 → 화면 표시. 모르는 사유는 '확인하지 못함'으로 둔다(짐작해 무료라고 말하지 않는다) */
export function subscriptionView(s: TaxInvoiceSubscriptionStatus | null | undefined): SubscriptionView {
  if (!s) return { tone: 'neutral', tag: '확인 전', text: '구독 상태를 아직 확인하지 않았습니다.', needsSubscription: false };
  const until = subscriptionDate(s.freeUntil);
  const expires = subscriptionDate(s.expiresAt);
  switch (s.reason) {
    case 'NOT_REQUIRED':
      return { tone: 'ok', tag: '구독 필요 없음', text: '지금은 구독 없이 전자 발급할 수 있습니다.', needsSubscription: false };
    case 'FREE_NOT_STARTED':
      return {
        tone: 'info',
        tag: '무료 1개월 · 시작 전',
        text: `공동인증서를 등록한 날부터(현금영수증만 쓰면 첫 발급일부터) 1개월 동안 무료로 전자 발급합니다. 이후에는 ${TAX_SUBSCRIPTION_PRICE} 구독이 필요합니다.`,
        needsSubscription: false,
      };
    case 'FREE_PERIOD':
      return {
        tone: 'info',
        tag: s.freeDaysLeft != null ? `무료 ${s.freeDaysLeft}일 남음` : '무료 이용 중',
        text: `${until ? `${until}까지` : '1개월 동안'} 무료로 전자 발급합니다. 그 뒤에도 계속 발급하려면 앱에서 구독해 주세요(${TAX_SUBSCRIPTION_PRICE}).`,
        needsSubscription: false,
      };
    case 'SUBSCRIBED':
      return {
        tone: 'ok',
        tag: '구독 중',
        text: expires ? `구독 중입니다. 다음 갱신일은 ${expires}입니다.` : '구독 중입니다. 횟수 제한 없이 전자 발급합니다.',
        needsSubscription: false,
      };
    case 'SUBSCRIPTION_REQUIRED':
      return {
        tone: 'warn',
        tag: '구독 필요',
        text: `무료 1개월이 끝났습니다. 계속 전자 발급하려면 도배르만 앱에서 구독해 주세요(${TAX_SUBSCRIPTION_PRICE}).`,
        needsSubscription: true,
      };
    default:
      return {
        tone: 'neutral',
        tag: '확인하지 못함',
        text: s.message?.trim() || '구독 상태를 확인하지 못했습니다. 잠시 뒤 다시 확인해 주세요.',
        needsSubscription: false,
      };
  }
}
