// 사장님 세금계산서 · 현금영수증 API — 백엔드 /taxinvoices/*
import axios from 'axios';
import BossApiClient, { bossPrivateApi } from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import { isTaxCancelReason, TAX_CANCEL_TIMEOUT_MS } from '@/lib/boss/taxInvoiceCancel';
import {
  isRegistrationStage,
  type CashCancelReason,
  type ElectronicConfig,
  type ElectronicDocType,
  type ElectronicLinkRequest,
  type ElectronicPreview,
  type ElectronicRegistrationRequest,
  type ElectronicRegistrationStatus,
  type TaxCancelReason,
  type TaxCancelRequest,
  type TaxInvoiceCancellationPreview,
  type TaxInvoiceDocument,
} from '@/types/boss-taxinvoice';
import type {
  TaxInvoice,
  TaxInvoiceBuyerPrefill,
  TaxInvoicePeriodSummary,
  TaxInvoiceSaveRequest,
  TaxInvoiceStatus,
  TaxInvoiceStatusRequest,
  VatSummary,
} from '@/types/boss-taxinvoice';

/**
 * 발급 서비스 등록 API 결과.
 * 서버가 아직 이 경로를 배포하지 않은 경우(404 · 405)와 연결 실패, 서버 거절을 화면이 따로 말해야 해서 나눈다 —
 * 어느 경우든 "저장됨"처럼 보이면 안 된다.
 */
export type RegistrationFailure = 'not-deployed' | 'network' | 'rejected' | 'unconfirmed';
export type RegistrationCall =
  | { ok: true; status: ElectronicRegistrationStatus }
  | { ok: false; failure: RegistrationFailure; message: string };

const REGISTRATION_PATH = '/taxinvoices/electronic/registration';

function isMissingRegistrationResponse(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const body = raw as { success?: boolean; error?: unknown; message?: unknown };
  if (body.success === true) return false;
  const missing = /^No static resource \/?taxinvoices\/electronic\/(registration|link|certificate-url)\.?$/;
  return [body.error, body.message].some((v) => typeof v === 'string' && missing.test(v.trim()));
}

// BossApiClient 는 HTTP 상태 코드를 버리므로(서버 미반영 404 를 구분할 수 없다) 같은 인스턴스를 직접 부른다.
// 인증 헤더 · 세션 만료 처리는 인스턴스 인터셉터가 그대로 한다. 요청 본문(비밀번호)은 어디에도 기록하지 않는다.
async function registrationCall(send: () => Promise<{ data: unknown }>): Promise<RegistrationCall> {
  try {
    const res = await send();
    const body = res.data as ApiResponse<ElectronicRegistrationStatus> | null | undefined;
    if (isMissingRegistrationResponse(body)) {
      return { ok: false, failure: 'not-deployed', message: '서버에 발급 서비스 등록 기능이 아직 반영되지 않았습니다.' };
    }
    if (body?.success === false) {
      return { ok: false, failure: 'rejected', message: body.error || body.message || '요청을 처리하지 못했습니다.' };
    }
    if (body?.success === true && body.data && isRegistrationStage(body.data.stage)) return { ok: true, status: body.data };
    return { ok: false, failure: 'unconfirmed', message: '서버 응답으로 등록 결과를 확인하지 못했습니다. 다시 확인해 주세요.' };
  } catch (e) {
    const code = axios.isAxiosError(e) ? e.response?.status : undefined;
    if (code === 404 || code === 405 || code === 501 || (axios.isAxiosError(e) && isMissingRegistrationResponse(e.response?.data))) {
      return { ok: false, failure: 'not-deployed', message: '서버에 발급 서비스 등록 기능이 아직 반영되지 않았습니다.' };
    }
    if (code == null || code === 502 || code === 503 || code === 504) {
      return { ok: false, failure: 'network', message: '서버에 연결하지 못했습니다.' };
    }
    const body = axios.isAxiosError(e) ? (e.response?.data as ApiResponse | undefined) : undefined;
    return { ok: false, failure: 'rejected', message: body?.error || body?.message || `서버 오류(${code})로 처리하지 못했습니다.` };
  }
}

/**
 * 서식 문서 조회 결과. 서버가 아직 이 경로를 배포하지 않은 경우(404 · 405)는 따로 알려
 * 화면이 "공급자를 확인하지 못함"으로 정직하게 표시하게 한다 — 다른 회사 정보로 채우지 않는다.
 */
