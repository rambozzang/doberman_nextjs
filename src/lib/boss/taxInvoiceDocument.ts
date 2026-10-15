// 세금계산서 · 현금영수증 — 상태 이름 · 서식(종이)에 찍을 값을 한 곳에서 만든다
//
// 목록 · 상세 · 미리보기 · PDF · 인쇄가 모두 이 함수들을 쓴다. 화면과 종이의 금액 · 공급자 · 상태 문구가 어긋나지 않게 하려는 것.
// 원칙: 없는 값은 지어내지 않는다 — 승인번호는 실제 발급(시험 제외)이나 사장님이 홈택스 발행분으로 적은 것만,
//       미발급 · 시험 · 결과 불명 · 취소는 종이 안에 그대로 찍는다.

import {
  CASH_IDENTITY_LABEL,
  CASH_TAXATION_LABEL,
  CASH_USAGE_LONG_LABEL,
  DOC_TYPE_LABEL,
  MODIFY_CODE_LABEL,
  NTS_STATUS_LABEL,
  TAX_CANCEL_MODIFY_CODE,
  type TaxInvoice,
  type TaxInvoiceDocType,
  type TaxInvoiceItem,
  type TaxInvoiceNtsStatus,
} from '@/types/boss-taxinvoice';
import { toKoreanAmount, toKoreanAmountLabel } from './koreanAmount';
import { cashFieldsOf, maskCashIdentity } from './taxInvoiceCash';

export type DisplayTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'info';

/** 목록 필터 묶음 — 미발급 · 발급 완료 · 확인 필요 · 취소 */
export type DisplayKey = 'draft' | 'issued' | 'attention' | 'canceled';

export const DISPLAY_KEY_LABEL: Record<DisplayKey, string> = {
  draft: '미발급',
  issued: '발급 완료',
  attention: '확인 필요',
  canceled: '취소',
};

export interface DisplayState {
  key: DisplayKey;
  label: string;
  tone: DisplayTone;
  /** 대행사(팝빌)를 거친 문서 */
  electronic: boolean;
  /** 시험 환경 발급 — 효력 없음 */
  test: boolean;
  /** 음수 수정세금계산서(취소분) */
  correction: boolean;
}

/**
 * 한 문서의 지금 상태 — 전자 발급 · 취소 상태를 기존 status(REQUESTED|ISSUED|CANCELED)보다 먼저 본다.
 * 결과를 모르는 상태(처리 중 · 불명 · 실패 · 취소 불명)는 모두 "확인 필요"로 모은다 — 다시 발급 · 취소하기 전에 상태 조회가 먼저다.
 *
 * 세금계산서 취소:
 *   전송 전 발행취소 완료(CANCELED) → 취소 묶음. 원본 status 도 CANCELED 라 집계에서 빠진다.
 *   수정세금계산서 발급 완료(CORRECTION_ISSUED) → 원본은 원본 그대로 발급 완료 묶음에 남는다.
 *     음수 수정분도 발급 완료 묶음이라 둘이 함께 더해져 0원이 된다(원본만 빼고 음수만 남기면 안 된다).
 */
