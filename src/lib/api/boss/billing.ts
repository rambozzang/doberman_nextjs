// 사장님 결제/구독 API
// Flutter 참조:
//  - lib/repo/login_repo.dart : getSubscriptionStatus / createSubscription / cancelSubscription
//  - lib/app/payments/         : RevenueCat 기반 customerInfo, offerings, transactions
//
// 모든 호출은 인증이 필요하므로 BossApiClient 의 *Private 메서드를 사용한다.
import BossApiClient from '@/lib/bossApi';
import type {
  BossSubscriptionStatusResponse,
  BossCreateSubscriptionRequest,
  BossCreateSubscriptionResponse,
  BossCancelSubscriptionResponse,
  BossPurchaseHistoryResponse,
  BossBillingPlansResponse,
} from '@/types/boss-billing';

export const bossBillingApi = {
  // 구독 상태 조회 — Flutter: LoginRepo.getSubscriptionStatus → GET /api/subscription/status
  getStatus: () =>
    BossApiClient.getPrivate<BossSubscriptionStatusResponse>('/api/subscription/status'),

  // 구독 생성(결제) — Flutter: LoginRepo.createSubscription → POST /api/subscription/create
  create: (data: BossCreateSubscriptionRequest) =>
    BossApiClient.postPrivate<BossCreateSubscriptionResponse>('/api/subscription/create', data),

  // 구독 취소 — Flutter: LoginRepo.cancelSubscription → POST /api/subscription/cancel/{subsId}
  cancel: (subsId: string) =>
    BossApiClient.postPrivate<BossCancelSubscriptionResponse>(
      `/api/subscription/cancel/${encodeURIComponent(subsId)}`,
    ),

  // 구매 이력(갱신 이력) — Flutter: SubscriptionRenewalHistoryController._loadRenewalHistory 의
  // customerInfo.nonSubscriptionTransactions 에 대응
  // GET /api/subscription/history
  getHistory: () =>
    BossApiClient.getPrivate<BossPurchaseHistoryResponse>('/api/subscription/history'),

  // 플랜(상품) 목록 — Flutter: SubscriptionController._loadOfferings 의 Purchases.getOfferings 에 대응
  // GET /api/subscription/plans
  getPlans: () =>
    BossApiClient.getPrivate<BossBillingPlansResponse>('/api/subscription/plans'),
};
