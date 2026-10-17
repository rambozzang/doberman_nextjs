// 도배르만 운영(대표 전용) — 백엔드 /platform-admin/* 응답 · 요청 모양
//
// 필드 이름은 계약(.task/platform-admin-contract.md "API 상세")에 고정돼 있다. 바꾸려면 root 와 먼저 맞춘다.
// 날짜는 서버가 준 ISO 문자열 그대로, 금액은 문자열(소수 포함) 그대로 받는다 — 숫자로 바꿔 더하지 않는다.
// 모르는 상태값은 null 로 받아 화면이 "확인 필요"로 그린다(다른 상태로 짐작하지 않는다).

export interface PlatformAdminAccess {
  isAdmin: boolean;
}

/** 목록 공통 — size 기본 20 · 최대 50, page 는 0부터 */
export interface PlatformPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
}

// ── 개요 ──

export interface PlatformOverview {
  checkedAt: string | null;
  totalMembers: number | null;
  activeMembers: number | null;
  suspendedMembers: number | null;
  deletedMembers: number | null;
  newMembers7d: number | null;
  publishedNotices: number | null;
  openReports: number | null;
  openInquiries: number | null;
  /** 구독 · 결제 기록 저장소를 읽을 수 있는가. false 면 0건이 아니라 "연동 안 됨" */
  subscriptionsAvailable: boolean;
  paymentsAvailable: boolean;
}

// ── 회원 ──

export const MEMBER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];
export type MemberStatusFilter = 'ALL' | MemberStatus;

export interface PlatformMember {
  id: number;
  userId: string;
  name: string | null;
  nickName: string | null;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  status: MemberStatus | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  /**
   * 확장 이용 권한 표시 — 유료 구독이라는 뜻이 아니다.
   * 서버는 TB_USER.EXTENDED_ACCESS 원래 값(0/1 정수)을 주고, 화면은 0 → false · 1 → true 로 읽는다(그 밖의 값은 null).
   */
  extendedAccess: boolean | null;
}

/** 이용 정지 · 해제 — 탈퇴는 이 경로로 바꾸지 않는다 */
export interface MemberStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED';
  reason: string;
  /** 보던 상태 — 서버는 ACTIVE · SUSPENDED 만 받는다(탈퇴 계정은 바꾸지 않는다) */
  expectedStatus: 'ACTIVE' | 'SUSPENDED';
}

// ── 구독 · 결제(저장된 기록 읽기 전용) ──

/** 기록 저장소 안내 — available=false 면 목록을 그리지 않는다 */
export interface PlatformSourceInfo {
  available: boolean;
  source: string | null;
  explanation: string | null;
}

export interface PlatformSubscription {
  id: number | string;
  userId: string;
  name: string | null;
  productName: string | null;
  /** 저장된 원천 상태값 그대로 */
  status: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  source: string | null;
}

export interface PlatformPayment {
  /** 원천 거래 번호(TRANS_ID) — 문자열 */
  id: string;
  userId: string;
  name: string | null;
  productName: string | null;
  /** 소수 문자열 그대로. 없으면 null(0 아님) */
  amount: string | null;
  currency: string | null;
  /** 저장된 원천 상태값 그대로 */
  status: string | null;
  createdAt: string | null;
  source: string | null;
}

export type PlatformSubscriptionPage = PlatformPage<PlatformSubscription> & PlatformSourceInfo;
export type PlatformPaymentPage = PlatformPage<PlatformPayment> & PlatformSourceInfo;

// ── 공지 ──

export const NOTICE_STATUSES = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED'] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];
export type NoticeStatusFilter = 'ALL' | NoticeStatus;
/** 작성 · 수정에서 고를 수 있는 상태(삭제는 따로) */
export type NoticeEditableStatus = Exclude<NoticeStatus, 'DELETED'>;

export const NOTICE_POPUP_KINDS = ['NOTICE', 'EVENT', 'FEATURE'] as const;
export const NOTICE_POPUP_DESTINATIONS = ['NOTICE_DETAIL', 'TAX_INVOICES', 'TAX_REGISTRATION', 'TAX_GUIDE', 'MATERIAL_CALCULATOR'] as const;
export type NoticePopupKind = (typeof NOTICE_POPUP_KINDS)[number];
export type NoticePopupDestination = (typeof NOTICE_POPUP_DESTINATIONS)[number];

export interface NoticePopupSettings {
  enabled: boolean;
  kind: NoticePopupKind;
  summary: string;
  ctaLabel: string;
  destination: NoticePopupDestination;
  /** 한국 시각(Asia/Seoul), yyyy-MM-ddTHH:mm:ss. null이면 제한 없음. */
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
}

export interface PlatformNotice {
  id: number;
  title: string;
  /** 일반 글자(plain text). HTML 로 그리지 않는다 */
  content: string;
  status: NoticeStatus | null;
  createdAt: string | null;
  updatedAt: string | null;
  authorUserId: string | null;
  popup?: NoticePopupSettings | null;
}

export interface NoticeCreateRequest {
  title: string;
  content: string;
  status: NoticeEditableStatus;
  popup?: NoticePopupSettings;
}

export interface NoticeUpdateRequest extends NoticeCreateRequest {
  /** 보던 판의 수정 시각 — 그사이 바뀌었으면 서버가 409 로 거절한다 */
  expectedUpdatedAt: string | null;
}

export interface NoticeDeleteRequest {
  reason: string;
  expectedUpdatedAt: string | null;
}

// ── 신고 ──

export const CASE_STATUSES = ['OPEN', 'RESOLVED'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];
export type CaseStatusFilter = 'ALL' | CaseStatus;

export type ReportDecision = 'DISMISS' | 'HIDE_POST';

export interface PlatformReport {
  id: number;
  boardId: number | null;
  title: string | null;
  reporterUserId: string | null;
  targetUserId: string | null;
  reason: string | null;
  createdAt: string | null;
  status: CaseStatus | null;
  /** 처리 결과(DISMISS · HIDE_POST 등 서버 값) */
  resolution: string | null;
  handledAt: string | null;
  handledBy: string | null;
  operatorNote: string | null;
}

export interface ReportResolveRequest {
  decision: ReportDecision;
  reason: string;
  expectedStatus: 'OPEN';
}

// ── 문의 ──

export interface PlatformInquiry {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  inquiryType: string | null;
  title: string | null;
  content: string | null;
  createdAt: string | null;
  status: CaseStatus | null;
  operatorNote: string | null;
  handledAt: string | null;
  handledBy: string | null;
}

export type PlatformInquiryPage = PlatformPage<PlatformInquiry> & { explanation: string | null };

export interface InquiryResolveRequest {
  reason: string;
  expectedStatus: 'OPEN';
}

// ── 감사 이력 ──

export interface PlatformAudit {
  id: number;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  createdAt: string | null;
}

/** 목록 조회 조건 — 검색어는 서버가 길이 · 허용값을 다시 검사한다 */
export interface PlatformListQuery<S extends string = string> {
  q: string;
  status?: S;
  page: number;
  size?: number;
}