export function displayState(inv: TaxInvoice): DisplayState {
  const electronic = inv.provider != null;
  const test = inv.providerIsTest === true;
  const correction = inv.correctionOfInvoiceId != null;
  const base = { electronic, test, correction };
  if (correction) {
    // 팝빌에서 발행취소(600)된 수정분 — 대행사 값이 ISSUED 로 남아 있어도 기록 상태 CANCELED 가 먼저다(효력 없음)
    if (inv.status === 'CANCELED') return { ...base, key: 'canceled', label: '수정분 취소됨', tone: 'bad' };
    // 서버 미리보기가 만든 수정분(아직 저장 · 요청 전) — 결과 불명과 다르다
    if (isCorrectionPreview(inv)) return { ...base, key: 'draft', label: '미발급 수정분 미리보기', tone: 'neutral' };
    switch (inv.providerStatus) {
      case 'ISSUED':
        return { ...base, key: 'issued', label: '수정분 발급 완료', tone: 'ok' };
      case 'PROCESSING':
        return { ...base, key: 'attention', label: '수정분 발급 처리 중', tone: 'info' };
      case 'FAILED':
        return { ...base, key: 'attention', label: '수정분 발급 실패', tone: 'bad' };
      default:
        return { ...base, key: 'attention', label: '수정분 결과 확인 필요', tone: 'warn' };
    }
  }
  switch (inv.taxCancelStatus) {
    case 'CANCELED':
      return { ...base, key: 'canceled', label: '발행취소 완료', tone: 'neutral' };
    case 'CORRECTION_ISSUED':
      return { ...base, key: 'issued', label: '수정발급 완료', tone: 'neutral' };
    case 'UNKNOWN':
      return { ...base, key: 'attention', label: '취소 결과 확인 필요', tone: 'warn' };
    case 'PROCESSING':
      return {
        ...base,
        key: 'attention',
        label: inv.taxCancelMode === 'CORRECTION' ? '수정발급 처리 중' : inv.taxCancelMode === 'CANCEL_ISSUE' ? '발행취소 처리 중' : '취소 처리 중',
        tone: 'info',
      };
    default:
      break;
  }
  if (electronic) {
    const cancel = inv.providerCancelStatus ?? null;
    if (cancel === 'CANCELED') return { ...base, key: 'canceled', label: '발급 취소됨', tone: 'neutral' };
    if (cancel === 'UNKNOWN') return { ...base, key: 'attention', label: '취소 결과 확인 필요', tone: 'warn' };
    if (cancel === 'PROCESSING') return { ...base, key: 'attention', label: '취소 처리 중', tone: 'info' };
    switch (inv.providerStatus) {
      case 'ISSUED':
        return { ...base, key: 'issued', label: '전자 발급 완료', tone: 'ok' };
      case 'PROCESSING':
        return { ...base, key: 'attention', label: '발급 처리 중', tone: 'info' };
      case 'FAILED':
        return { ...base, key: 'attention', label: '발급 실패', tone: 'bad' };
      default:
        return { ...base, key: 'attention', label: '발급 결과 확인 필요', tone: 'warn' };
    }
  }
  if (inv.status === 'ISSUED') return { ...base, key: 'issued', label: '발행 완료', tone: 'ok' };
  if (inv.status === 'CANCELED') return { ...base, key: 'canceled', label: '취소', tone: 'neutral' };
  return { ...base, key: 'draft', label: '미발급', tone: 'warn' };
}

/**
 * 서버 취소 미리보기가 만든 음수 수정분인지 — 저장 전(id 없음) · 대행사 값 없음 · 미발급.
 * 실제 요청 전이므로 "발급 결과 확인 필요"가 아니라 "미발급 수정분 미리보기"로 보인다.
 */
export function isCorrectionPreview(inv: TaxInvoice): boolean {
  return inv.correctionOfInvoiceId != null && inv.id == null && inv.provider == null && inv.status === 'REQUESTED';
}

/** 발급이 확정된 수정세금계산서(취소분)인지 — 대행사 발급 완료이면서 기록 상태도 발행 완료, 시험 제외 */
export function isSettledCorrection(inv: TaxInvoice): boolean {
  return inv.correctionOfInvoiceId != null && inv.providerStatus === 'ISSUED' && inv.status === 'ISSUED' && inv.providerIsTest !== true;
}

/**
 * 목록 금액 합계에 넣는 문서인지 — 취소 묶음(수기 취소 · 발행취소 · 현금영수증 취소)과 시험 발급은 뺀다.
 * 수정세금계산서(취소분)는 발급이 확정된 것만(isSettledCorrection) 음수 그대로 더한다 — 처리 중 · 불명 · 실패 수정분이
 *   원본 매출을 0원처럼 보이게 하면 안 된다. 그 원본(CORRECTION_ISSUED · 취소 처리 중)은 원본 금액 그대로 더한다.
 * 수정분이 아닌 미발급 작성본은 예전처럼 더한다(지금 보이는 목록의 합계).
 */