export type DocumentCall =
  | { ok: true; document: TaxInvoiceDocument }
  | { ok: false; failure: 'not-deployed' | 'network' | 'rejected'; message: string };

function normalizeDocument(raw: unknown): TaxInvoiceDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<TaxInvoiceDocument>;
  if (!d.invoice || typeof d.invoice !== 'object') return null;
  return {
    invoice: { ...d.invoice, items: Array.isArray(d.invoice.items) ? d.invoice.items : [] },
    supplier: d.supplier ?? null,
    // 서식 응답의 ready 는 발급 가능 판정이 아니다 — 무엇이 오든 false 로 둔다
    ready: false,
    issues: Array.isArray(d.issues) ? d.issues.filter((v): v is string => typeof v === 'string') : [],
    isTest: d.isTest === true,
    previewToken: typeof d.previewToken === 'string' ? d.previewToken : '',
  };
}

async function documentCall(id: number | string): Promise<DocumentCall> {
  try {
    const res = await bossPrivateApi.get(`/taxinvoices/${id}/document`);
    const body = res.data as ApiResponse<TaxInvoiceDocument> | null | undefined;
    if (body?.success === false) {
      return { ok: false, failure: 'rejected', message: body.error || body.message || '문서를 불러오지 못했습니다.' };
    }
    // 감싸지 않은 응답도 받는다(BossApiClient normalize 와 같은 규칙)
    const payload = body && typeof body === 'object' && 'success' in body ? body.data : body;
    const document = normalizeDocument(payload);
    if (document) return { ok: true, document };
    return { ok: false, failure: 'rejected', message: '서버 응답으로 문서를 확인하지 못했습니다.' };
  } catch (e) {
    const code = axios.isAxiosError(e) ? e.response?.status : undefined;
    const data = axios.isAxiosError(e) ? (e.response?.data as ApiResponse | undefined) : undefined;
    const text = `${data?.error ?? ''} ${data?.message ?? ''}`;
    if (code === 404 && /No static resource/.test(text)) {
      return { ok: false, failure: 'not-deployed', message: '서버에 문서 서식 기능이 아직 반영되지 않았습니다.' };
    }
    if (code === 405 || code === 501) {
      return { ok: false, failure: 'not-deployed', message: '서버에 문서 서식 기능이 아직 반영되지 않았습니다.' };
    }
    if (code == null || code === 502 || code === 503 || code === 504) {
      return { ok: false, failure: 'network', message: '서버에 연결하지 못했습니다.' };
    }
    if (/^No static resource/.test(text.trim())) {
      return { ok: false, failure: 'not-deployed', message: '서버에 문서 서식 기능이 아직 반영되지 않았습니다.' };
    }
    return { ok: false, failure: 'rejected', message: data?.error || data?.message || `서버 오류(${code})로 문서를 불러오지 못했습니다.` };
  }
}

// ─────────────────────────────────────────────
// 전자세금계산서 취소 — 미리보기(외부 변경 없음) · 확인(발행취소 또는 수정세금계산서 1회)
// ─────────────────────────────────────────────

const NOT_DEPLOYED_TAX_CANCEL = '서버에 세금계산서 취소 기능이 아직 반영되지 않았습니다.';

export type TaxCancelPreviewCall =
  | { ok: true; preview: TaxInvoiceCancellationPreview }
  | { ok: false; failure: 'not-deployed' | 'network' | 'rejected'; message: string };

function withItems(inv: TaxInvoice): TaxInvoice {
  return { ...inv, items: Array.isArray(inv.items) ? inv.items : [] };
}

