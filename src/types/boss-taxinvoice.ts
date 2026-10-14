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
export const REGISTRATION_STAGES = [
  'NEED_COMPANY',
  'NOT_REGISTERED',
  'PENDING_VERIFICATION',
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
}

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

/**
 * 전자 발급이 걸린 문서인지 — 수정 · 삭제 · 수기 상태 변경 · 재발급을 막고 상태 확인(sync)만 연다.
 * 실패(FAILED) · 불명(UNKNOWN)이어도 대행사에 문서가 남아 있을 수 있어 중복 발급을 막는다.
 */
export function isProviderManaged(inv: Pick<TaxInvoice, 'provider'>): boolean {
  return inv.provider != null;
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