export function countsInTotals(inv: TaxInvoice): boolean {
  if (inv.correctionOfInvoiceId != null) return isSettledCorrection(inv);
  const s = displayState(inv);
  return s.key !== 'canceled' && !s.test;
}

export interface ListTotals {
  count: number;
  /** 합계에서 뺀 건수(취소 · 시험 · 발급 미확정 수정분) */
  excluded: number;
  /** 그중 발급이 확정되지 않아 뺀 수정분 건수 */
  unsettledCorrections: number;
  /** 합계에 음수로 들어간 수정세금계산서(취소분) 건수 */
  corrections: number;
  supply: number;
  vat: number;
  total: number;
}

/** 지금 보이는 목록의 합계 — 문서마다 저장된 금액(확정된 음수 수정분 포함)을 그대로 더한다 */
export function listTotals(list: TaxInvoice[]): ListTotals {
  const counted = list.filter(countsInTotals);
  return {
    count: list.length,
    excluded: list.length - counted.length,
    unsettledCorrections: list.filter((i) => i.correctionOfInvoiceId != null && !isSettledCorrection(i) && i.providerIsTest !== true).length,
    corrections: counted.filter((i) => i.correctionOfInvoiceId != null).length,
    supply: counted.reduce((a, i) => a + i.supplyAmount, 0),
    vat: counted.reduce((a, i) => a + i.vatAmount, 0),
    total: counted.reduce((a, i) => a + i.totalAmount, 0),
  };
}

// ─────────────────────────────────────────────
// 수정세금계산서(취소분)
// ─────────────────────────────────────────────

/** 목록 · 상세 · 서식에서 쓰는 문서 종류 이름 — 수정분은 일반 세금계산서와 구별한다 */
export function docKindLabel(inv: Pick<TaxInvoice, 'docType' | 'correctionOfInvoiceId'>): string {
  if (inv.correctionOfInvoiceId != null) return '수정세금계산서(취소분)';
  return DOC_TYPE_LABEL[inv.docType];
}

/** 수정분의 수정사유 이름 — 저장된 코드 우선, 없으면 원본 사유로 */
export function correctionReasonText(inv: Pick<TaxInvoice, 'modifyCode' | 'taxCancelReason'>): string {
  const code = inv.modifyCode ?? (inv.taxCancelReason ? TAX_CANCEL_MODIFY_CODE[inv.taxCancelReason] : null);
  if (code == null) return '확인 필요';
  const label = MODIFY_CODE_LABEL[code];
  return label ? `${label}(${code})` : `수정사유 ${code}`;
}

/** 수정분의 당초 작성일자 — 서버가 고정 저장한 orgIssueDate 만 쓴다(승인번호 · 품목 일자 · 메모로 추정하지 않는다) */
export function originIssueDateText(inv: Pick<TaxInvoice, 'orgIssueDate'>): string {
  return isoDateOf(inv.orgIssueDate) || '확인 필요';
}

/**
 * 금액 한글 표기 — 음수(수정세금계산서 취소분)는 "마이너스"를 붙인다.
 * 공용 toKoreanAmountLabel 은 부호를 버리므로 세금계산서 화면 · 서식은 이 함수를 쓴다.
 */
export function koreanAmountText(amount: number | null | undefined): string {
  const n = Number(amount) || 0;
  if (n < 0) return `金 마이너스 ${toKoreanAmount(n)}원整`;
  return toKoreanAmountLabel(n);
}

// ─────────────────────────────────────────────
// 종이에 찍는 상태
// ─────────────────────────────────────────────

