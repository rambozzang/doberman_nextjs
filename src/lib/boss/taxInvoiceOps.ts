// 전자 발급 운영 준비 — 응답 정리 · 화면 문구 · 링크 · 심사 검사 (화면과 분리한 순수 함수)
//
// 원칙
//   모르는 값은 모른다고 쓴다 — 비용 · 잔액이 없으면 "확인 전"이지 0원이 아니고, 인증서 날짜가 없으면 짐작하지 않는다.
//   모르는 상태값은 안전한 쪽으로 — 심사 상태를 모르면 처리 버튼을 열지 않고, 비용 방식을 모르면 "정책 확정 전"으로 둔다.
//   사장님 화면에는 내부 코드 · 기술 용어를 보이지 않는다(서버가 준 제목 · 문장을 쓰고, 없으면 쉬운 말로 채운다).

import { isRegistrationStage } from '@/types/boss-taxinvoice';
import type {
  AdminProblem,
  AdminProblemPage,
  AdminRegistration,
  AdminRegistrationPage,
  AdminReviewDecision,
  BalanceScope,
  BillingMode,
  CertificateStatus,
  ElectronicOperations,
  ElectronicRegistrationStatus,
  OperationAction,
  OperationIssue,
  OperationSeverity,
  RegistrationReviewStatus,
  RegistrationStage,
  TaxInvoice,
  TaxInvoiceActivity,
  TaxInvoiceActivityPage,
  TaxInvoiceAdminAccess,
  TaxInvoiceHistoryItem,
  TaxInvoiceHistoryPage,
  TaxInvoiceSupplier,
} from '@/types/boss-taxinvoice';

export type OpsTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'info';

// ─────────────────────────────────────────────
// 응답 정리
// ─────────────────────────────────────────────

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const count = (v: unknown, fallback: number): number => {
  const n = num(v);
  return n != null && n >= 0 ? Math.floor(n) : fallback;
};
/** 금액 · 잔액은 문자열로 받는다. 숫자로 와도 그대로 글자로 — 없으면 null(0 아님) */
const money = (v: unknown): string | null => (typeof v === 'number' && Number.isFinite(v) ? String(v) : str(v));
const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | null =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : null;

const CERT_STATUSES: readonly CertificateStatus[] = ['UNKNOWN', 'VALID', 'EXPIRING', 'EXPIRED'];
const BILLING_MODES: readonly BillingMode[] = ['UNDECIDED', 'PARTNER', 'MEMBER'];
const BALANCE_SCOPES: readonly BalanceScope[] = ['PARTNER', 'MEMBER'];
const SEVERITIES: readonly OperationSeverity[] = ['INFO', 'WARNING', 'ERROR'];
const ACTIONS: readonly OperationAction[] = ['REGISTRATION', 'CERTIFICATE', 'BILLING', 'SUPPORT'];
const REVIEW_STATUSES: readonly RegistrationReviewStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

function parseSupplier(v: unknown): TaxInvoiceSupplier | null {
  const s = obj(v);
  if (!s) return null;
  return {
    bizNo: text(s.bizNo),
    name: text(s.name),
    ceo: text(s.ceo),
    address: text(s.address),
    bizType: text(s.bizType),
    bizKind: text(s.bizKind),
    email: text(s.email),
    phone: text(s.phone),
  };
}

function parseRegistration(v: unknown): ElectronicRegistrationStatus | null {
  const r = obj(v);
  if (!r || !isRegistrationStage(r.stage)) return null;
  return r as unknown as ElectronicRegistrationStatus;
}