/** 미리보기 응답 정리 — 모르는 값은 안전한 쪽(발급 불가 · 실제 환경)으로 둔다 */
export function normalizeCancelPreview(raw: unknown): TaxInvoiceCancellationPreview | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Record<keyof TaxInvoiceCancellationPreview, unknown>>;
  if (!p.invoice || typeof p.invoice !== 'object') return null;
  if (!isTaxCancelReason(p.reason)) return null;
  const mode = p.mode === 'CANCEL_ISSUE' || p.mode === 'CORRECTION' ? p.mode : null;
  return {
    invoice: withItems(p.invoice as TaxInvoice),
    correction: p.correction && typeof p.correction === 'object' ? withItems(p.correction as TaxInvoice) : null,
    supplier: p.supplier && typeof p.supplier === 'object' ? (p.supplier as TaxInvoiceCancellationPreview['supplier']) : null,
    mode,
    reason: p.reason,
    occurrenceDate: typeof p.occurrenceDate === 'string' && p.occurrenceDate ? p.occurrenceDate : null,
    providerStateCode: typeof p.providerStateCode === 'number' && Number.isFinite(p.providerStateCode) ? p.providerStateCode : null,
    // 방식을 모르면 진행하지 않는다
    ready: p.ready === true && mode != null,
    issues: Array.isArray(p.issues) ? p.issues.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [],
    // 시험 여부를 모르면 실제로 본다(경고가 더 강한 쪽)
    isTest: p.isTest === true,
    previewToken: typeof p.previewToken === 'string' ? p.previewToken : '',
  };
}

function errorText(data: unknown): string {
  const d = (data && typeof data === 'object' ? data : {}) as ApiResponse;
  return `${d.error ?? ''} ${d.message ?? ''}`.trim();
}

async function taxCancelPreviewCall(id: number | string, reason: TaxCancelReason, occurrenceDate: string | null): Promise<TaxCancelPreviewCall> {
  try {
    const res = await bossPrivateApi.get(`/taxinvoices/${id}/electronic/tax-cancel-preview`, {
      params: occurrenceDate ? { reason, occurrenceDate } : { reason },
      // 서버가 팝빌 상태를 새로 읽는다 — 기본 15초보다 넉넉히
      timeout: 30_000,
    });
    const body = res.data as ApiResponse<TaxInvoiceCancellationPreview> | null | undefined;
    if (body && typeof body === 'object' && body.success === false) {
      return { ok: false, failure: 'rejected', message: body.error || body.message || '미리보기를 만들지 못했습니다.' };
    }
    const payload = body && typeof body === 'object' && 'success' in body ? body.data : body;
    const preview = normalizeCancelPreview(payload);
    if (preview) return { ok: true, preview };
    return { ok: false, failure: 'rejected', message: '서버 응답으로 미리보기를 확인하지 못했습니다.' };
  } catch (e) {
    const code = axios.isAxiosError(e) ? e.response?.status : undefined;
    const text = axios.isAxiosError(e) ? errorText(e.response?.data) : '';
    if ((code === 404 && /No static resource/.test(text)) || code === 405 || code === 501) {
      return { ok: false, failure: 'not-deployed', message: NOT_DEPLOYED_TAX_CANCEL };
    }
    if (code == null || code === 502 || code === 503 || code === 504) {
      return { ok: false, failure: 'network', message: '서버에 연결하지 못했습니다. 잠시 뒤 다시 시도하세요.' };
    }
    return { ok: false, failure: 'rejected', message: text || `서버 오류(${code})로 미리보기를 만들지 못했습니다.` };
  }
}

/**
 * 취소 확인 결과.
 *   done      — 서버가 원본을 돌려줬다(상태는 그 안의 taxCancelStatus 로 본다)
 *   rejected  — 서버가 거절했다(서버가 응답했으므로 이후 조회가 진실)
 *   lost      — 응답을 받지 못했다(연결 끊김 · 시간 초과 · 게이트웨이 오류). 서버가 처리했을 수도 있다 → 시도 기록 유지
 */
export type TaxCancelCall =
  | { kind: 'done'; invoice: TaxInvoice }
  | { kind: 'rejected'; message: string }
  | { kind: 'lost'; message: string };

const LOST_MESSAGE = '취소 요청의 응답을 받지 못했습니다. 서버가 처리했을 수 있으니 다시 요청하지 말고 상태를 확인하세요.';

/** 응답 본문이 서버(스프링)가 만든 것인지 — 게이트웨이 HTML 오류 등은 서버 답이 아니다 */
function isServerEnvelope(data: unknown): boolean {
  return !!data && typeof data === 'object' && !Array.isArray(data) && ('success' in data || 'error' in data || 'message' in data);
}