export interface PaperState {
  /** 종이 맨 위 띠 — 모든 쪽에 찍힌다 */
  banner: string;
  /** 띠 아래 한 줄 설명 */
  note: string;
  /** 쪽 가운데 옅은 큰 글씨. 효력 있는 사본(전자 발급 완료 · 홈택스 발행분)은 없음 */
  watermark: string | null;
  tone: 'plain' | 'warn' | 'bad';
}

export function paperState(inv: TaxInvoice): PaperState {
  const doc = DOC_TYPE_LABEL[inv.docType];
  const s = displayState(inv);
  // 취소된 수정분이 최우선 — 유효한 사본처럼 보이면 안 된다(시험 문서여도 취소 표시)
  if (s.correction && inv.status === 'CANCELED') {
    return {
      banner: '수정분 취소됨 · 효력 없음',
      note: `발행취소된 수정세금계산서(취소분)입니다${inv.providerIsTest ? '(시험 환경)' : ''}. 원본을 차감하지 않으며 집계에서 빠집니다. 수정사유 ${correctionReasonText(inv)} · 당초 승인번호 ${inv.orgNtsConfirmNum?.trim() || '확인 필요'}. 원본의 취소 상태를 다시 확인하세요.`,
      watermark: '취소',
      tone: 'bad',
    };
  }
  if (s.test) {
    return {
      banner: '시험 발급 · 효력 없음',
      note: `시험 환경에서 만든 문서입니다. 국세청에 전송되지 않으며 ${doc}로서 효력이 없습니다.`,
      watermark: '시험 발급',
      tone: 'bad',
    };
  }
  if (s.correction && isCorrectionPreview(inv)) {
    return {
      banner: '미발급 수정분 미리보기 · 참고용',
      note: `아직 발급을 요청하지 않은 수정세금계산서(취소분) 미리보기입니다. 수정사유 ${correctionReasonText(inv)} · 당초 승인번호 ${inv.orgNtsConfirmNum?.trim() || '확인 필요'} · 당초 작성일자 ${originIssueDateText(inv)}. 효력이 없습니다.`,
      watermark: '미발급',
      tone: 'warn',
    };
  }
  if (s.correction) {
    const why = `수정사유 ${correctionReasonText(inv)} · 당초 승인번호 ${inv.orgNtsConfirmNum?.trim() || '확인 필요'} · 당초 작성일자 ${originIssueDateText(inv)}`;
    if (inv.providerStatus === 'ISSUED') {
      return {
        banner: '수정세금계산서(취소분) 사본 · 참고용',
        note: `원본 금액을 전액 차감하는 음수(-) 수정분입니다. ${why}. ${ntsSentence(inv.ntsStatus)}`,
        watermark: null,
        tone: 'plain',
      };
    }
    if (inv.providerStatus === 'FAILED') {
      return {
        banner: '수정분 발급 실패 · 효력 없음',
        note: `수정세금계산서(취소분) 발급에 실패했습니다. ${why}. 상세 화면에서 상태를 다시 확인하세요.`,
        watermark: '발급 실패',
        tone: 'bad',
      };
    }
    return {
      banner: '수정분 발급 결과 확인 필요 · 참고용',
      note: `수정세금계산서(취소분) 발급 결과가 확정되지 않았습니다. ${why}. 확인되기 전까지 효력이 없습니다.`,
      watermark: '결과 미확정',
      tone: 'warn',
    };
  }
  if (inv.taxCancelStatus === 'CANCELED') {
    return {
      banner: '발행취소 완료 · 효력 없음',
      note: '국세청 전송 전에 발행을 취소한 세금계산서입니다. 세금계산서로서 효력이 없고 발행 · 부가세 집계에서 빠집니다.',
      watermark: '발행취소',
      tone: 'bad',
    };
  }
  if (inv.taxCancelStatus === 'PROCESSING' || inv.taxCancelStatus === 'UNKNOWN') {
    return {
      banner: '취소 결과 확인 필요 · 참고용',
      note: '발행취소 · 수정세금계산서 요청의 결과를 아직 확인하지 못했습니다. 상세 화면에서 상태를 다시 확인한 뒤 출력하세요.',
      watermark: '확인 필요',
      tone: 'warn',
    };
  }
  if (inv.taxCancelStatus === 'CORRECTION_ISSUED') {
    // 원본은 원본이다 — 지워지거나 국세청에서 취소된 것이 아니라, 음수 수정분이 따로 발급돼 함께 신고된다
    return {
      banner: '원본 · 수정세금계산서(취소분) 별도 발급',
      note: `이 종이는 원본의 사본입니다. 작성일자 ${isoDateOf(inv.taxCancelDate) || '확인 필요'}로 전액을 차감하는 수정세금계산서(취소분)가 따로 발급되어 원본과 함께 보관 · 신고됩니다. 원본 ${ntsSentence(inv.ntsStatus)}`,
      watermark: null,
      tone: 'warn',
    };
  }
  if (s.electronic) {
    if (inv.providerCancelStatus === 'CANCELED') {
      return {
        banner: '발급 취소됨 · 효력 없음',
        note: `전자 발급 후 전액 취소한 ${doc}입니다. 취소 거래 국세청 전송: ${ntsLabel(inv.providerCancelNtsStatus)}.`,
        watermark: '취소',
        tone: 'bad',
      };
    }
    if (inv.providerCancelStatus === 'UNKNOWN' || inv.providerCancelStatus === 'PROCESSING') {
      return {
        banner: '취소 결과 확인 필요 · 참고용',
        note: '취소 요청의 결과를 아직 확인하지 못했습니다. 상세 화면에서 상태를 다시 확인한 뒤 출력하세요.',
        watermark: '확인 필요',
        tone: 'warn',
      };
    }
    if (inv.providerStatus === 'ISSUED') {
      // 국세청 전송이 확인되기 전에는 "국세청에 등록됐다 · 홈택스에서 조회된다"고 단정하지 않는다
      return {
        banner: `전자 발급 ${doc} 사본 · 참고용`,
        note: `이 출력물은 확인용 사본입니다. ${ntsSentence(inv.ntsStatus)}`,
        watermark: null,
        tone: 'plain',
      };
    }
    if (inv.providerStatus === 'FAILED') {
      return {
        banner: '발급 실패 · 효력 없음',
        note: `전자 발급에 실패한 문서입니다. ${doc}로서 효력이 없습니다. 상세 화면에서 상태를 다시 확인하세요.`,
        watermark: '발급 실패',
        tone: 'bad',
      };
    }
    return {
      banner: '발급 결과 확인 필요 · 참고용',
      note: `발급 결과가 확정되지 않았습니다. 확인되기 전까지 ${doc}로서 효력이 없습니다.`,
      watermark: '결과 미확정',
      tone: 'warn',
    };
  }
  if (inv.status === 'ISSUED') {
    return {
      banner: '홈택스 발행 기록 · 사본',
      note: `홈택스 등 도배르만 밖에서 발행했다고 기록한 ${doc}의 사본입니다. 이 종이는 국세청 원본이 아닙니다.`,
      watermark: null,
      tone: 'plain',
    };
  }
  if (inv.status === 'CANCELED') {
    return {
      banner: '취소된 문서 · 효력 없음',
      note: `취소로 표시한 기록입니다. ${doc}로서 효력이 없습니다.`,
      watermark: '취소',
      tone: 'bad',
    };
  }
  return {
    banner: '미발급 · 참고용',
    note: `아직 발급하지 않은 작성본입니다. ${doc}로서 효력이 없으며 발급 전 확인용입니다.`,
    watermark: '미발급',
    tone: 'warn',
  };
}