export function parseOperations(raw: unknown): ElectronicOperations | null {
  const o = obj(raw);
  if (!o) return null;
  const cert = obj(o.certificate) ?? {};
  const bill = obj(o.billing) ?? {};
  const sync = obj(o.autoSync) ?? {};
  const issues = Array.isArray(o.issues) ? o.issues : [];
  const interval = num(sync.intervalSeconds);
  return {
    registration: parseRegistration(o.registration),
    certificate: {
      status: oneOf(cert.status, CERT_STATUSES) ?? 'UNKNOWN',
      expiresAt: str(cert.expiresAt),
      daysRemaining: num(cert.daysRemaining),
    },
    billing: {
      // 방식을 모르면 정책 확정 전으로 본다 — 누가 내는지 짐작하지 않는다
      mode: oneOf(bill.mode, BILLING_MODES) ?? 'UNDECIDED',
      label: text(bill.label).trim(),
      message: text(bill.message).trim(),
      taxUnitCost: money(bill.taxUnitCost),
      cashUnitCost: money(bill.cashUnitCost),
      balance: money(bill.balance),
      balanceScope: oneOf(bill.balanceScope, BALANCE_SCOPES),
      checkedAt: str(bill.checkedAt),
      error: str(bill.error),
    },
    autoSync: {
      enabled: sync.enabled === true,
      intervalSeconds: interval != null && interval > 0 ? interval : null,
      lastRunAt: str(sync.lastRunAt),
      nextRunAt: str(sync.nextRunAt),
    },
    issues: issues
      .map((i): OperationIssue | null => {
        const x = obj(i);
        if (!x) return null;
        const title = text(x.title).trim();
        const message = text(x.message).trim();
        if (!title && !message) return null;
        return {
          code: text(x.code),
          severity: oneOf(x.severity, SEVERITIES) ?? 'INFO',
          title,
          message,
          action: oneOf(x.action, ACTIONS) ?? 'SUPPORT',
          invoiceId: num(x.invoiceId),
        };
      })
      .filter((i): i is OperationIssue => i != null),
  };
}

export function parseActivity(raw: unknown): TaxInvoiceActivity | null {
  const a = obj(raw);
  const id = num(a?.id);
  if (!a || id == null) return null;
  return {
    id,
    invoiceId: num(a.invoiceId),
    registrationId: num(a.registrationId),
    eventType: text(a.eventType),
    title: text(a.title).trim(),
    message: text(a.message).trim(),
    createdAt: text(a.createdAt),
    readAt: str(a.readAt),
  };
}

export function parseActivityPage(raw: unknown): TaxInvoiceActivityPage | null {
  const p = obj(raw);
  if (!p || !Array.isArray(p.items)) return null;
  const items = p.items.map(parseActivity).filter((a): a is TaxInvoiceActivity => a != null);
  const unread = num(p.unreadCount);
  return {
    items,
    totalElements: count(p.totalElements, items.length),
    unreadCount: unread != null && unread >= 0 ? Math.floor(unread) : null,
  };
}

function parseHistoryItem(raw: unknown): TaxInvoiceHistoryItem | null {
  const h = obj(raw);
  const id = num(h?.id);
  if (!h || id == null) return null;
  return {
    id,
    invoiceId: num(h.invoiceId),
    registrationId: num(h.registrationId),
    action: text(h.action),
    actorLabel: text(h.actorLabel).trim(),
    outcome: text(h.outcome),
    message: text(h.message).trim(),
    createdAt: text(h.createdAt),
  };
}

export function parseHistoryPage(raw: unknown): TaxInvoiceHistoryPage | null {
  const p = obj(raw);
  if (!p || !Array.isArray(p.items)) return null;
  const items = p.items.map(parseHistoryItem).filter((h): h is TaxInvoiceHistoryItem => h != null);
  return { items, totalElements: count(p.totalElements, items.length) };
}

/** isAdmin 이 참/거짓으로 오지 않으면 판정하지 못한 것 — 진입을 열지 않는다 */
export function parseAdminAccess(raw: unknown): TaxInvoiceAdminAccess | null {
  const a = obj(raw);
  if (!a || typeof a.isAdmin !== 'boolean') return null;
  return { isAdmin: a.isAdmin };
}

export function parseAdminRegistration(raw: unknown): AdminRegistration | null {
  const r = obj(raw);
  const id = num(r?.id);
  if (!r || id == null) return null;
  return {
    id,
    companyId: num(r.companyId) ?? 0,
    userId: text(r.userId),
    companyName: str(r.companyName),
    isTest: r.isTest === true,
    supplier: parseSupplier(r.supplier),
    submittedAt: text(r.submittedAt),
    reviewStatus: oneOf(r.reviewStatus, REVIEW_STATUSES),
    reviewedAt: str(r.reviewedAt),
    reviewReason: str(r.reviewReason),
    reviewToken: text(r.reviewToken),
  };
}

