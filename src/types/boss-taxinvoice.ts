// 세금계산서 · 현금영수증 발행 관리 타입
// 백엔드: /taxinvoices/* (app/taxinvoice/TaxInvoiceVo.kt 와 1:1)

export type TaxInvoiceDocType = 'TAX' | 'CASH';
export type TaxInvoiceStatus = 'REQUESTED' | 'ISSUED' | 'CANCELED';
export type TaxInvoicePayType = 'RECEIPT' | 'CLAIM';

export const DOC_TYPE_LABEL: Record<TaxInvoiceDocType, string> = {
  TAX: '세금계산서',
  CASH: '현금영수증',
};

/** 기록 상태 이름 — REQUESTED 는 "작성해 저장만 한 미발급 문서"다(외부 발급 요청이 아니다) */
export const STATUS_LABEL: Record<TaxInvoiceStatus, string> = {
  REQUESTED: '미발급',
  ISSUED: '발행 완료',
  CANCELED: '취소',
};

export const PAY_TYPE_LABEL: Record<TaxInvoicePayType, string> = {
  RECEIPT: '영수',
  CLAIM: '청구',
};

// ── 현금영수증 — 앱 · 웹 · 서버 같은 이름 ──
// 용도: 개인 소득공제(기본) · 사업자 지출증빙. 식별: 휴대폰(기본) · 사업자번호 · 자진발급(소득공제 전용).
// 주민등록번호 · 카드번호는 받지 않는다.
export type CashUsage = 'DEDUCTION' | 'EXPENSE';
export type CashIdentityType = 'PHONE' | 'BIZNO' | 'SELF';

export const CASH_USAGE_LABEL: Record<CashUsage, string> = {
  DEDUCTION: '소득공제',
  EXPENSE: '지출증빙',
};

/** 화면 · 서식에서 길게 쓰는 용도 이름 */
export const CASH_USAGE_LONG_LABEL: Record<CashUsage, string> = {
  DEDUCTION: '개인 소득공제용',
  EXPENSE: '사업자 지출증빙용',
};

export const CASH_IDENTITY_LABEL: Record<CashIdentityType, string> = {
  PHONE: '휴대폰번호',
  BIZNO: '사업자번호',
  SELF: '자진발급',
};

/**
 * 현금영수증 과세 구분 — 문서 한 건 단위(품목마다 섞지 않는다). 새 문서는 과세가 기본.
 * 세액 0 으로 추정하면 안 된다: 공급가액이 작으면 과세여도 10% 반올림 세액이 0원일 수 있다.
 * null 은 예전 기록 — 조회는 되지만 발급 전에 수정 화면에서 확인해야 한다.
 */
export type CashTaxationType = 'TAXABLE' | 'NON_TAXABLE';
export const CASH_TAXATION_LABEL: Record<CashTaxationType, string> = {
  TAXABLE: '과세',
  NON_TAXABLE: '비과세(면세)',
};

/** 국세청 자진발급 번호 — 고객이 번호를 알려 주지 않았을 때 쓰는 고정값 */
export const CASH_SELF_ISSUE_NUMBER = '0100001234';

/** 현금영수증 한 건 최대 합계 */
export const CASH_MAX_TOTAL = 999_999_999;

/** 전자 발급한 현금영수증 취소 — 전액 취소만 */
export type CashCancelReason = 'RETURN' | 'MISTAKE' | 'OTHER';
export const CASH_CANCEL_REASON_LABEL: Record<CashCancelReason, string> = {
  RETURN: '거래 취소 · 환불',
  MISTAKE: '잘못 발급(착오)',
  OTHER: '기타',
};

// ── 전자세금계산서 취소 — 국세청 전송 전 발행취소 · 전송 후 전액 취소용 수정세금계산서 ──
// 팝빌로 우리가 발급한 세금계산서 원본만. 미발급 · 수기 기록 · 현금영수증 · 수정분은 대상이 아니다.
// 부분 환입 · 공급가액 변동 · 기재사항 정정 · 영세율 전환은 지원하지 않는다.
export type TaxCancelReason = 'RETURN' | 'CONTRACT_CANCEL' | 'DUPLICATE';

/** 화면에서 고르는 이름 — 국세청 수정사유 이름을 따른다 */
export const TAX_CANCEL_REASON_LABEL: Record<TaxCancelReason, string> = {
  CONTRACT_CANCEL: '계약의 해제',
  RETURN: '환입(반품)',
  DUPLICATE: '착오에 의한 이중발급',
};

