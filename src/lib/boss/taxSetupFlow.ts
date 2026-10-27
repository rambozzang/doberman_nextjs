// 전자 발급 시작하기 — 한 화면에 한 가지만 묻는 단계별 절차 (2026-10-25) · 앱 tax_setup_flow.dart 와 같은 규칙
//
// 사장님 요청: "토스 · 카카오처럼 묻지도 따지지도 않고 화면이 시키는 대로만 하면 끝나게. 지금은 한 화면에 정보가 너무 많다."
// 서버 등록 단계(stage)가 '어디까지 왔는지'를 정하고, 사업자 정보 · 팝빌 계정은 화면 안에서 한 칸씩 나눠 묻는다.
// 중간에 나갔다 와도 서버 단계로 하던 곳부터 이어진다. 검사 규칙은 등록 화면과 같은 함수(taxInvoiceRegistration)를 쓴다.
// 회사 정보가 없는 사장님도 회사 등록 화면으로 보내지 않는다 — 같은 사업자 정보 칸으로 회사를 만들고 이어서 신청한다.

import {
  effectiveStage,
  validateLinkCredentials,
  validateSupplier,
  type LinkCredentials,
  type LinkErrors,
  type SupplierErrors,
  type SupplierField,
} from './taxInvoiceRegistration';
import { bizNoDigits } from './bizno';
import type { ElectronicRegistrationStatus, TaxInvoiceSupplier } from '@/types/boss-taxinvoice';

/** 무엇을 발급할지 — 현금영수증만이면 공동인증서 단계를 건너뛴다 */
export type SetupChoice = 'BOTH' | 'CASH';

export type SetupStep =
  | 'intro'
  | 'choose'
  | 'bizno'
  | 'names'
  | 'address'
  | 'business'
  | 'contact'
  | 'confirm'
  | 'pending'
  | 'linkId'
  | 'linkPassword'
  | 'linkConfirm'
  | 'linkUnknown'
  | 'notConfigured'
  | 'certificate'
  | 'doneTax'
  | 'doneCash';

/** 사업자 정보를 나눠 묻는 순서와 각 화면의 칸 */
export const SUPPLIER_STEPS: { step: SetupStep; fields: SupplierField[] }[] = [
  { step: 'bizno', fields: ['bizNo'] },
  { step: 'names', fields: ['name', 'ceo'] },
  { step: 'address', fields: ['address'] },
  { step: 'business', fields: ['bizType', 'bizKind'] },
  { step: 'contact', fields: ['email', 'phone'] },
];

export const LINK_STEPS: SetupStep[] = ['linkId', 'linkPassword', 'linkConfirm'];

/**
 * 서버 단계로 정한 "지금 할 곳".
 * choice 가 없으면(처음) 회사 · 신청 전에는 소개 · 고르기부터. cashReady = 현금영수증 준비 완료(서버 config CASH ready)
 */
export function anchorStep(
  status: Pick<ElectronicRegistrationStatus, 'stage' | 'reviewStatus' | 'serviceConfigured' | 'memberLinked'>,
  choice: SetupChoice | null,
  cashReady: boolean,
): SetupStep {
  const stage = effectiveStage(status);
  const fresh = !choice && (stage === 'NEED_COMPANY' || stage === 'NOT_REGISTERED');
  if (fresh) return 'intro';
  switch (stage) {
    case 'NEED_COMPANY':
    case 'NOT_REGISTERED':
    case 'REJECTED':
      return 'bizno';
    case 'PENDING_VERIFICATION':
      return 'pending';
    case 'VERIFIED':
      if (!status.serviceConfigured) return 'notConfigured';
      if (status.memberLinked === false) return 'linkId';
      if (status.memberLinked == null) return 'linkUnknown';
      // 가입은 됐는데 연동 설정에 문제가 있어 확인 단계에 머문 경우
      return 'notConfigured';
    case 'NEEDS_CERTIFICATE':
      return choice === 'CASH' && cashReady ? 'doneCash' : 'certificate';
    case 'READY':
      return 'doneTax';
  }
}

/** 화면 안에서 '다음'을 누르면 갈 곳 — 서버를 부르는 단계(신청 · 가입)는 null(화면이 서버 결과로 정한다) */
export function nextStep(step: SetupStep): SetupStep | null {
  switch (step) {
    case 'intro':
      return 'choose';
    case 'choose':
      return 'bizno';
    case 'bizno':
      return 'names';
    case 'names':
      return 'address';
    case 'address':
      return 'business';
    case 'business':
      return 'contact';
    case 'contact':
      return 'confirm';
    case 'linkId':
      return 'linkPassword';
    case 'linkPassword':
      return 'linkConfirm';
    default:
      return null;
  }
}

/** 큰 단계 표시(1~6) — 위쪽 진행 막대 */
export const STAGE_NAMES = ['시작', '사업자 정보', '확인 기다리기', '팝빌 계정', '공동인증서', '완료'] as const;