/**
 * 종이에 찍을 승인번호 — 실제로 받은 번호만.
 *   전자 발급 완료(시험 제외) → 대행사가 돌려준 승인번호
 *   수기 기록(홈택스 발행 완료로 표시) → 사장님이 적은 승인번호
 * 시험 발급 번호 · 결과 불명 · 미발급은 null — 화면이 "승인번호 없음"으로 적는다.
 */
export function approvalOf(inv: TaxInvoice): { label: string; value: string } | null {
  const no = inv.approvalNo?.trim();
  if (!no || inv.providerIsTest) return null;
  if (inv.provider != null) {
    if (inv.providerStatus !== 'ISSUED') return null;
    return { label: inv.docType === 'TAX' ? '국세청 승인번호' : '승인번호', value: no };
  }
  if (inv.status === 'ISSUED' || inv.status === 'CANCELED') return { label: '승인번호(홈택스 발행분)', value: no };
  return null;
}

/** 국세청 전송 상태 문장 — 전송 완료일 때만 홈택스 조회를 말한다 */
export function ntsSentence(nts: TaxInvoiceNtsStatus | null | undefined): string {
  if (nts === 'SENT') return '국세청 전송 완료 — 홈택스에서 조회할 수 있습니다.';
  if (nts === 'FAILED') return '국세청 전송 실패 — 상세 화면에서 상태를 다시 확인하세요.';
  if (nts === 'PENDING') return '국세청 전송 대기 — 전송이 끝나야 홈택스에서 조회됩니다.';
  return '국세청 전송 상태 미확인 — 상세 화면에서 상태를 다시 확인하세요.';
}