async function taxCancelCall(id: number | string, body: TaxCancelRequest): Promise<TaxCancelCall> {
  try {
    const res = await bossPrivateApi.post(`/taxinvoices/${id}/electronic/tax-cancel`, body, { timeout: TAX_CANCEL_TIMEOUT_MS });
    const data = res.data as ApiResponse<TaxInvoice> | null | undefined;
    if (data && typeof data === 'object' && data.success === false) {
      return { kind: 'rejected', message: data.error || data.message || '취소 요청이 처리되지 않았습니다.' };
    }
    const payload = data && typeof data === 'object' && 'success' in data ? data.data : data;
    if (payload && typeof payload === 'object' && 'docType' in payload) return { kind: 'done', invoice: withItems(payload as TaxInvoice) };
    // 2xx 인데 문서를 못 읽었다 — 서버는 처리했을 수 있다
    return { kind: 'lost', message: '서버 응답에서 결과를 읽지 못했습니다. 다시 요청하지 말고 상태를 확인하세요.' };
  } catch (e) {
    if (!axios.isAxiosError(e)) return { kind: 'lost', message: LOST_MESSAGE };
    const code = e.response?.status;
    const data = e.response?.data;
    if (code == null || code === 502 || code === 503 || code === 504 || !isServerEnvelope(data)) {
      if ((code === 404 && /No static resource/.test(errorText(data))) || code === 405 || code === 501) {
        return { kind: 'rejected', message: NOT_DEPLOYED_TAX_CANCEL };
      }
      return { kind: 'lost', message: LOST_MESSAGE };
    }
    const text = errorText(data);
    if (code === 404 && /No static resource/.test(text)) return { kind: 'rejected', message: NOT_DEPLOYED_TAX_CANCEL };
    return { kind: 'rejected', message: text || `서버 오류(${code})로 처리하지 못했습니다.` };
  }
}