/** 국세청 수정사유 코드 — 3 환입 · 4 계약의 해제 · 6 착오에 의한 이중발급 */
export const TAX_CANCEL_MODIFY_CODE: Record<TaxCancelReason, number> = {
  RETURN: 3,
  CONTRACT_CANCEL: 4,
  DUPLICATE: 6,
};

/** 수정사유 코드 → 서식 · 화면 이름. 이 기능이 만들지 않는 코드도 읽을 때는 이름을 보여 준다 */
export const MODIFY_CODE_LABEL: Record<number, string> = {
  1: '기재사항 착오정정',
  2: '공급가액 변동',
  3: '환입',
  4: '계약의 해제',
  5: '내국신용장 사후개설',
  6: '착오에 의한 이중발급',
};

/** null = 취소 시도 없음. CANCELED 는 전송 전 발행취소 완료, CORRECTION_ISSUED 는 수정세금계산서(취소분) 발급 완료 */
export type TaxCancelStatus = 'PROCESSING' | 'UNKNOWN' | 'CANCELED' | 'CORRECTION_ISSUED';
export type TaxCancelMode = 'CANCEL_ISSUE' | 'CORRECTION';

export const TAX_CANCEL_MODE_LABEL: Record<TaxCancelMode, string> = {
  CANCEL_ISSUE: '발행취소(국세청 전송 전)',
  CORRECTION: '수정세금계산서(취소분) 발급',
};

/**
 * 팝빌 세금계산서 상태 코드 — 미리보기의 providerStateCode 를 사람 말로.
 * 300 · 301 · 302 는 발행취소, 304 는 수정세금계산서, 그 밖은 서버가 막는다(판정은 서버가 한다).
 */
export const POPBILL_TAX_STATE_LABEL: Record<number, string> = {
  300: '발행 완료',
  301: '국세청 전송 전',
  302: '국세청 전송 대기',
  303: '국세청 전송 중',
  304: '국세청 전송 성공',
  305: '국세청 전송 실패',
  600: '발행 취소됨',
};

/**
 * GET /taxinvoices/{id}/electronic/tax-cancel-preview — 외부로 아무것도 보내지 않는다(팝빌 상태만 새로 읽는다).
 * invoice = 원본, correction = 서버가 만든 음수 수정분(아직 발급 전 · id 없음). 전송 전 발행취소면 null.
 * occurrenceDate 는 실제 적용 일자(착오에 의한 이중발급은 원본 작성일자로 서버가 정한다).
 * previewToken 은 일반 발급 토큰과 바꿔 쓸 수 없다.
 */
export interface TaxInvoiceCancellationPreview {
  invoice: TaxInvoice;
  correction: TaxInvoice | null;
  supplier: TaxInvoiceSupplier | null;
  mode: TaxCancelMode | null;
  reason: TaxCancelReason;
  occurrenceDate: string | null;
  providerStateCode: number | null;
  ready: boolean;
  issues: string[];
  isTest: boolean;
  previewToken: string;
}

/** POST /taxinvoices/{id}/electronic/tax-cancel — 금액 · 승인번호는 보내지 않는다(서버가 저장된 원본으로 정한다) */
export interface TaxCancelRequest {
  confirmed: true;
  previewToken: string;
  reason: TaxCancelReason;
  occurrenceDate: string | null;
}

/** null = 취소 시도 없음 */
export type ProviderCancelStatus = 'PROCESSING' | 'UNKNOWN' | 'CANCELED';
export const PROVIDER_CANCEL_STATUS_LABEL: Record<ProviderCancelStatus, string> = {
  PROCESSING: '취소 처리 중',
  UNKNOWN: '취소 결과 확인 필요',
  CANCELED: '발급 취소됨',
};

// 서식 품목 행
export interface TaxInvoiceItem {
  name?: string | null;
  spec?: string | null;
  qty?: number | null;
  unitPrice?: number | null;
  supplyAmount?: number | null;
  vatAmount?: number | null;
  /** yyyy-MM-dd — 서식의 월/일 칸 */
  date?: string | null;
}