/** 국세청 전송 상태 칸 글자 */
export function ntsLabel(nts: TaxInvoiceNtsStatus | null | undefined): string {
  return nts ? NTS_STATUS_LABEL[nts] : '확인 전';
}

/** 승인번호 칸 글자 — 번호가 없으면 왜 없는지 */
export function approvalText(inv: TaxInvoice): string {
  const a = approvalOf(inv);
  if (a) return a.value;
  if (inv.providerIsTest) return '시험 발급 · 번호 표시 안 함';
  if (inv.provider != null) return inv.providerStatus === 'ISSUED' ? '승인번호 미수신 · 상태 확인 필요' : '확정 전';
  if (inv.status === 'ISSUED') return '미입력';
  return '발급 전';
}

/**
 * 한국시간(Asia/Seoul) 오늘 yyyy-MM-dd — 서버(KST)와 같은 날짜를 쓴다.
 * 브라우저 시간대가 달라도(해외 · 자정 전후) 새 문서 기본 날짜와 현금영수증 발급 가능 날짜가 서버와 어긋나지 않게.
 */
export function kstToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** 현금영수증 실제 발급은 거래일자가 한국시간 오늘인 문서만 된다(과거 날짜를 대행사가 오늘로 바꿔 발급하지 않게) */
export function cashIssuableToday(inv: Pick<TaxInvoice, 'issueDate'>, today = kstToday()): boolean {
  return isoDateOf(inv.issueDate) === today;
}

const CASH_ITEM_NAME_MAX = 70;

/**
 * 현금영수증 품목명 — 서버가 팝빌로 보내는 70자 요약(cashItemName)을 그대로 쓴다.
 * 없으면(예전 서버 · 미저장) 첫 품목 + "외 N건"으로 만들고 70자로 자른다. 서버 값이 아니면 estimated=true.
 */
export function cashItemNameOf(inv: TaxInvoice): { name: string; estimated: boolean } {
  const server = inv.cashItemName?.trim();
  if (server) return { name: server, estimated: false };
  const items = (inv.items ?? []).filter(hasContent);
  const first = items.find((it) => (it.name ?? '').trim())?.name?.trim();
  const base = first ? (items.length > 1 ? `${first} 외 ${items.length - 1}건` : first) : inv.itemSummary?.trim() || '현금영수증';
  const chars = Array.from(base);
  return { name: chars.length > CASH_ITEM_NAME_MAX ? chars.slice(0, CASH_ITEM_NAME_MAX).join('') : base, estimated: true };
}

