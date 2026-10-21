// 전자세금계산서 발급 서비스 등록 — 입력 검증 · 단계 계산 (화면과 분리한 순수 함수)
//
// 서버(TaxInvoiceRegistrationSvc)와 같은 규칙으로 미리 막아, 보낸 뒤에야 거절당하지 않게 한다. 최종 판정은 서버가 한다.
//   사업자: 사업자번호 체크섬 · 필수 항목 · 이메일 형식 · 연락처 숫자 9~15자리
//   팝빌 아이디: 영문 · 숫자 · _ · - 6~50자
//   팝빌 비밀번호: 영문 · 숫자 · 특수문자(~!@#$%^&*()_+) 세 가지를 모두 넣어 8~20자

import { bizNoDigits, isValidBizNo, maskBizNo } from './bizno';
import type { BossCompanyData } from '@/types/boss';
import type { ElectronicRegistrationStatus, RegistrationStage, TaxInvoiceSupplier } from '@/types/boss-taxinvoice';

export type SupplierField = keyof TaxInvoiceSupplier;
export type SupplierErrors = Partial<Record<SupplierField, string>>;

/** 화면 순서 */
export const SUPPLIER_FIELDS: SupplierField[] = ['bizNo', 'name', 'ceo', 'phone', 'address', 'bizType', 'bizKind', 'email'];

export const SUPPLIER_LABEL: Record<SupplierField, string> = {
  bizNo: '사업자등록번호',
  name: '상호',
  ceo: '대표자',
  address: '사업장 주소',
  bizType: '업태',
  bizKind: '종목',
  email: '담당자 이메일',
  phone: '담당자 연락처',
};

/** 서버 검증 길이와 같다 (사업자번호는 하이픈 포함 표기 길이) */
export const SUPPLIER_MAX: Record<SupplierField, number> = {
  bizNo: 12,
  name: 200,
  ceo: 100,
  address: 300,
  bizType: 100,
  bizKind: 100,
  email: 100,
  phone: 20,
};

const REQUIRED_MESSAGE: Record<SupplierField, string> = {
  bizNo: '사업자등록번호를 입력하세요.',
  name: '상호를 입력하세요.',
  ceo: '대표자 이름을 입력하세요.',
  address: '사업장 주소를 입력하세요.',
  bizType: '업태를 입력하세요.',
  bizKind: '종목을 입력하세요.',
  email: '담당자 이메일을 입력하세요.',
  phone: '담당자 연락처를 입력하세요.',
};