export function stageIndex(step: SetupStep): number {
  switch (step) {
    case 'intro':
    case 'choose':
      return 0;
    case 'bizno':
    case 'names':
    case 'address':
    case 'business':
    case 'contact':
    case 'confirm':
      return 1;
    case 'pending':
      return 2;
    case 'linkId':
    case 'linkPassword':
    case 'linkConfirm':
    case 'linkUnknown':
    case 'notConfigured':
      return 3;
    case 'certificate':
      return 4;
    case 'doneTax':
    case 'doneCash':
      return 5;
  }
}

/** 이 화면의 칸만 검사한다 — 다음으로 넘어가기 전에 */
export function supplierStepErrors(step: SetupStep, supplier: TaxInvoiceSupplier): SupplierErrors {
  const all = validateSupplier(supplier);
  const fields = step === 'confirm' ? SUPPLIER_STEPS.flatMap((s) => s.fields) : SUPPLIER_STEPS.find((s) => s.step === step)?.fields ?? [];
  const out: SupplierErrors = {};
  for (const f of fields) if (all[f]) out[f] = all[f];
  return out;
}

/** 팝빌 아이디 · 비밀번호 화면별 검사 */
export function linkStepErrors(step: SetupStep, c: LinkCredentials): LinkErrors {
  const all = validateLinkCredentials(c);
  if (step === 'linkId') return all.memberId ? { memberId: all.memberId } : {};
  if (step === 'linkPassword') {
    const out: LinkErrors = {};
    if (all.password) out.password = all.password;
    if (all.passwordConfirm) out.passwordConfirm = all.passwordConfirm;
    return out;
  }
  return all;
}

/** 팝빌 아이디 추천 — "dbm" + 사업자번호 숫자(영문 · 숫자 13자). 사장님이 고칠 수 있다 */
export function suggestMemberId(bizNo: string | null | undefined): string {
  const d = bizNoDigits(bizNo ?? '');
  return d.length === 10 ? `dbm${d}` : '';
}

/** 비밀번호 조건 — 화면에서 하나씩 초록 체크로 보인다 */
export function passwordChecks(pw: string): { label: string; ok: boolean }[] {
  return [
    { label: '8~20자', ok: pw.length >= 8 && pw.length <= 20 },
    { label: '영문', ok: /[A-Za-z]/.test(pw) },
    { label: '숫자', ok: /\d/.test(pw) },
    { label: '특수문자 ~!@#$%^&*()_+ 중 하나', ok: /[~!@#$%^&*()_+]/.test(pw) },
    { label: '쓸 수 없는 글자 없음', ok: pw.length === 0 || /^[A-Za-z0-9~!@#$%^&*()_+]*$/.test(pw) },
  ];
}

/** 업태 · 종목 보기 — 누르면 칸이 채워진다. 사업자등록증에 적힌 대로가 가장 좋다 */
export const BIZ_TYPE_CHOICES = ['건설업', '서비스업', '도매 및 소매업'];
export const BIZ_KIND_CHOICES = ['도배공사', '실내건축공사', '인테리어', '도배 · 장판'];

/** 무엇을 고를지 기억 — 계정마다 따로(공용 PC) */
export const choiceKey = (userId: string | null | undefined) => `taxSetupChoice:${userId ?? ''}`;

export function readChoice(userId: string | null | undefined): SetupChoice | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const v = window.localStorage.getItem(choiceKey(userId));
    return v === 'BOTH' || v === 'CASH' ? v : null;
  } catch {
    return null;
  }
}

export function saveChoice(userId: string | null | undefined, choice: SetupChoice): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(choiceKey(userId), choice);
  } catch {
    // 저장이 막혀도(사생활 보호 모드) 이번 화면에서는 그대로 진행된다
  }
}

// ── 세금계산서 첫 화면 맨 위에 무엇을 보일지 (2026-10-27) · 앱 tax_setup_flow.dart taxHomePhase 와 같은 규칙 ──
// 사장님 요청: "승인 나면 승인 관련 내용은 모두 없애고 바로 쓰기 편하게." 준비 중에는 할 일 한 가지만, 끝나면 아무것도 없다.
export type TaxHomePhase =
  | 'unknown'
  | 'start'
  | 'rejected'
  | 'pending'
  | 'preparing'
  | 'continueLink'
  | 'continueCert'
  | 'readyCash'
  | 'ready';

export function taxHomePhase(
  s: Pick<ElectronicRegistrationStatus, 'stage' | 'reviewStatus' | 'serviceConfigured' | 'memberLinked'> | null,
  cashReady: boolean,
): TaxHomePhase {
  if (!s) return 'unknown';
  switch (effectiveStage(s)) {
    case 'NEED_COMPANY':
    case 'NOT_REGISTERED':
      return 'start';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING_VERIFICATION':
      return 'pending';
    case 'VERIFIED':
      return s.serviceConfigured && s.memberLinked === false ? 'continueLink' : 'preparing';
    case 'NEEDS_CERTIFICATE':
      return cashReady ? 'readyCash' : 'continueCert';
    case 'READY':
      return 'ready';
  }
}