export interface TaxInvoice {
  id?: number;
  customerId?: number | null;
  estimateId?: number | null;
  docType: TaxInvoiceDocType;
  status: TaxInvoiceStatus;
  payType: TaxInvoicePayType;
  issueDate?: string | null;
  buyerName?: string | null;
  buyerBizNo?: string | null;
  buyerCeo?: string | null;
  buyerAddress?: string | null;
  buyerBizType?: string | null;
  buyerBizKind?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  itemSummary?: string | null;
  items: TaxInvoiceItem[];
  approvalNo?: string | null;
  issuedAt?: string | null;
  memo?: string | null;
  createdDt?: string | null;
  updatedDt?: string | null;
  /** 전자 발급 대행사 — null 이면 홈택스 수기 발행 기록 */
  provider?: TaxInvoiceProvider | null;
  providerStatus?: TaxInvoiceProviderStatus | null;
  ntsStatus?: TaxInvoiceNtsStatus | null;
  /** true 면 시험 환경 발급 — 효력 없음, 부가세 집계에서 빠진다 */
  providerIsTest?: boolean | null;
  providerError?: string | null;
  /** 현금영수증 — 예전 기록은 비어 있을 수 있다(화면이 추정해 채우고 확인을 받는다) */
  cashUsage?: CashUsage | null;
  cashIdentityType?: CashIdentityType | null;
  /** 숫자만. 자진발급은 0100001234 */
  cashIdentityNum?: string | null;
  cashTaxationType?: CashTaxationType | null;
  /** 서버가 팝빌로 보내는 현금영수증 품목명(70자 표준 요약) — 응답 전용 */
  cashItemName?: string | null;
  /** 대행사 승인 거래일자 yyyyMMdd — 발급 전 null */
  providerTradeDate?: string | null;
  providerCancelStatus?: ProviderCancelStatus | null;
  providerCancelApprovalNo?: string | null;
  /** 취소 거래의 국세청 전송 상태 — 원거래 ntsStatus 와 따로 본다(원거래가 전송 완료여도 취소 거래는 대기일 수 있다) */
  providerCancelNtsStatus?: TaxInvoiceNtsStatus | null;
  // ── 전자세금계산서 취소(응답 전용 — 저장 요청에 보내지 않는다). providerCancel* 는 현금영수증 전용 그대로 ──
  /** 원본의 취소 상태 */
  taxCancelStatus?: TaxCancelStatus | null;
  taxCancelMode?: TaxCancelMode | null;
  taxCancelReason?: TaxCancelReason | null;
  /** yyyy-MM-dd — 적용 일자(수정분 작성일자) */
  taxCancelDate?: string | null;
  /** 원본 → 음수 수정분 id */
  taxCancelInvoiceId?: number | null;
  /** 음수 수정분 → 원본 id. 값이 있으면 수정세금계산서(취소분) */
  correctionOfInvoiceId?: number | null;
  /** 수정분의 국세청 수정사유 코드(3 · 4 · 6) */
  modifyCode?: number | null;
  /** 수정분의 당초 국세청 승인번호(24자리) */
  orgNtsConfirmNum?: string | null;
  /**
   * 수정분의 당초(원본) 작성일자 yyyy-MM-dd — 서버가 수정분에 고정 저장한 값. 서식 비고 · 팝빌 비고의 '당초 작성일자'.
   * 없으면 "확인 필요"로 둔다 — 승인번호 앞자리 · 첫 품목 일자 · 내부 메모로 추정하지 않는다.
   */
  orgIssueDate?: string | null;
}

// ── 전자 발급(팝빌) — 기존 status(REQUESTED|ISSUED|CANCELED)와 별개로 둔다 ──
export type TaxInvoiceProvider = 'POPBILL';
export type TaxInvoiceProviderStatus = 'PROCESSING' | 'ISSUED' | 'UNKNOWN' | 'FAILED';
export type TaxInvoiceNtsStatus = 'PENDING' | 'SENT' | 'FAILED';

export const PROVIDER_STATUS_LABEL: Record<TaxInvoiceProviderStatus, string> = {
  PROCESSING: '발급 처리 중',
  ISSUED: '전자 발급 완료',
  UNKNOWN: '결과 확인 필요',
  FAILED: '발급 실패',
};

export const NTS_STATUS_LABEL: Record<TaxInvoiceNtsStatus, string> = {
  PENDING: '국세청 전송 대기',
  SENT: '국세청 전송 완료',
  FAILED: '국세청 전송 실패',
};

/** 공급자(우리 회사) — 전자 발급에 실리는 값 */
export interface TaxInvoiceSupplier {
  bizNo: string;
  name: string;
  ceo: string;
  address: string;
  bizType: string;
  bizKind: string;
  email: string;
  phone: string;
}