export function parseAdminRegistrationPage(raw: unknown): AdminRegistrationPage | null {
  const p = obj(raw);
  if (!p || !Array.isArray(p.items)) return null;
  const items = p.items.map(parseAdminRegistration).filter((r): r is AdminRegistration => r != null);
  return { items, totalElements: count(p.totalElements, items.length) };
}

/** 문서 모양인지(문서 종류가 있는지)만 본다. 품목은 늘 배열로 */
export function parseInvoice(raw: unknown): TaxInvoice | null {
  const i = obj(raw);
  if (!i || (i.docType !== 'TAX' && i.docType !== 'CASH')) return null;
  const inv = i as unknown as TaxInvoice;
  return { ...inv, items: Array.isArray(inv.items) ? inv.items : [] };
}

export function parseProblemPage(raw: unknown): AdminProblemPage | null {
  const p = obj(raw);
  if (!p || !Array.isArray(p.items)) return null;
  const items = p.items
    .map((x): AdminProblem | null => {
      const r = obj(x);
      const invoice = parseInvoice(r?.invoice);
      if (!r || !invoice || invoice.id == null) return null;
      return {
        invoice,
        ownerUserId: text(r.ownerUserId),
        lastError: str(r.lastError),
        lastSyncedAt: str(r.lastSyncedAt),
        canSync: r.canSync === true,
      };
    })
    .filter((r): r is AdminProblem => r != null);
  return { items, totalElements: count(p.totalElements, items.length) };
}

// ─────────────────────────────────────────────
// 날짜 · 금액 표기
// ─────────────────────────────────────────────

const KST_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * 일시 → "2026-10-16 14:05"(한국시간). 시간대가 붙은 값(Z · +09:00)은 한국시간으로 바꾸고,
 * 없는 값은 서버 표기(한국시간) 그대로 자른다. 읽을 수 없으면 null — 다른 날짜로 채우지 않는다.
 */
