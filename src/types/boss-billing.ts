// 사장님 결제/구독(billing) 도메인 타입
// Flutter 참조:
//  - lib/repo/login_repo.dart  : getSubscriptionStatus / createSubscription / cancelSubscription
//  - lib/app/payments/         : RevenueCat 기반 구독 상태 / 갱신 이력 / 플랜 정보
//
// 백엔드(api-doman) 응답 스키마는 RevenueCat customerInfo 와 1:1 로 대응되며,
// 모든 필드는 백엔드 응답이 누락될 수 있음을 고려해 optional 로 정의한다.

// 구독 상태 enum (Flutter SubscriptionState 와 1:1)
export type BossSubscriptionState =
  | 'NONE'         // 구독 내역 없음
  | 'ACTIVE'       // 활성 구독
  | 'GRACE_PERIOD' // 결제 보류
  | 'EXPIRED'      // 만료
  | 'ERROR';       // 오류

// 단일 구독(Entitlement) 정보 — Flutter EntitlementInfo 매핑
export interface BossSubscriptionEntitlement {
  productId?: string;            // 상품 식별자 (예: doberman_pro_monthly)
  productName?: string;          // 표시용 상품명
  isActive?: boolean;            // 활성 여부
  willRenew?: boolean;           // 자동 갱신 여부
  periodType?: string;           // normal | trial | intro
  latestPurchaseDate?: string;   // ISO8601
  originalPurchaseDate?: string; // ISO8601
  expirationDate?: string;       // ISO8601
  store?: string;                // app_store | play_store | promotional
  isSandbox?: boolean;
  unsubscribeDetectedAt?: string | null;
  billingIssueDetectedAt?: string | null;
}

// 구독 상태 응답 — Flutter LoginRepo.getSubscriptionStatus 매핑
// GET /api/subscription/status
export interface BossSubscriptionStatusResponse {
  isActive?: boolean;
  status?: BossSubscriptionState;
  subscriptionId?: string;
  productId?: string;
  productName?: string;
  expirationDate?: string;
  startDate?: string;
  willRenew?: boolean;
  entitlement?: BossSubscriptionEntitlement;
  // 백엔드가 customerInfo 전체를 내려줄 경우의 보조 필드
  activeEntitlements?: BossSubscriptionEntitlement[];
}

// 구독 생성 요청 — Flutter LoginRepo.createSubscription 매핑
// POST /api/subscription/create
export interface BossCreateSubscriptionRequest {
  subsType: string; // 'PREMIUM' 등
  autoRenew: boolean;
}

export interface BossCreateSubscriptionResponse {
  subscriptionId?: string;
  status?: BossSubscriptionState;
  message?: string;
}

// 구독 취소 응답 — Flutter LoginRepo.cancelSubscription 매핑
// POST /api/subscription/cancel/{subsId}
export interface BossCancelSubscriptionResponse {
  subscriptionId?: string;
  status?: BossSubscriptionState;
  message?: string;
}

// 구매 이력(갱신 이력) 단건 — Flutter StoreTransaction 매핑
export interface BossPurchaseHistoryItem {
  transactionId?: string;
  productId?: string;
  productName?: string;
  purchaseDate?: string;       // ISO8601
  expirationDate?: string;     // ISO8601
  amount?: number;
  currency?: string;
  store?: string;
  status?: string;             // SUCCESS | REFUNDED | PENDING ...
}

// 구매 이력 응답
// GET /api/subscription/history
export interface BossPurchaseHistoryResponse {
  items: BossPurchaseHistoryItem[];
  totalCount?: number;
}

// 플랜(상품) 정보 — Flutter Offerings.current.availablePackages 매핑
export interface BossBillingPlan {
  planId: string;
  productId?: string;
  title: string;
  description?: string;
  priceString?: string;        // "₩9,900"
  priceAmount?: number;        // 9900
  currencyCode?: string;       // KRW
  periodUnit?: string;         // MONTH | YEAR
  periodLength?: number;       // 1
  isPopular?: boolean;
  features?: string[];
}

// 플랜 목록 응답
// GET /api/subscription/plans
export interface BossBillingPlansResponse {
  plans: BossBillingPlan[];
}
