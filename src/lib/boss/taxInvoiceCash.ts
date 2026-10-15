// 현금영수증 용도 · 식별번호 — 입력 검증 · 표기 · 마스킹 (화면과 분리한 순수 함수)
//
// 계약(.task/billing-upgrade-contract.md)
//   용도: DEDUCTION(개인 소득공제, 기본) · EXPENSE(사업자 지출증빙)
//   식별: PHONE(기본, 국내 휴대폰 10~11자리) · BIZNO(체크섬 맞는 사업자번호 10자리) · SELF(자진발급 0100001234, 소득공제 전용)
//   주민등록번호 · 카드번호는 받지 않는다. 최종 판정은 서버가 한다.
// 소득공제는 개인이 받는 것이라 휴대폰 · 자진발급만, 지출증빙은 사업자번호 · 휴대폰만 고를 수 있게 한다.

import { bizNoDigits, isValidBizNo } from './bizno';
import {
  CASH_IDENTITY_LABEL,
  CASH_SELF_ISSUE_NUMBER,
  type CashIdentityType,
  type CashTaxationType,
  type CashUsage,
  type TaxInvoice,
} from '@/types/boss-taxinvoice';

export const CASH_IDENTITY_TYPES_BY_USAGE: Record<CashUsage, CashIdentityType[]> = {
  DEDUCTION: ['PHONE', 'SELF'],
  EXPENSE: ['BIZNO', 'PHONE'],
};

export function cashDigits(input: string | null | undefined): string {
  return (input ?? '').replace(/\D/g, '');
}

/** 국내 휴대폰 — 010 · 011 · 016 · 017 · 018 · 019, 10~11자리 */
export function isMobilePhoneDigits(d: string): boolean {
  return /^01[016789]\d{7,8}$/.test(d);
}

/** 용도를 바꿀 때 식별 종류 — 지금 고른 종류가 새 용도에서도 되면 그대로, 아니면 그 용도의 기본값 */
export function identityTypeForUsage(usage: CashUsage, current: CashIdentityType): CashIdentityType {
  return CASH_IDENTITY_TYPES_BY_USAGE[usage].includes(current) ? current : CASH_IDENTITY_TYPES_BY_USAGE[usage][0];
}

/** 보낼 값 — 숫자만. 자진발급은 고정 번호 */
export function normalizeCashIdentity(type: CashIdentityType, input: string | null | undefined): string {
  return type === 'SELF' ? CASH_SELF_ISSUE_NUMBER : cashDigits(input);
}

/** 입력 오류 문구. 문제없으면 null */
export function cashIdentityError(usage: CashUsage, type: CashIdentityType, input: string | null | undefined): string | null {
  if (!CASH_IDENTITY_TYPES_BY_USAGE[usage].includes(type)) {
    return type === 'SELF'
      ? '자진발급은 개인 소득공제용에서만 쓸 수 있습니다.'
      : `${usage === 'DEDUCTION' ? '소득공제용' : '지출증빙용'}에는 ${CASH_IDENTITY_LABEL[type]}를 쓸 수 없습니다.`;
  }
  if (type === 'SELF') return null;
  const d = cashDigits(input);
  // 자진발급 번호는 휴대폰 형식(010-000-1234)이라 휴대폰으로 적어도 국세청에는 자진발급으로 들어간다.
  // 지출증빙에는 어떤 종류로도 쓸 수 없고, 소득공제에서는 '자진발급'을 고르게 한다.
  if (d === CASH_SELF_ISSUE_NUMBER) {
    return usage === 'EXPENSE'
      ? '010-000-1234는 자진발급 번호라 지출증빙용에 쓸 수 없습니다. 고객의 사업자번호나 휴대폰번호를 입력하세요.'
      : '010-000-1234는 자진발급 번호입니다. 식별 방법에서 자진발급을 고르세요.';
  }
  if (!d) return type === 'PHONE' ? '고객 휴대폰번호를 입력하세요.' : '고객 사업자등록번호를 입력하세요.';
  if (type === 'PHONE') {
    return isMobilePhoneDigits(d) ? null : '01로 시작하는 국내 휴대폰번호 10~11자리를 입력하세요. 예: 010-1234-5678';
  }
  if (d.length !== 10) return '사업자등록번호 10자리를 입력하세요.';
  return isValidBizNo(d) ? null : '검증번호가 맞지 않습니다. 사업자등록증의 번호를 다시 확인하세요.';
}

/** 입력 중 하이픈 — 휴대폰 010-1234-5678 · 사업자 000-00-00000 */
export function maskCashIdentityInput(type: CashIdentityType, input: string): string {
  const d = cashDigits(input);
  if (type === 'BIZNO') {
    const b = d.slice(0, 10);
    if (b.length <= 3) return b;
    if (b.length <= 5) return `${b.slice(0, 3)}-${b.slice(3)}`;
    return `${b.slice(0, 3)}-${b.slice(3, 5)}-${b.slice(5)}`;
  }
  const p = d.slice(0, 11);
  if (p.length <= 3) return p;
  if (p.length <= 7) return `${p.slice(0, 3)}-${p.slice(3)}`;
  if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
  return `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}`;
}

