// 전자세금계산서 취소 — 화면이 판단하는 규칙(순수 함수)과 결과를 모르는 취소 시도 기록
//
// 국세청 전송 전(팝빌 300 · 301 · 302)은 발행취소, 전송 성공(304)은 전액을 차감하는 음수 수정세금계산서 1장.
// 어느 쪽인지는 서버가 팝빌 상태를 새로 읽어 정한다. 화면은 서버 미리보기를 원본 · 요청과 한 번 더 대조해
// 어긋나면 진행을 막는다(금액 · 승인번호 · 사유 코드 · 날짜를 화면이 지어내거나 보내지 않는다).
//
// 결과를 모르는 시도(응답 유실 · 화면 이탈)는 브라우저 저장소에 남겨, 서버가 결과를 기록했거나 정착 시간이 지난 뒤의
// 조회에서만 푼다 — 앱 issue_attempt_guard 와 같은 규칙. 서버도 같은 문서의 두 번째 요청을 막는다.

import {
  POPBILL_TAX_STATE_LABEL,
  TAX_CANCEL_MODIFY_CODE,
  type TaxCancelReason,
  type TaxInvoice,
  type TaxInvoiceCancellationPreview,
} from '@/types/boss-taxinvoice';
import { amountMismatch, isoDateOf, kstToday } from './taxInvoiceDocument';

export const TAX_CANCEL_REASONS: TaxCancelReason[] = ['CONTRACT_CANCEL', 'RETURN', 'DUPLICATE'];

export function isTaxCancelReason(v: unknown): v is TaxCancelReason {
  return typeof v === 'string' && (TAX_CANCEL_REASONS as string[]).includes(v);
}

/** 사유 고르기 화면의 설명 · 날짜 칸 */
export const TAX_CANCEL_REASON_GUIDE: Record<TaxCancelReason, { summary: string; dateLabel: string | null; dateHint: string }> = {
  CONTRACT_CANCEL: {
    summary: '도배 공사(용역) 계약이 해제 · 취소된 경우. 공사 계약 해제는 이 사유를 고르세요.',
    dateLabel: '계약 해제일',
    dateHint: '실제로 계약이 해제된 날입니다. 수정세금계산서 작성일자가 되고, 원본 작성일자는 비고에 적힙니다.',
  },
  RETURN: {
    summary: '판매한 자재 · 물품 전부를 반품(환입)받은 경우. 일부 반품은 지원하지 않습니다.',
    dateLabel: '환입(반품)일',
    dateHint: '물품이 반품된 날입니다. 수정세금계산서 작성일자가 되고, 원본 작성일자는 비고에 적힙니다.',
  },
  DUPLICATE: {
    summary: '같은 거래를 실수로 두 번 발급한 경우. 이중으로 발급된 쪽을 취소하세요.',
    dateLabel: null,
    dateHint: '작성일자는 원본 작성일자로 서버가 정합니다.',
  },
};

/** 미리보기 · 취소 요청에 보낼 날짜 — 착오에 의한 이중발급은 보내지 않는다(서버가 원본 작성일자로 정한다) */
export function requestDateOf(reason: TaxCancelReason, date: string): string | null {
  return reason === 'DUPLICATE' ? null : date.trim() || null;
}