export interface ElectronicConfig {
  enabled: boolean;
  isTest: boolean;
  ready: boolean;
  reason: string | null;
  supplier: TaxInvoiceSupplier | null;
  certificateExpiresAt: string | null;
}

export interface ElectronicPreview {
  invoice: TaxInvoice;
  supplier: TaxInvoiceSupplier | null;
  ready: boolean;
  issues: string[];
  isTest: boolean;
  /** 발급 요청에 그대로 돌려보낸다 — 미리보기 이후 문서 · 공급자 · 시험 여부가 바뀌면 서버가 거절 */
  previewToken: string;
}

/**
 * GET /taxinvoices/{id}/document — 서식(미리보기 · PDF · 인쇄)용 문서. 응답 모양은 ElectronicPreview 와 같다.
 * 외부 호출 없이 서버에 있는 문서 · 공급자만 읽는다. ready 는 늘 false(발급 가능 판정이 아니다) — 발급에 쓰지 않는다.
 * 공급자: 발급을 시도한 문서는 발급 당시 스냅샷, 아니면 지금 회사 정보. 없으면 null(다른 값으로 채우지 않는다).
 */
export type TaxInvoiceDocument = ElectronicPreview;

export type ElectronicDocType = TaxInvoiceDocType;

/** POST /taxinvoices/{id}/electronic/cancel — 전자 발급한 현금영수증 전액 취소. 세금계산서는 서버가 거절한다 */
export interface CashCancelRequest {
  confirmed: true;
  reason: CashCancelReason;
}

// ── 발급 서비스 등록 — 사업자 권한 확인 신청 → 운영 확인 → 팝빌 연동 → 공동인증서 ──
// 출시 값(ELECTRONIC_TAX_INVOICE_OPEN)과 별개로 늘 열린다. 단계는 서버가 정한다.
// REJECTED(2026-10-16): 운영 확인에서 반려됨 — 사유를 보고 정보를 고쳐 다시 신청하면 서버가 PENDING 으로 되돌린다.
export const REGISTRATION_STAGES = [
  'NEED_COMPANY',
  'NOT_REGISTERED',
  'PENDING_VERIFICATION',
  'REJECTED',
  'VERIFIED',
  'NEEDS_CERTIFICATE',
  'READY',
] as const;
export type RegistrationStage = (typeof REGISTRATION_STAGES)[number];

export function isRegistrationStage(v: unknown): v is RegistrationStage {
  return typeof v === 'string' && (REGISTRATION_STAGES as readonly string[]).includes(v);
}

/** 짧은 상태 표시(태그) — 신청 저장(PENDING_VERIFICATION)은 승인이 아니다 */
export const REGISTRATION_STAGE_LABEL: Record<RegistrationStage, string> = {
  NEED_COMPANY: '회사 정보 없음',
  NOT_REGISTERED: '미신청',
  PENDING_VERIFICATION: '권한 확인 중',
  REJECTED: '반려됨',
  VERIFIED: '연동 필요',
  NEEDS_CERTIFICATE: '인증서 필요',
  READY: '준비 완료',
};

/** GET · POST /taxinvoices/electronic/registration, POST /electronic/link 응답 */
export interface ElectronicRegistrationStatus {
  stage: RegistrationStage;
  isTest: boolean;
  companyRegistered: boolean;
  /** 서버의 등록 연동 설정이 준비됐는지 — 발급 정식 오픈과는 별개. false 여도 신청 저장은 된다 */
  serviceConfigured: boolean;
  reason: string | null;
  /** 확인 전: 신청 내용(없으면 회사 정보) · 확인 후: 확인된 사업자 정보 */
  supplier: TaxInvoiceSupplier | null;
  submittedAt: string | null;
  /** 팝빌 연동 회원 여부. null 은 "확인하지 못함" — 미가입(false)과 다르다 */
  memberLinked: boolean | null;
  certificateExpiresAt: string | null;
  /** 운영 심사 결과(2026-10-16, 예전 서버는 없음). 반려면 사유 · 시각이 함께 온다 */
  reviewStatus?: RegistrationReviewStatus | null;
  reviewReason?: string | null;
  reviewedAt?: string | null;
}