/** yyyyMMdd · yyyy-MM-dd → yyyy-MM-dd. 못 읽으면 원문 */
export function isoDateOf(v: string | null | undefined): string {
  if (!v) return '';
  const d = v.replace(/\D/g, '');
  if (d.length >= 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return v;
}

/** 현금영수증 거래일자 — 승인된 거래는 대행사 거래일자, 아니면 작성일자 */
export function tradeDateOf(inv: TaxInvoice): string {
  return isoDateOf(inv.providerTradeDate) || isoDateOf(inv.issueDate);
}

/** 영수증 거래일자 칸 — 아직 승인 전이면 작성일 기준임을 밝힌다 */
export function tradeDateText(inv: TaxInvoice): string {
  const traded = isoDateOf(inv.providerTradeDate);
  if (traded) return traded;
  const issue = isoDateOf(inv.issueDate);
  return issue ? `${issue} (작성일 기준 · 발급 시 확정)` : '미정';
}

export interface PaperItem {
  month: string;
  day: string;
  name: string;
  spec: string;
  qty: number | null;
  unitPrice: number | null;
  supply: number;
  vat: number;
  /** 공급가액 + 세액 — 현금영수증 품목 금액 */
  total: number;
}

function hasContent(it: TaxInvoiceItem) {
  return Boolean((it.name ?? '').trim() || (it.spec ?? '').trim() || (it.supplyAmount ?? 0) !== 0 || (it.vatAmount ?? 0) !== 0);
}

/** 서식 품목 — 빈 행은 버린다. 품목이 없던 예전 기록은 품목 요약 한 줄 + 문서 금액으로 */
export function paperItems(inv: TaxInvoice): PaperItem[] {
  const list = (inv.items ?? []).filter(hasContent);
  if (list.length === 0) {
    const [, m = '', d = ''] = isoDateOf(inv.issueDate).split('-');
    return [
      {
        month: m,
        day: d,
        name: inv.itemSummary?.trim() || DOC_TYPE_LABEL[inv.docType],
        spec: '',
        qty: null,
        unitPrice: null,
        supply: inv.supplyAmount,
        vat: inv.vatAmount,
        total: inv.supplyAmount + inv.vatAmount,
      },
    ];
  }
  return list.map((it) => {
    const [, m = '', d = ''] = isoDateOf(it.date).split('-');
    const supply = it.supplyAmount ?? 0;
    const vat = it.vatAmount ?? 0;
    return {
      month: m,
      day: d,
      name: (it.name ?? '').trim(),
      spec: (it.spec ?? '').trim(),
      qty: it.qty ?? null,
      unitPrice: it.unitPrice ?? null,
      supply,
      vat,
      total: supply + vat,
    };
  });
}

/** 품목 합계와 문서 금액이 다르면 알린다(예전 기록 · 수기 수정). 종이에는 문서 금액이 찍힌다 */
export function amountMismatch(inv: TaxInvoice): string | null {
  const items = (inv.items ?? []).filter(hasContent);
  if (items.length === 0) return null;
  const supply = items.reduce((a, it) => a + (it.supplyAmount ?? 0), 0);
  const vat = items.reduce((a, it) => a + (it.vatAmount ?? 0), 0);
  const problems: string[] = [];
  if (supply !== inv.supplyAmount) problems.push(`공급가액(품목 ${fmtWon(supply)} · 문서 ${fmtWon(inv.supplyAmount)})`);
  if (vat !== inv.vatAmount) problems.push(`세액(품목 ${fmtWon(vat)} · 문서 ${fmtWon(inv.vatAmount)})`);
  if (inv.totalAmount !== inv.supplyAmount + inv.vatAmount) problems.push(`합계(문서 ${fmtWon(inv.totalAmount)})`);
  return problems.length ? `품목 합계와 문서 금액이 다릅니다: ${problems.join(', ')}. 수정 화면에서 품목을 확인하세요.` : null;
}

/**
 * 현금영수증 과세 구분 — 저장된 cashTaxationType 만 쓴다(세액 0 으로 추정하지 않는다:
 * 1원 과세 거래는 10% 반올림 세액이 0원이다). 예전 기록(null)은 "미지정 · 확인 필요".
 */
export function cashTaxationOf(inv: TaxInvoice): string {
  return inv.cashTaxationType ? CASH_TAXATION_LABEL[inv.cashTaxationType] : '미지정 · 확인 필요';
}

export const fmtWon = (n?: number | null) => `${(n ?? 0).toLocaleString('ko-KR')}원`;
export const fmtNum = (n?: number | null) => (n == null ? '' : n.toLocaleString('ko-KR'));

/** 현금영수증 고객 식별 — 종이에는 가린 번호, 종류 이름 함께 */
export function cashIdentityLine(inv: TaxInvoice): { usage: string; kind: string; masked: string; inferred: boolean } {
  const c = cashFieldsOf(inv);
  return {
    usage: CASH_USAGE_LONG_LABEL[c.usage],
    kind: CASH_IDENTITY_LABEL[c.identityType],
    masked: maskCashIdentity(c.identityType, c.identityNum) || '미입력',
    inferred: c.inferred,
  };
}

/** 내려받기 파일 이름 — 세금계산서_상호_2026-10-15, 수정분은 수정세금계산서_취소분_상호_날짜 */
export function documentFileName(inv: TaxInvoice, id: string | number): string {
  const who = inv.docType === 'CASH' ? cashIdentityLine(inv).masked.replace(/\*/g, 'x') : inv.buyerName || String(id);
  const date = (inv.docType === 'CASH' ? tradeDateOf(inv) : isoDateOf(inv.issueDate)) || new Date().toISOString().slice(0, 10);
  const kind = inv.correctionOfInvoiceId != null ? '수정세금계산서_취소분' : DOC_TYPE_LABEL[inv.docType];
  return `${kind}_${who}_${date}`;
}

/** 공유 · 문자 요약 — 상태(미발급 · 시험 등)를 앞에 붙여 효력 없는 문서가 원본처럼 보이지 않게 */
export function documentShareText(inv: TaxInvoice, supplierName: string | null | undefined): string {
  const state = paperState(inv);
  const head = `[${supplierName || '도배르만'}]`;
  const status = state.tone === 'plain' ? '' : `(${state.banner}) `;
  const amounts = `공급가액 ${fmtWon(inv.supplyAmount)} · 세액 ${fmtWon(inv.vatAmount)} · 합계 ${fmtWon(inv.totalAmount)}`;
  if (inv.docType === 'CASH') {
    const id = cashIdentityLine(inv);
    return `${head} ${status}현금영수증(${id.usage} · ${id.masked}) ${amounts}${tradeDateOf(inv) ? ` (${tradeDateOf(inv)})` : ''}`;
  }
  const date = inv.issueDate ? ` (${isoDateOf(inv.issueDate)})` : '';
  if (inv.correctionOfInvoiceId != null) {
    const org = inv.orgNtsConfirmNum?.trim() ? ` · 당초 승인번호 ${inv.orgNtsConfirmNum.trim()}` : '';
    return `${head} ${status}${inv.buyerName || ''} 수정세금계산서(취소분) ${amounts}${date} · 수정사유 ${correctionReasonText(inv)}${org}`;
  }
  return `${head} ${status}${inv.buyerName || ''} 세금계산서 ${amounts}${date}`;
}

export function docTitle(docType: TaxInvoiceDocType, inv: TaxInvoice): string {
  if (docType === 'CASH') return '현금영수증';
  const electronic = inv.provider != null && inv.providerStatus === 'ISSUED' && !inv.providerIsTest;
  if (inv.correctionOfInvoiceId != null) return electronic ? '수정전자세금계산서' : '수정세금계산서';
  return electronic ? '전자세금계산서' : '세금계산서';
}