/** yyyy-MM-dd 이고 달력에 있는 날인지(2월 30일 등은 거른다) */
function isRealDate(v: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** 날짜 칸 검사 — 원본 작성일자보다 앞서거나 한국시간 오늘보다 뒤면 막는다. 기한 · 가산세는 단정하지 않는다 */
export function occurrenceDateError(
  reason: TaxCancelReason,
  date: string,
  originIssueDate: string | null | undefined,
  today: string = kstToday(),
): string | null {
  if (reason === 'DUPLICATE') return null;
  const label = TAX_CANCEL_REASON_GUIDE[reason].dateLabel ?? '날짜';
  const v = date.trim();
  if (!v) return `${label}을 고르세요.`;
  if (!isRealDate(v)) return `${label} 형식이 올바르지 않습니다.`;
  const origin = isoDateOf(originIssueDate);
  if (origin && v < origin) return `${label}은 원본 작성일자(${origin})보다 앞설 수 없습니다.`;
  if (v > today) return `${label}은 오늘(한국시간 ${today}) 이후로 고를 수 없습니다.`;
  return null;
}

/**
 * 원본에서 "세금계산서 취소"를 시작할 수 없는 이유. null 이면 시작할 수 있다(최종 판단은 서버 미리보기).
 * 출시 값은 여기서 보지 않는다 — 호출한 쪽이 먼저 막는다.
 */
export function taxCancelBlockReason(inv: TaxInvoice, pendingAttemptAt: number | null): string | null {
  if (inv.docType !== 'TAX') return '현금영수증은 현금영수증 취소를 쓰세요.';
  if (inv.correctionOfInvoiceId != null) return '수정세금계산서(취소분)는 다시 취소할 수 없습니다.';
  if (inv.provider == null) return '도배르만에서 전자 발급한 세금계산서만 여기서 취소할 수 있습니다.';
  if (inv.id == null) return '문서 번호를 확인하지 못했습니다.';
  if (inv.taxCancelStatus != null) return '이미 취소를 요청한 문서입니다. 상태 다시 확인으로 결과를 보세요.';
  if (pendingAttemptAt != null) return '결과를 모르는 취소 요청이 있습니다. 결과를 확인하기 전에는 다시 요청할 수 없습니다.';
  if (inv.providerStatus !== 'ISSUED') return '발급 결과가 확정된 문서만 취소할 수 있습니다. 상태 다시 확인을 먼저 누르세요.';
  if (inv.status === 'CANCELED') return '이미 취소로 기록된 문서입니다.';
  return null;
}

/** 팝빌 상태 코드 설명 — 진행할 수 없는 상태면 이유 문장, 진행 가능한 코드면 null */
export function providerStateBlockNote(code: number | null): string | null {
  if (code == null) return '팝빌에서 문서 상태를 확인하지 못했습니다. 잠시 뒤 미리보기를 새로 받으세요.';
  if (code === 300 || code === 301 || code === 302 || code === 304) return null;
  if (code === 303) return '국세청으로 전송하는 중입니다. 전송 중에는 발행취소도 수정세금계산서도 할 수 없습니다. 전송 결과가 나온 뒤 다시 확인하세요.';
  if (code === 305) {
    return '국세청 전송에 실패한 문서는 수정세금계산서를 발급할 수 없습니다(팝빌 안내: 전송 실패 문서는 새 세금계산서로 처리). 실패 사유를 확인한 뒤 관리자에게 문의하세요.';
  }
  if (code === 600) return '팝빌에서 이미 발행취소된 문서입니다. 상태 다시 확인으로 기록을 맞추세요.';
  return `지원하지 않는 상태(${code})라 진행할 수 없습니다.`;
}

export function providerStateText(code: number | null): string {
  if (code == null) return '확인 못함';
  const label = POPBILL_TAX_STATE_LABEL[code];
  return label ? `${label} (${code})` : `알 수 없는 상태 (${code})`;
}

const digits = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '');

/**
 * 서버 미리보기를 원본 · 요청과 대조한다 — 서버가 이미 검증하지만, 화면이 보여 준 값과 실제로 보낼 값이 다르면 안 된다.
 * 문제가 하나라도 있으면 확인 버튼을 열지 않는다. 서버 issues 와 따로 모은다.
 */