export type RegistrationReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const REVIEW_STATUS_LABEL: Record<RegistrationReviewStatus, string> = {
  PENDING: '심사 대기',
  APPROVED: '승인',
  REJECTED: '반려',
};

/** 권한 확인 신청 — 저장은 신청일 뿐 발급 권한을 주지 않는다 */
export interface ElectronicRegistrationRequest {
  supplier: TaxInvoiceSupplier;
  consent: true;
}

/** 팝빌 연동 회원 가입 — 사업자는 서버가 확인된 값으로 고른다. 비밀번호는 서버에도 남지 않는다 */
export interface ElectronicLinkRequest {
  memberId: string;
  password: string;
  consent: true;
}

// ── 운영 준비(2026-10-16) — 인증서 · 비용 정책 · 자동 상태 확인 · 안내, 개인 알림, 문서 처리 이력 ──
// 모두 읽기다(읽음 표시 제외). 출시 값이 꺼져 있어도 열리고, 팝빌을 직접 부르지 않는다.

/** 공동인증서 — 세금계산서에만 필요하다(현금영수증은 필요 없음). UNKNOWN 은 "확인하지 못함"(날짜를 짐작하지 않는다) */
export type CertificateStatus = 'UNKNOWN' | 'VALID' | 'EXPIRING' | 'EXPIRED';

/** 발급 비용 부담 — UNDECIDED 는 정책 미확정(기본). 금액 · 잔액을 모르면 null 이다(0원으로 보지 않는다) */
export type BillingMode = 'UNDECIDED' | 'PARTNER' | 'MEMBER';
export type BalanceScope = 'PARTNER' | 'MEMBER';

export type OperationSeverity = 'INFO' | 'WARNING' | 'ERROR';
export type OperationAction = 'REGISTRATION' | 'CERTIFICATE' | 'BILLING' | 'SUPPORT';

export interface OperationIssue {
  code: string;
  severity: OperationSeverity;
  title: string;
  message: string;
  action: OperationAction;
  invoiceId: number | null;
}

/** GET /taxinvoices/electronic/operations — 자기 회사 · 자기 권한만 */
export interface ElectronicOperations {
  /** 단계를 읽지 못했으면 null(등록 화면 자체 조회가 진실) */
  registration: ElectronicRegistrationStatus | null;
  certificate: { status: CertificateStatus; expiresAt: string | null; daysRemaining: number | null };
  billing: {
    mode: BillingMode;
    label: string;
    message: string;
    taxUnitCost: string | null;
    cashUnitCost: string | null;
    balance: string | null;
    balanceScope: BalanceScope | null;
    checkedAt: string | null;
    error: string | null;
  };
  /** intervalSeconds 를 모르면 null */
  autoSync: { enabled: boolean; intervalSeconds: number | null; lastRunAt: string | null; nextRunAt: string | null };
  issues: OperationIssue[];
}