/** 사장님 화면(상세 · 입력 확인)용 전체 표기 */
export function formatCashIdentity(type: CashIdentityType | null | undefined, num: string | null | undefined): string {
  if (type === 'SELF') return '010-000-1234 (자진발급)';
  const d = cashDigits(num);
  if (!d) return '';
  if (type === 'BIZNO' && d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
}

/**
 * 종이 · 공유용 가림 표기 — 영수증에는 끝 몇 자리만 남긴다.
 *   휴대폰 010-****-5678 · 사업자 123-45-***90 · 자진발급 010-000-1234(국세청 공용 번호라 가리지 않는다)
 */
export function maskCashIdentity(type: CashIdentityType | null | undefined, num: string | null | undefined): string {
  if (type === 'SELF') return '010-000-1234';
  const d = cashDigits(num);
  if (!d) return '';
  if (type === 'BIZNO' && d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 5)}-***${d.slice(8)}`;
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  if (d.length <= 4) return '*'.repeat(d.length);
  return `${'*'.repeat(d.length - 4)}${d.slice(-4)}`;
}

export interface CashFields {
  usage: CashUsage;
  identityType: CashIdentityType;
  identityNum: string;
  /** 저장된 과세 구분. null 은 예전 기록(확인 필요) */
  taxation: CashTaxationType | null;
  /** 예전 기록이라 용도 · 식별번호 · 과세 구분 중 하나 이상을 추정했다 — 사장님 확인이 필요하다 */
  inferred: boolean;
}

/** 과세 구분 기준 세액 — 비과세는 0, 과세는 공급가액의 10% 반올림(소액이면 0원일 수 있다) */
export function cashVatOf(supply: number, taxation: CashTaxationType): number {
  return taxation === 'NON_TAXABLE' ? 0 : Math.round(supply / 10);
}

/** 세액이 공급가액의 10% 원 단위(버림 또는 반올림)인가 — 서버 validVat 와 같은 규칙 */
export function isValidVat(supply: number, vat: number): boolean {
  return vat === Math.floor(supply / 10) || vat === Math.round(supply / 10);
}

/**
 * 부가세 포함 금액(합계)을 공급가액 · 세액으로 나눈다(2026-10-16).
 * 합계는 그대로 두고 세액은 10% 원 단위 규칙에 맞춘다. 반올림에 맞는 값을 먼저, 없으면 버림으로 고른다.
 * 예: 50,000 → 45,455 + 4,545 (반올림으로는 49,999 나 50,001 만 나온다)
 */
export function splitVatInclusive(total: number): { supply: number; vat: number } {
  const base = Math.round((total * 10) / 11);
  const offsets = [0, -1, 1, -2, 2];
  for (const preferRound of [true, false]) {
    for (const o of offsets) {
      const supply = base + o;
      const vat = total - supply;
      if (supply < 0 || vat < 0) continue;
      if (vat === (preferRound ? Math.round(supply / 10) : Math.floor(supply / 10))) return { supply, vat };
    }
  }
  return { supply: base, vat: total - base };
}

/** 품목 세액이 과세 구분과 맞지 않는 첫 품목 번호(1부터). 모두 맞으면 null */
export function cashVatMismatch(
  items: Pick<TaxInvoice['items'][number], 'supplyAmount' | 'vatAmount'>[],
  taxation: CashTaxationType,
): number | null {
  // 과세는 서버와 같이 버림 · 반올림 둘 다 받는다 — 부가세 포함 견적을 나눈 45,455 + 4,545 같은 값
  const i = items.findIndex((it) =>
    taxation === 'NON_TAXABLE'
      ? (it.vatAmount ?? 0) !== 0
      : !isValidVat(it.supplyAmount ?? 0, it.vatAmount ?? 0),
  );
  return i < 0 ? null : i + 1;
}

/** 예전 기록 수정용 추정 — 금액 품목의 세액이 모두 0 이면 비과세. 화면이 반드시 확인을 받는다 */
export function guessCashTaxation(items: Pick<TaxInvoice['items'][number], 'supplyAmount' | 'vatAmount'>[]): CashTaxationType {
  const priced = items.filter((it) => (it.supplyAmount ?? 0) > 0);
  return priced.length > 0 && priced.every((it) => (it.vatAmount ?? 0) === 0) ? 'NON_TAXABLE' : 'TAXABLE';
}

/**
 * 저장된 문서의 현금영수증 값. 새 필드가 없는 예전 기록은 사업자번호 → 지출증빙, 휴대폰 → 소득공제로 추정한다.
 * 추정한 값은 inferred=true 로 알려 화면이 확인을 받게 한다(서버에 몰래 저장하지 않는다).
 */
export function cashFieldsOf(
  inv: Pick<TaxInvoice, 'cashUsage' | 'cashIdentityType' | 'cashIdentityNum' | 'cashTaxationType' | 'buyerBizNo' | 'buyerPhone'>,
): CashFields {
  const taxation = inv.cashTaxationType ?? null;
  if (inv.cashUsage && inv.cashIdentityType) {
    return {
      usage: inv.cashUsage,
      identityType: inv.cashIdentityType,
      identityNum: inv.cashIdentityType === 'SELF' ? CASH_SELF_ISSUE_NUMBER : cashDigits(inv.cashIdentityNum),
      taxation,
      inferred: taxation == null,
    };
  }
  const biz = bizNoDigits(inv.buyerBizNo);
  if (biz) return { usage: 'EXPENSE', identityType: 'BIZNO', identityNum: biz, taxation, inferred: true };
  const phone = cashDigits(inv.buyerPhone);
  if (phone === CASH_SELF_ISSUE_NUMBER) {
    return { usage: 'DEDUCTION', identityType: 'SELF', identityNum: CASH_SELF_ISSUE_NUMBER, taxation, inferred: true };
  }
  return { usage: 'DEDUCTION', identityType: 'PHONE', identityNum: phone, taxation, inferred: true };
}