export function previewProblems(
  p: TaxInvoiceCancellationPreview,
  expected: { id: number; reason: TaxCancelReason; requestDate: string | null },
): string[] {
  const out: string[] = [];
  const inv = p.invoice;
  if (inv.id != null && inv.id !== expected.id) out.push('다른 문서의 미리보기가 왔습니다.');
  if (p.reason !== expected.reason) out.push('요청한 사유와 다른 미리보기가 왔습니다.');
  if (!p.previewToken) out.push('확인 토큰이 없습니다. 미리보기를 새로 받으세요.');
  if (inv.docType !== 'TAX' || inv.correctionOfInvoiceId != null) out.push('세금계산서 원본이 아닙니다.');
  if (p.ready && p.mode == null) out.push('서버가 취소 방식을 정하지 못했습니다.');
  const code = p.providerStateCode;

  // 방식은 방금 새로 읽은 팝빌 상태 코드로만 판단한다 — 저장된 원본의 ntsStatus 는 아직 PENDING 일 수 있다
  // (발급 뒤 상태 다시 확인을 누르지 않은 보통의 경우). 그래서 원본 ntsStatus 는 막는 조건으로 쓰지 않는다.
  if (p.mode === 'CANCEL_ISSUE') {
    if (p.correction != null) out.push('전송 전 발행취소인데 수정분이 함께 왔습니다.');
    if (code !== 300 && code !== 301 && code !== 302) out.push(`발행취소할 수 없는 팝빌 상태입니다: ${providerStateText(code)}.`);
  }

  if (p.mode === 'CORRECTION') {
    if (code !== 304) out.push(`수정세금계산서는 국세청 전송 성공(304)에서만 발급합니다. 지금 팝빌 상태: ${providerStateText(code)}.`);
    const c = p.correction;
    if (!c) {
      out.push('수정세금계산서(취소분) 내용이 오지 않았습니다.');
      return out;
    }
    const expectedDate = expected.reason === 'DUPLICATE' ? isoDateOf(inv.issueDate) : expected.requestDate ?? '';
    if (c.docType !== 'TAX') out.push('수정분 문서 종류가 세금계산서가 아닙니다.');
    if (c.correctionOfInvoiceId != null && c.correctionOfInvoiceId !== expected.id) out.push('수정분이 다른 원본을 가리킵니다.');
    if (c.supplyAmount !== -inv.supplyAmount || c.vatAmount !== -inv.vatAmount || c.totalAmount !== -inv.totalAmount) {
      out.push('수정분 금액이 원본 전액의 음수(-)와 다릅니다.');
    }
    if (inv.totalAmount !== 0 && !(c.totalAmount < 0)) out.push('수정분 합계가 음수(-)가 아닙니다.');
    if ((c.items ?? []).some((it) => (it.supplyAmount ?? 0) > 0 || (it.vatAmount ?? 0) > 0)) out.push('수정분 품목에 양수 금액이 있습니다.');
    if (amountMismatch(c)) out.push('수정분 품목 합계와 문서 금액이 다릅니다.');
    if (c.modifyCode !== TAX_CANCEL_MODIFY_CODE[expected.reason]) out.push('수정사유 코드가 고른 사유와 다릅니다.');
    const org = c.orgNtsConfirmNum?.trim() ?? '';
    if (!org) out.push('당초 승인번호가 비어 있습니다.');
    else if (org !== (inv.approvalNo?.trim() ?? '')) out.push('당초 승인번호가 원본 승인번호와 다릅니다.');
    if (!expectedDate || isoDateOf(p.occurrenceDate) !== expectedDate) out.push('적용 일자가 요청과 다릅니다.');
    if (!expectedDate || isoDateOf(c.issueDate) !== expectedDate) out.push('수정분 작성일자가 적용 일자와 다릅니다.');
    if (!c.orgIssueDate) out.push('수정분에 당초 작성일자가 없습니다.');
    else if (isoDateOf(c.orgIssueDate) !== isoDateOf(inv.issueDate)) out.push('수정분의 당초 작성일자가 원본 작성일자와 다릅니다.');
    if (digits(c.buyerBizNo) !== digits(inv.buyerBizNo)) out.push('수정분 공급받는자가 원본과 다릅니다.');
    if (!p.supplier) out.push('발급 당시 공급자 정보가 없어 수정분 공급자를 확인할 수 없습니다.');
  }
  return out;
}