/** 개인 알림 한 건 — invoiceId 가 있으면 그 문서, 없으면 발급 서비스 등록으로 잇는다 */
export interface TaxInvoiceActivity {
  id: number;
  invoiceId: number | null;
  registrationId: number | null;
  eventType: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

/** GET /taxinvoices/electronic/activity — unreadCount 를 모르면 null */
export interface TaxInvoiceActivityPage {
  items: TaxInvoiceActivity[];
  totalElements: number;
  unreadCount: number | null;
}

/** 처리 이력 한 줄 — 대행사 원문 · 식별번호는 담지 않는다 */
export interface TaxInvoiceHistoryItem {
  id: number;
  invoiceId: number | null;
  registrationId: number | null;
  action: string;
  actorLabel: string;
  outcome: string;
  message: string;
  createdAt: string;
}

export interface TaxInvoiceHistoryPage {
  items: TaxInvoiceHistoryItem[];
  totalElements: number;
}

// ── 운영자 — 화면에 보이는지는 GET /taxinvoices/admin/access 로만 정한다. 모든 판정은 서버가 다시 한다 ──
export interface TaxInvoiceAdminAccess {
  isAdmin: boolean;
}

/** 발급 권한 신청 한 건. reviewStatus 를 모르면 null — 처리하지 않고 다시 불러오게 한다 */
export interface AdminRegistration {
  id: number;
  companyId: number;
  userId: string;
  companyName: string | null;
  isTest: boolean;
  supplier: TaxInvoiceSupplier | null;
  submittedAt: string;
  reviewStatus: RegistrationReviewStatus | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  /** 이번에 본 신청 내용에 묶인 값 — 그대로 돌려보낸다. 내용이 바뀌었거나 이미 처리됐으면 서버가 거절한다 */
  reviewToken: string;
}

export interface AdminRegistrationPage {
  items: AdminRegistration[];
  totalElements: number;
}

export type AdminReviewDecision = 'APPROVE' | 'REJECT';

/** POST /taxinvoices/admin/registrations/{id}/review — 승인해도 팝빌 가입 · 발급 · 오픈 상태는 바뀌지 않는다 */
export interface AdminReviewRequest {
  decision: AdminReviewDecision;
  reviewToken: string;
  reason: string;
  confirmed: true;
}

export interface AdminProblem {
  invoice: TaxInvoice;
  ownerUserId: string;
  lastError: string | null;
  lastSyncedAt: string | null;
  canSync: boolean;
}

export interface AdminProblemPage {
  items: AdminProblem[];
  totalElements: number;
}

/** POST /taxinvoices/admin/invoices/{id}/sync — 문서 주인의 기존 상태 조회로 처리된다(재발급 · 강제 성공 없음) */
export interface AdminSyncRequest {
  confirmed: true;
  note: string;
}

/**
 * 전자 발급이 걸린 문서인지 — 수정 · 삭제 · 수기 상태 변경 · 재발급을 막고 상태 확인(sync)만 연다.
 * 실패(FAILED) · 불명(UNKNOWN)이어도 대행사에 문서가 남아 있을 수 있어 중복 발급을 막는다.
 * 수정세금계산서(취소분)와 취소를 시도한 원본도 같다 — 대행사 값이 아직 비어 있어도 잠근다.
 */
export function isProviderManaged(inv: Pick<TaxInvoice, 'provider' | 'correctionOfInvoiceId' | 'taxCancelStatus'>): boolean {
  return inv.provider != null || inv.correctionOfInvoiceId != null || inv.taxCancelStatus != null;
}

/** 음수 수정세금계산서(취소분)인지 */
export function isTaxCorrection(inv: Pick<TaxInvoice, 'correctionOfInvoiceId'>): boolean {
  return inv.correctionOfInvoiceId != null;
}

export interface TaxInvoiceSaveRequest {
  id?: number;
  customerId?: number | null;
  estimateId?: number | null;
  docType: TaxInvoiceDocType;
  payType: TaxInvoicePayType;
  issueDate?: string | null;
  buyerName?: string | null;
  buyerBizNo?: string | null;
  buyerCeo?: string | null;
  buyerAddress?: string | null;
  buyerBizType?: string | null;
  buyerBizKind?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  itemSummary?: string | null;
  items: TaxInvoiceItem[];
  memo?: string | null;
  /** 현금영수증만. 세금계산서는 null */
  cashUsage?: CashUsage | null;
  cashIdentityType?: CashIdentityType | null;
  cashIdentityNum?: string | null;
  cashTaxationType?: CashTaxationType | null;
  /** 새 문서 저장 중복 방지 키(영문 · 숫자 · 하이픈 8~40자) — 같은 키로 다시 저장하면 앞서 만든 문서를 돌려준다(2026-10-16) */
  clientRequestKey?: string;
}

export interface TaxInvoiceStatusRequest {
  status: TaxInvoiceStatus;
  approvalNo?: string | null;
  issueDate?: string | null;
}

export interface TaxInvoicePeriodSummary {
  year: number;
  /** 1~4, 0 이면 연간 */
  quarter: number;
  from: string;
  to: string;
  issuedCount: number;
  requestedCount: number;
  issuedSupplyAmount: number;
  issuedVatAmount: number;
  requestedSupplyAmount: number;
  requestedVatAmount: number;
  invoices: TaxInvoice[];
}

export interface VatSummary {
  year: number;
  quarter: number;
  from: string;
  to: string;
  salesSupplyAmount: number;
  salesVatAmount: number;
  salesCount: number;
  purchaseTotalAmount: number;
  purchaseVatAmount: number;
  purchaseCount: number;
  purchaseWithVatCount: number;
  estimatedVatAmount: number;
  filingDeadline: string;
  filingLabel: string;
}

export interface TaxInvoiceBuyerPrefill {
  buyerName?: string | null;
  buyerBizNo?: string | null;
  buyerCeo?: string | null;
  buyerAddress?: string | null;
  buyerBizType?: string | null;
  buyerBizKind?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
}