export const bossTaxInvoiceApi = {
  // 기간 목록 + 집계 — GET /taxinvoices?year=&quarter= (quarter 0 = 연간)
  period: (year: number, quarter: number) =>
    BossApiClient.getPrivate<TaxInvoicePeriodSummary>('/taxinvoices', {
      params: { year, quarter },
    }),

  // 상태별 목록 — GET /taxinvoices/status/{status}
  byStatus: (status: TaxInvoiceStatus) =>
    BossApiClient.getPrivate<TaxInvoice[]>(`/taxinvoices/status/${status}`),

  // 부가세 예상 — GET /taxinvoices/vat-summary?year=&quarter=
  vatSummary: (year: number, quarter: number) =>
    BossApiClient.getPrivate<VatSummary>('/taxinvoices/vat-summary', {
      params: { year, quarter },
    }),

  // 고객별 이력 — GET /taxinvoices/customer/{customerId}
  byCustomer: (customerId: number | string) =>
    BossApiClient.getPrivate<TaxInvoice[]>(`/taxinvoices/customer/${customerId}`),

  // 고객 사업자 정보 프리필 — GET /taxinvoices/customer/{customerId}/prefill
  prefill: (customerId: number | string) =>
    BossApiClient.getPrivate<TaxInvoiceBuyerPrefill | null>(
      `/taxinvoices/customer/${customerId}/prefill`,
    ),

  // 상세 — GET /taxinvoices/{id}
  get: (id: number | string) => BossApiClient.getPrivate<TaxInvoice>(`/taxinvoices/${id}`),

  // 저장 (id 있으면 수정) — POST /taxinvoices
  save: (data: TaxInvoiceSaveRequest) =>
    BossApiClient.postPrivate<{ id: number }>('/taxinvoices', data),

  // 상태 변경 — PUT /taxinvoices/{id}/status
  changeStatus: (id: number | string, data: TaxInvoiceStatusRequest) =>
    BossApiClient.putPrivate<TaxInvoice>(`/taxinvoices/${id}/status`, data),

  // 삭제 — DELETE /taxinvoices/{id}
  remove: (id: number | string) => BossApiClient.deletePrivate<unknown>(`/taxinvoices/${id}`),

  // 서식 문서(미리보기 · PDF · 인쇄) — GET /taxinvoices/{id}/document. 외부 호출 없음, 발급 판정 아님
  document: (id: number | string) => documentCall(id),

  // ── 전자 발급(팝빌) ──

  // 전자 발급 설정 · 준비 상태 — GET /taxinvoices/electronic/config?docType=TAX|CASH
  // 현금영수증 준비 상태는 세금계산서 인증서를 요구하지 않는다(서버 판정)
  electronicConfig: (docType: ElectronicDocType = 'TAX') =>
    BossApiClient.getPrivate<ElectronicConfig>('/taxinvoices/electronic/config', { params: { docType } }),

  // 공동인증서 등록 화면 주소 — POST /taxinvoices/electronic/certificate-url (팝빌 회원이어야 함)
  certificateUrl: () => BossApiClient.postPrivate<{ url: string }>('/taxinvoices/electronic/certificate-url'),

  // 발급 미리보기 — GET /taxinvoices/{id}/electronic/preview (외부로 아무것도 보내지 않는다)
  electronicPreview: (id: number | string) =>
    BossApiClient.getPrivate<ElectronicPreview>(`/taxinvoices/${id}/electronic/preview`),

  // 전자 발급 — POST /taxinvoices/{id}/electronic/issue. 직전 미리보기의 previewToken 필수.
  // 실패 · 불명이어도 자동 재시도하지 않는다.
  // 서버가 팝빌 준비 확인 · 발급을 차례로 부른다 — 기본 15초보다 넉넉히(웹 nginx 60초 · Next 중계 58초 안쪽)
  electronicIssue: (id: number | string, previewToken: string) =>
    BossApiClient.postPrivate<TaxInvoice>(
      `/taxinvoices/${id}/electronic/issue`,
      { confirmed: true, previewToken },
      { timeout: 55_000 },
    ),

  // 발급 · 국세청 전송 상태 다시 받기 — POST /taxinvoices/{id}/electronic/sync
  electronicSync: (id: number | string) =>
    BossApiClient.postPrivate<TaxInvoice>(`/taxinvoices/${id}/electronic/sync`, undefined, { timeout: 55_000 }),

  // 발급 문서 원본 보기 주소 — GET /taxinvoices/{id}/electronic/view
  electronicView: (id: number | string) =>
    BossApiClient.getPrivate<{ url: string }>(`/taxinvoices/${id}/electronic/view`),

  // 현금영수증 전액 취소 — POST /taxinvoices/{id}/electronic/cancel. 승인 원본 · 거래일자는 서버가 고른다.
  // 외부 호출이라 넉넉히 기다리고, 실패 · 불명이어도 자동으로 다시 보내지 않는다(결과는 상세를 다시 읽어 확인).
  electronicCancel: (id: number | string, reason: CashCancelReason) =>
    BossApiClient.postPrivate<TaxInvoice>(
      `/taxinvoices/${id}/electronic/cancel`,
      { confirmed: true, reason },
      // 국세청 전송 확인 조회 + 취소 — 웹 nginx 60초 · Next 중계 58초 안쪽
      { timeout: 55_000 },
    ),

  // 세금계산서 취소 미리보기 — GET /taxinvoices/{id}/electronic/tax-cancel-preview?reason=&occurrenceDate=
  // 팝빌 상태만 새로 읽는다(외부 변경 없음). 착오에 의한 이중발급은 날짜를 보내지 않는다.
  taxCancelPreview: (id: number | string, reason: TaxCancelReason, occurrenceDate: string | null) =>
    taxCancelPreviewCall(id, reason, occurrenceDate),

  // 세금계산서 취소 확인 — POST /taxinvoices/{id}/electronic/tax-cancel. 직전 미리보기 토큰 필수.
  // 전송 전이면 발행취소, 전송 후면 음수 수정세금계산서 1장. 금액 · 승인번호는 보내지 않는다. 자동 재시도 없음.
  taxCancel: (id: number | string, body: TaxCancelRequest) => taxCancelCall(id, body),

  // ── 발급 서비스 등록 (출시 값과 무관) ──

  // 등록 단계 — GET /taxinvoices/electronic/registration
  registrationStatus: () => registrationCall(() => bossPrivateApi.get(REGISTRATION_PATH)),

  // 권한 확인 신청(저장 = 신청, 승인 아님) — POST /taxinvoices/electronic/registration
  submitRegistration: (body: ElectronicRegistrationRequest) =>
    registrationCall(() => bossPrivateApi.post(REGISTRATION_PATH, body)),

  // 팝빌 연동 회원 가입 — POST /taxinvoices/electronic/link. 권한 확인(VERIFIED) 뒤에만.
  // 외부 가입이라 기본 15초보다 넉넉히 기다린다. 실패 · 불명이어도 자동으로 다시 보내지 않는다.
  linkMember: (body: ElectronicLinkRequest) =>
    registrationCall(() => bossPrivateApi.post('/taxinvoices/electronic/link', body, { timeout: 30_000 })),
};