export function formatOpsDateTime(v: string | null | undefined): string | null {
  const s = (v ?? '').trim();
  if (!s) return null;
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    const parts = Object.fromEntries(KST_FORMAT.formatToParts(d).map((p) => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  }
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(s);
  if (!m) return null;
  return m[2] ? `${m[1]} ${m[2]}` : m[1];
}

/** 날짜만 → "2026-10-16". 읽을 수 없으면 null */
export function formatOpsDate(v: string | null | undefined): string | null {
  const t = formatOpsDateTime(v);
  return t ? t.slice(0, 10) : null;
}

/**
 * 발급 비용 · 잔액 글자 — 팝빌 포인트 값이다(단가 GetUnitCost · 잔액 GetBalance). 숫자면 "1,234P", 아니면 받은 그대로.
 * 원화 · 부가세 포함 최종 요금으로 바꿔 짐작하지 않는다. 없으면 null(0P 라고 쓰지 않는다).
 */
export function formatPoint(v: string | null | undefined): string | null {
  const s = (v ?? '').trim();
  if (!s) return null;
  const plain = s.replace(/,/g, '');
  if (/^-?\d+(\.\d+)?$/.test(plain)) return `${Number(plain).toLocaleString('ko-KR')}P`;
  return s;
}

// ─────────────────────────────────────────────
// 운영 상태 문구
// ─────────────────────────────────────────────

export interface StatusView {
  tone: OpsTone;
  tag: string;
  text: string;
}

/** 공동인증서 등록(4단계) 전 단계 — 이때 인증서를 모르는 것은 오류가 아니라 아직 등록하지 않은 것이다 */
const BEFORE_CERTIFICATE: RegistrationStage[] = ['NEED_COMPANY', 'NOT_REGISTERED', 'PENDING_VERIFICATION', 'REJECTED', 'VERIFIED'];

/**
 * 공동인증서 — 세금계산서 발급에만 필요하다.
 * [stage] 를 주면 등록 단계가 인증서 전일 때 "확인하지 못함" 대신 "아직 등록 전"으로 쓴다(2026-10-21 — 미신청 사장님에게 오류처럼 읽혔다).
 */
export function certificateView(c: ElectronicOperations['certificate'], stage?: RegistrationStage | null): StatusView {
  const date = formatOpsDate(c.expiresAt);
  const days = c.daysRemaining;
  switch (c.status) {
    case 'VALID':
      return {
        tone: 'ok',
        tag: '유효',
        text: date ? `${date}까지 유효합니다${days != null && days >= 0 ? ` (${days}일 남음)` : ''}.` : '유효한 인증서가 등록되어 있습니다. 만료일은 확인하지 못했습니다.',
      };
    case 'EXPIRING':
      return {
        tone: 'warn',
        tag: '곧 만료',
        text: `${date ? `${date}에 만료됩니다` : '곧 만료됩니다'}${days != null && days >= 0 ? ` (${days}일 남음)` : ''}. 만료되면 세금계산서를 발급할 수 없으니 미리 갱신해 주세요.`,
      };
    case 'EXPIRED':
      return {
        tone: 'bad',
        tag: '만료됨',
        text: `${date ? `${date}에 만료되었습니다. ` : '인증서가 만료되었습니다. '}갱신하기 전에는 세금계산서를 발급할 수 없습니다.`,
      };
    default:
      if (stage && BEFORE_CERTIFICATE.includes(stage)) {
        return { tone: 'neutral', tag: '아직 등록 전', text: '4단계(공동인증서 등록)에서 등록해요.' };
      }
      return {
        tone: 'neutral',
        tag: '확인하지 못함',
        text: '인증서 등록 여부 · 만료일을 확인하지 못했습니다. 등록 단계를 마쳤다면 잠시 뒤 다시 확인해 주세요.',
      };
  }
}

export const BILLING_MODE_TAG: Record<BillingMode, string> = {
  UNDECIDED: '정책 확정 전',
  PARTNER: '도배르만 부담',
  MEMBER: '내 계정 차감',
};

export interface BillingView {
  tone: OpsTone;
  tag: string;
  title: string;
  lines: string[];
  /** 내 계정 차감(MEMBER)일 때만 — 내 건당 비용 · 내 잔액(포인트). 모르는 값은 "확인 전" */
  rows: { label: string; value: string }[];
  checkedAt: string | null;
  /** 내 잔액 · 비용을 실제로 조회하지 못한 이유 — 0원으로 보이지 않게 따로 말한다 */
  error: string | null;
}

/**
 * 발급 비용 — 정책 · 이용 환경 · 조회 실패를 그대로 보인다. 금액을 짐작하거나 무료라고 말하지 않는다.
 * 서비스 부담(PARTNER)은 사장님 화면에 금액 · 잔액을 하나도 보이지 않는다 — 서버가 숫자를 실수로 보내도 쓰지 않는다
 * (서비스 전체 잔액 · 내부 단가는 사장님 정보가 아니다). 내 계정 차감(MEMBER)만 내 금액을 보인다.
 */
export function billingView(b: ElectronicOperations['billing']): BillingView {
  if (b.mode === 'UNDECIDED') {
    return {
      tone: 'neutral',
      tag: BILLING_MODE_TAG.UNDECIDED,
      title: b.label || '발급 비용 정책 확정 전',
      lines: [b.message || '발급 비용을 어떻게 부담할지 아직 정해지지 않았습니다. 정해지면 건당 비용과 함께 이 화면과 앱에서 안내해 드립니다.'],
      rows: [],
      checkedAt: null,
      error: null,
    };
  }
  if (b.mode === 'PARTNER') {
    return {
      tone: 'info',
      tag: BILLING_MODE_TAG.PARTNER,
      title: '발급 비용은 도배르만이 부담합니다',
      // 서버 안내에는 구독 요금도 함께 오지만, 요금은 바로 위 '구독 · 요금'에서 따로 보여 준다(같은 말 반복 방지 · 2026-10-17)
      lines: ['팝빌 포인트를 따로 충전하거나 결제할 필요가 없습니다.'],
      rows: [],
      checkedAt: null,
      error: null,
    };
  }
  const unknown = '확인 전';
  const balance = formatPoint(b.balance);
  const rows = [
    { label: '세금계산서 1건', value: formatPoint(b.taxUnitCost) ?? unknown },
    { label: '현금영수증 1건', value: formatPoint(b.cashUnitCost) ?? unknown },
  ];
  // 내 잔액만 — 다른 범위의 잔액이 섞여 오면 보이지 않는다
  if (b.balanceScope !== 'PARTNER') rows.push({ label: '내 팝빌 포인트 잔액', value: balance ?? (b.error ? '확인하지 못함' : unknown) });
  return {
    tone: b.error ? 'warn' : 'info',
    tag: BILLING_MODE_TAG.MEMBER,
    title: b.label || '발급 비용은 내 팝빌 포인트에서 차감됩니다',
    lines: [...(b.message ? [b.message] : []), '비용 · 잔액은 팝빌 포인트(P) 기준입니다. 실제 결제 금액은 팝빌에서 확인해 주세요.'],
    rows,
    checkedAt: formatOpsDateTime(b.checkedAt),
    error: b.error,
  };
}

/** 자동 상태 확인 — 정식 오픈 전에는 쉬고 있다는 것을 먼저 말한다 */
export function autoSyncView(a: ElectronicOperations['autoSync'], launchOpen: boolean): StatusView & { rows: { label: string; value: string }[] } {
  // 값이 있는 줄만 — "기록 없음 · 예정 없음" 같은 빈 줄은 사장님께 뜻이 없다(2026-10-17)
  const last = formatOpsDateTime(a.lastRunAt);
  const next = formatOpsDateTime(a.nextRunAt);
  const rows = [
    ...(last ? [{ label: '마지막 확인', value: last }] : []),
    ...(next ? [{ label: '다음 확인', value: next }] : []),
  ];
  if (!launchOpen) {
    return {
      tone: 'neutral',
      tag: '오픈 후 동작',
      text: '정식 오픈 뒤 켜집니다. 발급 결과 · 국세청 전송 상태를 자동으로 다시 확인해 알려 드립니다.',
      rows: [],
    };
  }
  if (!a.enabled) {
    return {
      tone: 'warn',
      tag: '꺼짐',
      text: '자동 확인이 꺼져 있습니다. 결과를 모르는 문서는 상세 화면의 상태 다시 확인으로 확인해 주세요.',
      rows,
    };
  }
  const every = a.intervalSeconds == null ? null : a.intervalSeconds >= 120 ? `약 ${Math.round(a.intervalSeconds / 60)}분마다` : `약 ${Math.round(a.intervalSeconds)}초마다`;
  return {
    tone: 'ok',
    tag: '켜짐',
    text: `처리 중이거나 결과를 모르는 문서를 ${every ? `${every} ` : ''}자동으로 다시 확인합니다. 바뀐 결과는 알림으로 알려 드립니다. 다시 발급하거나 취소하지는 않습니다.`,
    rows,
  };
}

export const SEVERITY_TONE: Record<OperationSeverity, OpsTone> = {
  INFO: 'info',
  WARNING: 'warn',
  ERROR: 'bad',
};

/** 안내 항목의 이동 위치 — 등록 화면 안의 구역이나 그 문서. 운영팀 문의는 문서가 있을 때만 문서로 */
export function issueHref(issue: Pick<OperationIssue, 'action' | 'invoiceId'>): string | null {
  if (issue.invoiceId != null) return `/boss/tax-invoice/${issue.invoiceId}`;
  switch (issue.action) {
    case 'REGISTRATION':
      return '/boss/tax-invoice/registration#registration-progress';
    case 'CERTIFICATE':
      return '/boss/tax-invoice/registration#certificate';
    case 'BILLING':
      return '/boss/tax-invoice/registration#billing';
    default:
      return null;
  }
}

export const ISSUE_ACTION_LABEL: Record<OperationAction, string> = {
  REGISTRATION: '등록 단계 보기',
  CERTIFICATE: '인증서 보기',
  BILLING: '비용 안내 보기',
  SUPPORT: '문서 보기',
};

// ─────────────────────────────────────────────
// 알림 · 이력
// ─────────────────────────────────────────────

/** 알림이 가리키는 곳 — 문서가 있으면 그 상세, 없으면 발급 서비스 등록 */
export function activityHref(a: Pick<TaxInvoiceActivity, 'invoiceId'>): string {
  return a.invoiceId != null ? `/boss/tax-invoice/${a.invoiceId}` : '/boss/tax-invoice/registration';
}

/** 알림 종류(서버 코드)에서 색만 고른다 — 글자는 서버 제목을 쓴다 */
export function activityTone(eventType: string): OpsTone {
  const t = eventType.toUpperCase();
  if (/(REJECT|FAIL|EXPIRED|ERROR)/.test(t)) return 'bad';
  if (/(UNKNOWN|EXPIRING|CERTIFICATE|BALANCE|LOW|WARN)/.test(t)) return 'warn';
  if (/(APPROV|SUCCESS|SENT|ISSUED|CANCELED|CANCELLED|DONE|CONFIRM)/.test(t)) return 'ok';
  return 'info';
}

/** 알림 제목 — 서버 제목이 비면 문서 · 등록 중 무엇에 관한 것인지만 말한다 */
export function activityTitle(a: Pick<TaxInvoiceActivity, 'title' | 'invoiceId'>): string {
  return a.title || (a.invoiceId != null ? '세금계산서 · 현금영수증 상태가 바뀌었습니다' : '발급 서비스 등록 안내');
}

const ACTION_LABEL: Record<string, string> = {
  ISSUE: '발급',
  SYNC: '상태 확인',
  AUTO_SYNC: '자동 상태 확인',
  ADMIN_SYNC: '운영자 상태 확인',
  CANCEL: '취소',
  CASH_CANCEL: '현금영수증 취소',
  TAX_CANCEL: '세금계산서 취소',
  CANCEL_ISSUE: '발행취소',
  CORRECTION: '수정세금계산서 발급',
  REGISTER: '권한 신청',
  REGISTRATION: '권한 신청',
  REAPPLY: '다시 신청',
  REVIEW: '심사',
  APPROVE: '승인',
  REJECT: '반려',
  LINK: '팝빌 연동',
  CERTIFICATE: '인증서',
  NOTIFY: '알림',
};

/** 처리 종류 이름 — 모르는 코드는 그대로 보이지 않고 "처리"로 */
export function historyActionLabel(action: string): string {
  return ACTION_LABEL[action.toUpperCase()] ?? '처리';
}

const OUTCOME_VIEW: Record<string, { label: string; tone: OpsTone }> = {
  SUCCESS: { label: '성공', tone: 'ok' },
  OK: { label: '성공', tone: 'ok' },
  DONE: { label: '완료', tone: 'ok' },
  APPROVED: { label: '승인', tone: 'ok' },
  ISSUED: { label: '발급 완료', tone: 'ok' },
  SENT: { label: '전송 완료', tone: 'ok' },
  CANCELED: { label: '취소 완료', tone: 'neutral' },
  CHANGED: { label: '상태 바뀜', tone: 'info' },
  UNCHANGED: { label: '변화 없음', tone: 'neutral' },
  NO_CHANGE: { label: '변화 없음', tone: 'neutral' },
  PENDING: { label: '대기', tone: 'info' },
  PROCESSING: { label: '처리 중', tone: 'info' },
  UNKNOWN: { label: '결과 확인 필요', tone: 'warn' },
  SKIPPED: { label: '건너뜀', tone: 'neutral' },
  BLOCKED: { label: '막힘', tone: 'warn' },
  REJECTED: { label: '거절', tone: 'bad' },
  FAILED: { label: '실패', tone: 'bad' },
  ERROR: { label: '실패', tone: 'bad' },
};

export function historyOutcome(outcome: string): { label: string; tone: OpsTone } {
  return OUTCOME_VIEW[outcome.toUpperCase()] ?? { label: '기록', tone: 'neutral' };
}

// ─────────────────────────────────────────────
// 화면 다시 읽기 — 서버 자동 확인 결과를 보이는 동안만, 정해진 횟수만
// ─────────────────────────────────────────────

/** 다시 읽는 간격(밀리초). 다 쓰면 멈추고, 화면에 다시 돌아오면 처음부터 한 번 더 */
export const POLL_DELAYS_MS: readonly number[] = [20_000, 40_000, 80_000, 160_000, 300_000];

/** n 번째(0부터) 다시 읽기까지 기다릴 시간 — 정해진 횟수를 넘으면 null(멈춤) */
export function pollDelay(index: number, delays: readonly number[] = POLL_DELAYS_MS): number | null {
  return index >= 0 && index < delays.length ? delays[index] : null;
}

/**
 * 서버의 자동 상태 확인으로 바뀔 수 있는 문서인지 — 발급 처리 중 · 결과 불명, 국세청 전송 대기, 취소 처리 중 · 불명.
 * 시험 환경 문서도 같다(서버가 환경별로 막는다). 화면은 서버에 저장된 문서만 다시 읽는다(팝빌 조회 아님).
 */
export function awaitsServerUpdate(inv: TaxInvoice): boolean {
  if (inv.provider == null && inv.correctionOfInvoiceId == null && inv.taxCancelStatus == null) return false;
  if (inv.status === 'CANCELED' && inv.taxCancelStatus == null && inv.providerCancelStatus == null) return false;
  const ps = inv.providerStatus ?? null;
  if (inv.provider != null && (ps == null || ps === 'PROCESSING' || ps === 'UNKNOWN')) return true;
  if (ps === 'ISSUED' && inv.ntsStatus === 'PENDING') return true;
  if (inv.taxCancelStatus === 'PROCESSING' || inv.taxCancelStatus === 'UNKNOWN') return true;
  if (inv.providerCancelStatus === 'PROCESSING' || inv.providerCancelStatus === 'UNKNOWN') return true;
  if (inv.providerCancelStatus === 'CANCELED' && inv.providerCancelNtsStatus === 'PENDING') return true;
  return false;
}

// ─────────────────────────────────────────────
// 운영자 심사
// ─────────────────────────────────────────────

export const REVIEW_REASON_MAX = 500;

export interface ReviewForm {
  decision: AdminReviewDecision | null;
  reason: string;
  /** 사업자 · 대표자 · 신청자 소속을 확인했다는 체크 */
  verified: boolean;
}

/** 심사 요청을 보내지 못하는 이유 — 비어 있어야 보낼 수 있다 */
export function reviewBlockers(row: AdminRegistration, form: ReviewForm): string[] {
  const out: string[] = [];
  if (row.reviewStatus !== 'PENDING') out.push(row.reviewStatus == null ? '심사 상태를 확인하지 못했습니다. 목록을 새로 불러 주세요.' : '이미 처리된 신청입니다.');
  if (!row.reviewToken) out.push('신청 내용을 다시 불러와야 합니다.');
  if (!form.decision) out.push('승인 또는 반려를 고르세요.');
  const reason = form.reason.trim();
  // 승인 · 반려 사유 모두 사장님 화면에 공개된다(운영자 상태 조회 메모만 내부 이력)
  if (reason.length < 2) {
    const kind = form.decision === 'REJECT' ? '반려 ' : form.decision === 'APPROVE' ? '승인 ' : '';
    out.push(`${kind}사유를 적어 주세요. 사장님 화면에 그대로 보입니다.`);
  }
  else if (reason.length > REVIEW_REASON_MAX) out.push(`사유는 ${REVIEW_REASON_MAX}자 이하로 줄여 주세요.`);
  if (!form.verified) out.push('사업자 권한 확인 항목에 체크하세요.');
  return out;
}

export const SYNC_NOTE_MAX = 300;

/** 운영자 상태 조회를 보내지 못하는 이유 */
export function syncBlockers(problem: AdminProblem, note: string, confirmed: boolean): string[] {
  const out: string[] = [];
  if (!problem.canSync) out.push('지금은 이 문서의 상태를 조회할 수 없습니다.');
  const n = note.trim();
  if (n.length < 2) out.push('조회하는 이유를 적어 주세요. 처리 이력에 남습니다.');
  else if (n.length > SYNC_NOTE_MAX) out.push(`메모는 ${SYNC_NOTE_MAX}자 이하로 줄여 주세요.`);
  if (!confirmed) out.push('확인 항목에 체크하세요.');
  return out;
}

/** 쪽 수 — 0건이어도 1쪽 */
export function totalPages(totalElements: number, size: number): number {
  return Math.max(1, Math.ceil(Math.max(0, totalElements) / Math.max(1, size)));
}