/** 서버 issues · 화면 대조 · 상태 코드를 합친 진행 불가 이유 */
export function previewBlockers(
  p: TaxInvoiceCancellationPreview,
  expected: { id: number; reason: TaxCancelReason; requestDate: string | null },
): string[] {
  const list = [...p.issues, ...previewProblems(p, expected)];
  if (!p.ready || p.mode == null) {
    const note = providerStateBlockNote(p.providerStateCode);
    if (note) list.push(note);
    if (list.length === 0) list.push('지금은 이 문서를 취소할 수 없습니다. 미리보기를 새로 받거나 상태 다시 확인을 누르세요.');
  }
  return Array.from(new Set(list));
}

// ─────────────────────────────────────────────
// 결과를 모르는 취소 시도 기록 — 브라우저 저장소(같은 브라우저의 다른 탭과 새로고침에도 남는다)
// ─────────────────────────────────────────────

/** 응답 없는 요청이 서버에서 끝났다고 볼 시간 — 요청 대기(60초)보다 넉넉히. 앱과 같은 5분 */
export const TAX_CANCEL_SETTLE_MS = 5 * 60 * 1000;
/** 취소 요청 대기 시간 */
export const TAX_CANCEL_TIMEOUT_MS = 60_000;

/**
 * 기록을 풀어도 되는지 — 방금 서버에서 읽은 문서로만 판단한다.
 *   서버가 취소 상태 · 수정분 · 취소 기록을 남겼으면 이후는 서버 상태가 관리한다.
 *   아직 아무 기록이 없으면 처리 중일 수 있어 정착 시간이 지난 뒤에만 푼다.
 */
export function canReleaseTaxCancelAttempt(attemptedAt: number, now: number, fresh: TaxInvoice): boolean {
  if (fresh.taxCancelStatus != null) return true;
  if (fresh.taxCancelInvoiceId != null) return true;
  if (fresh.status === 'CANCELED') return true;
  return now >= attemptedAt + TAX_CANCEL_SETTLE_MS;
}

/** 최소한의 저장소 모양 — 시험에서 가짜를 넣는다 */
export interface AttemptStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KEY = (id: number) => `doberman.boss.taxCancelAttempt.${id}`;

function browserStorage(): AttemptStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function createTaxCancelAttemptStore(getStorage: () => AttemptStorage | null = browserStorage) {
  const clear = (id: number) => {
    try {
      getStorage()?.removeItem(KEY(id));
    } catch {
      // 지우지 못해도 정착 시간 뒤 조회에서 풀린다
    }
  };
  const read = (id: number, now: number = Date.now()): number | null => {
    try {
      const st = getStorage();
      const raw = st?.getItem(KEY(id));
      if (!raw) return null;
      const at = Number(raw);
      if (Number.isFinite(at) && at > 0) return at;
      // 못 읽는 값도 "시도 있음"으로 본다(안전한 쪽) — 지금 시각으로 다시 적어 정착 시간을 센다
      st?.setItem(KEY(id), String(now));
      return now;
    } catch {
      return null;
    }
  };
  /** 요청을 보내기 전에 적는다. 적지 못했으면 false — 호출한 쪽은 요청을 보내지 않는다 */
  const mark = (id: number, at: number = Date.now()): boolean => {
    try {
      const st = getStorage();
      if (!st) return false;
      st.setItem(KEY(id), String(at));
      return st.getItem(KEY(id)) === String(at);
    } catch {
      return false;
    }
  };
  /** 서버에서 방금 읽은 문서로 풀 수 있으면 풀고, 남은 시도 시각을 돌려준다 */
  const reconcile = (fresh: TaxInvoice, now: number = Date.now()): number | null => {
    if (fresh.id == null) return null;
    const at = read(fresh.id, now);
    if (at == null) return null;
    if (canReleaseTaxCancelAttempt(at, now, fresh)) {
      clear(fresh.id);
      return null;
    }
    return at;
  };
  return { key: KEY, read, mark, clear, reconcile };
}

export const taxCancelAttemptStore = createTaxCancelAttemptStore();