export const EMPTY_SUPPLIER: TaxInvoiceSupplier = {
  bizNo: '',
  name: '',
  ceo: '',
  address: '',
  bizType: '',
  bizKind: '',
  email: '',
  phone: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 보내기 직전 모양 — 앞뒤 공백 제거, 사업자번호는 숫자만, 연락처는 공백 제거(하이픈은 서버가 지운다) */
export function normalizeSupplier(s: TaxInvoiceSupplier): TaxInvoiceSupplier {
  return {
    bizNo: bizNoDigits(s.bizNo),
    name: s.name.trim(),
    ceo: s.ceo.trim(),
    address: s.address.trim(),
    bizType: s.bizType.trim(),
    bizKind: s.bizKind.trim(),
    email: s.email.trim(),
    phone: s.phone.replace(/\s/g, ''),
  };
}

/**
 * 연락처 보이는 모양 — 010-1234-5678 · 02-123-4567 · 031-123-4567 · 1588-1234(2026-10-21 — 등록 화면에 01024687272 로 보였다).
 * 숫자 자릿수가 맞지 않으면 받은 그대로 둔다(지어내지 않는다). 하이픈은 서버가 지우므로 그대로 보내도 된다.
 */
export function formatSupplierPhone(v: string | null | undefined): string {
  const raw = (v ?? '').trim();
  const d = raw.replace(/\D/g, '');
  if (d !== raw.replace(/[\s-]/g, '')) return raw;
  if (d.startsWith('02')) {
    if (d.length === 9) return `02-${d.slice(2, 5)}-${d.slice(5)}`;
    if (d.length === 10) return `02-${d.slice(2, 6)}-${d.slice(6)}`;
    return raw;
  }
  if (d.length === 8 && /^1[5-9]/.test(d)) return `${d.slice(0, 4)}-${d.slice(4)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  return raw;
}

/** 입력칸에 넣을 모양 — 사업자번호는 000-00-00000, 연락처는 하이픈을 넣는다 */
export function supplierFormValue(s: TaxInvoiceSupplier | null | undefined): TaxInvoiceSupplier {
  if (!s) return { ...EMPTY_SUPPLIER };
  return {
    bizNo: maskBizNo(s.bizNo ?? ''),
    name: s.name ?? '',
    ceo: s.ceo ?? '',
    address: s.address ?? '',
    bizType: s.bizType ?? '',
    bizKind: s.bizKind ?? '',
    email: s.email ?? '',
    phone: formatSupplierPhone(s.phone),
  };
}

/** 내 회사 정보(/company)로 신청서를 미리 채운다 */
export function supplierFromCompany(c: BossCompanyData): TaxInvoiceSupplier {
  return {
    bizNo: bizNoDigits(c.bizno),
    name: c.name ?? '',
    ceo: c.owner ?? '',
    address: [c.address1, c.address2].map((v) => v?.trim()).filter(Boolean).join(' '),
    bizType: c.type ?? '',
    bizKind: c.kind ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
  };
}

/** 서버가 저장한 신청 내용이 이번에 보낸 내용과 같은가 — 응답을 못 받은 신청이 실제로 저장됐는지 가늠할 때 쓴다 */
export function sameSupplier(a: TaxInvoiceSupplier, b: TaxInvoiceSupplier): boolean {
  const x = normalizeSupplier(a);
  const y = normalizeSupplier(b);
  // 연락처 하이픈은 서버가 지운다 — 보이는 모양(010-1234-5678)과 저장값(01012345678)을 같게 본다
  return SUPPLIER_FIELDS.every((f) => (f === 'phone' ? x[f].replace(/-/g, '') === y[f].replace(/-/g, '') : x[f] === y[f]));
}

export function validateSupplier(input: TaxInvoiceSupplier): SupplierErrors {
  const s = normalizeSupplier(input);
  const errors: SupplierErrors = {};

  for (const f of SUPPLIER_FIELDS) {
    if (!s[f]) errors[f] = REQUIRED_MESSAGE[f];
    else if (s[f].length > SUPPLIER_MAX[f]) errors[f] = `${SUPPLIER_MAX[f]}자 이하로 줄여 주세요.`;
  }
  if (!errors.bizNo && !isValidBizNo(s.bizNo)) {
    errors.bizNo = '검증번호가 맞지 않습니다. 사업자등록증의 10자리 번호를 다시 확인하세요.';
  }
  if (!errors.email && !EMAIL_RE.test(s.email)) {
    errors.email = '이메일 형식이 아닙니다. 예: tax@example.com';
  }
  if (!errors.phone && !/^\d{9,15}$/.test(s.phone.replace(/-/g, ''))) {
    errors.phone = '숫자 9~15자리로 입력하세요. 하이픈(-)은 넣어도 됩니다.';
  }
  return errors;
}

// ── 팝빌 연동 회원 가입 ──
export interface LinkCredentials {
  memberId: string;
  password: string;
  passwordConfirm: string;
}
export type LinkErrors = Partial<Record<keyof LinkCredentials, string>>;

const MEMBER_ID_RE = /^[A-Za-z0-9_-]{6,50}$/;
const PASSWORD_RE = /^[A-Za-z0-9~!@#$%^&*()_+]{8,20}$/;
const PASSWORD_SPECIAL_RE = /[~!@#$%^&*()_+]/;

export function validateLinkCredentials(c: LinkCredentials): LinkErrors {
  const errors: LinkErrors = {};
  if (!c.memberId) errors.memberId = '사용할 팝빌 아이디를 입력하세요.';
  else if (!MEMBER_ID_RE.test(c.memberId)) errors.memberId = '영문 · 숫자 · 밑줄(_) · 하이픈(-)으로 6~50자를 입력하세요.';

  if (!c.password) errors.password = '비밀번호를 입력하세요.';
  else if (
    !PASSWORD_RE.test(c.password) ||
    !/[A-Za-z]/.test(c.password) ||
    !/\d/.test(c.password) ||
    !PASSWORD_SPECIAL_RE.test(c.password)
  ) {
    errors.password = '영문 · 숫자 · 특수문자(~!@#$%^&*()_+)를 모두 넣어 8~20자로 입력하세요.';
  }

  if (!c.passwordConfirm) errors.passwordConfirm = '비밀번호를 한 번 더 입력하세요.';
  else if (c.password !== c.passwordConfirm) errors.passwordConfirm = '비밀번호가 서로 다릅니다.';
  return errors;
}

// ── 진행 단계 — 회사 → 권한 신청 · 심사 → 팝빌 연동 → 공동인증서 → 세금계산서 발급 준비 ──
// 현금영수증 준비는 공동인증서가 필요 없어 따로 본다(SupportScope).
/** waiting = 준비는 끝났고 정식 오픈을 기다린다 */
export type StepState = 'done' | 'current' | 'blocked' | 'waiting' | 'todo';
export type RegistrationStepKey = 'company' | 'review' | 'link' | 'certificate' | 'ready';
export interface RegistrationStep {
  key: RegistrationStepKey;
  label: string;
  state: StepState;
  note: string;
}

const STEP_ORDER: RegistrationStepKey[] = ['company', 'review', 'link', 'certificate', 'ready'];
const STEP_LABEL: Record<RegistrationStepKey, string> = {
  company: '회사 정보',
  review: '권한 신청 · 심사',
  link: '팝빌 연동',
  certificate: '공동인증서 등록',
  ready: '세금계산서 발급 준비',
};

/** 지금 진행할 단계의 위치(0~4) */
const CURRENT_INDEX: Record<RegistrationStage, number> = {
  NEED_COMPANY: 0,
  NOT_REGISTERED: 1,
  PENDING_VERIFICATION: 1,
  REJECTED: 1,
  VERIFIED: 2,
  NEEDS_CERTIFICATE: 3,
  READY: 4,
};

type StepInput = Pick<ElectronicRegistrationStatus, 'stage' | 'serviceConfigured' | 'memberLinked' | 'reviewStatus'>;

/**
 * 화면이 따를 단계 — 서버가 단계는 확인 중(PENDING_VERIFICATION)으로 두고 심사 결과만 반려로 준 경우도 반려로 본다.
 * 그 밖에는 서버 단계를 그대로 쓴다.
 */
export function effectiveStage(s: Pick<ElectronicRegistrationStatus, 'stage' | 'reviewStatus'>): RegistrationStage {
  if (s.stage === 'PENDING_VERIFICATION' && s.reviewStatus === 'REJECTED') return 'REJECTED';
  return s.stage;
}

function currentNote(key: RegistrationStepKey, s: StepInput, stage: RegistrationStage): string {
  switch (key) {
    case 'company':
      return '회사 정보 필요';
    case 'review':
      if (stage === 'REJECTED') return '반려 · 다시 신청 필요';
      return stage === 'PENDING_VERIFICATION' ? '운영팀 심사 중' : '신청서 작성';
    case 'link':
      if (!s.serviceConfigured) return '연동 설정 준비 중';
      if (s.memberLinked == null) return '연동 상태 확인 필요';
      return '팝빌 가입 필요';
    case 'certificate':
      return '인증서 등록 필요';
    case 'ready':
      return '준비 완료';
  }
}

/** launchOpen = 정식 오픈 값. 꺼져 있으면 마지막 단계는 "준비 완료 · 오픈 예정"으로 기다린다(완료로 보이지 않게) */
export function registrationSteps(s: StepInput, launchOpen = false): RegistrationStep[] {
  const stage = effectiveStage(s);
  const current = CURRENT_INDEX[stage];
  return STEP_ORDER.map((key, i) => {
    if (i < current) return { key, label: STEP_LABEL[key], state: 'done', note: '완료' };
    if (i === current) {
      if (key === 'ready') {
        return launchOpen
          ? { key, label: STEP_LABEL[key], state: 'done', note: '준비 완료' }
          : { key, label: STEP_LABEL[key], state: 'waiting', note: '준비 완료 · 오픈 예정' };
      }
      const blocked =
        stage === 'NEED_COMPANY' || stage === 'REJECTED' || (key === 'link' && (!s.serviceConfigured || s.memberLinked == null));
      return { key, label: STEP_LABEL[key], state: blocked ? 'blocked' : 'current', note: currentNote(key, s, stage) };
    }
    return { key, label: STEP_LABEL[key], state: 'todo', note: '대기' };
  });
}

/** 인증서 만료까지 남은 날 — yyyy-MM-dd 가 아니면 null */
export function daysUntil(isoDate: string | null | undefined, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate ?? '');
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}
