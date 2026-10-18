// 도배르만 운영(대표 전용) API — 백엔드 /platform-admin/* (웹 중계 /api/boss/platform-admin)
//
// 모든 요청은 서버가 운영자인지 다시 검사한다(AdminSupport). 화면의 메뉴 · 화면 감춤은 보안이 아니다.
// 처리 요청(정지 · 공지 저장 · 삭제 · 신고 · 문의 처리)은 한 번만 보낸다 — 실패 · 결과 불명이어도 자동으로 다시 보내지 않는다.
// 인증 헤더 · 세션 만료 처리는 bossPrivateApi 인터셉터가 한다. 요청 본문은 어디에도 기록하지 않는다.

import axios from 'axios';
import { bossPrivateApi } from '@/lib/bossApi';
import { parseMemberFieldValue, type MemberPrivateField } from '@/lib/boss/memberPrivacy';
import type { ApiResponse } from '@/types/api';
import {
  QUERY_MAX,
  parseAccess,
  parseAuditPage,
  parseInquiry,
  parseInquiryPage,
  parseMember,
  parseMemberPage,
  parseNotice,
  parseNoticePage,
  parseOverview,
  parsePaymentPage,
  parseReport,
  parseReportPage,
  parseSubscriptionPage,
} from '@/lib/boss/platformAdmin';
import type {
  CaseStatusFilter,
  InquiryResolveRequest,
  MemberStatusFilter,
  MemberStatusRequest,
  NoticeCreateRequest,
  NoticeDeleteRequest,
  NoticeStatusFilter,
  NoticeUpdateRequest,
  PlatformListQuery,
  ReportResolveRequest,
} from '@/types/boss-platform-admin';

/**
 * 결과 분류. 화면은 이 값으로 문구 · 다음 행동을 정한다.
 *   not-deployed — 서버에 아직 이 기능이 없다(404 경로 없음 · 405 · 501)
 *   network      — 응답을 받지 못했다. 처리 요청이었다면 서버가 처리했을 수 있다 → 다시 읽어 확인
 *   forbidden    — 운영자가 아니다(403) → 화면이 내용을 바로 닫는다
 *   stale        — 보던 내용이 바뀌었거나 이미 처리됐다(409) → 다시 불러와 다시 확인
 *   not-found    — 대상이 없다(서버가 답한 404)
 *   rejected     — 서버가 거절했다(이유 문장 그대로)
 *   unconfirmed  — 응답은 왔지만 모양을 읽지 못했다
 */
export type AdminFailure = 'not-deployed' | 'network' | 'forbidden' | 'stale' | 'not-found' | 'rejected' | 'unconfirmed';
export type AdminCall<T> = { ok: true; data: T } | { ok: false; failure: AdminFailure; message: string };

const MESSAGE: Record<Exclude<AdminFailure, 'rejected' | 'not-found'>, string> = {
  'not-deployed': '서버에 운영 관리 기능이 아직 반영되지 않았습니다.',
  network: '연결이 끊겨 결과를 받지 못했습니다. 잠시 뒤 다시 불러와 확인해 주세요.',
  forbidden: '운영자만 이용할 수 있습니다.',
  stale: '그사이 내용이 바뀌었거나 이미 처리되었습니다. 최신 내용을 다시 불러와 확인해 주세요.',
  unconfirmed: '응답은 받았지만 결과를 읽지 못했습니다. 다시 불러와 확인해 주세요.',
};

const NO_RESOURCE = /No static resource/i;

function errorText(data: unknown): string {
  const d = (data && typeof data === 'object' ? data : {}) as ApiResponse;
  return `${typeof d.error === 'string' ? d.error : ''} ${typeof d.message === 'string' ? d.message : ''}`.trim();
}

/** 응답 본문이 서버(스프링)가 만든 것인지 — 게이트웨이 HTML 오류 등은 서버 답이 아니다 */
function isServerEnvelope(data: unknown): boolean {
  return !!data && typeof data === 'object' && !Array.isArray(data) && ('success' in data || 'error' in data || 'message' in data);
}

function fail<T>(failure: AdminFailure, message?: string): AdminCall<T> {
  if (failure === 'rejected') return { ok: false, failure, message: message || '요청을 처리하지 못했습니다.' };
  if (failure === 'not-found') return { ok: false, failure, message: message || '대상을 찾지 못했습니다. 목록을 새로 불러와 주세요.' };
  // 409 는 서버 문장이 더 구체적이다(예: "이미 삭제된 공지입니다") — 있으면 그대로
  if (failure === 'stale') return { ok: false, failure, message: message || MESSAGE.stale };
  return { ok: false, failure, message: MESSAGE[failure] };
}

async function call<T>(send: () => Promise<{ data: unknown }>, parse: (raw: unknown) => T | null): Promise<AdminCall<T>> {
  try {
    const res = await send();
    const body = res.data;
    if (body && typeof body === 'object' && (body as ApiResponse).success === false) {
      const t = errorText(body);
      return NO_RESOURCE.test(t) ? fail('not-deployed') : fail('rejected', t);
    }
    const payload = body && typeof body === 'object' && 'success' in body ? (body as ApiResponse).data : body;
    const data = parse(payload);
    return data != null ? { ok: true, data } : fail('unconfirmed');
  } catch (e) {
    if (!axios.isAxiosError(e)) return fail('network');
    const code = e.response?.status;
    const data = e.response?.data;
    const t = errorText(data);
    // 예전 서버는 없는 경로를 500 + "No static resource …" 로도 준다 — 상태 코드와 상관없이 미배포로 본다(경로 원문은 보이지 않는다)
    if (NO_RESOURCE.test(t) || code === 405 || code === 501 || (code === 404 && !isServerEnvelope(data))) return fail('not-deployed');
    if (code == null || code === 502 || code === 503 || code === 504 || !isServerEnvelope(data)) return fail('network');
    if (code === 403) return fail('forbidden');
    if (code === 409) return fail('stale', t);
    if (code === 404) return fail('not-found', t);
    return fail('rejected', t || `요청을 처리하지 못했습니다(${code}).`);
  }
}

const PAGE_SIZE_MAX = 50;

/** 목록 조건 → 쿼리. 검색어는 앞뒤 공백을 걷고 길이를 자른다. 빈 검색어 · 전체 상태는 보내지 않아도 되지만 상태는 늘 보낸다 */
function listParams<S extends string>({ q, status, page, size = 20 }: PlatformListQuery<S>): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: Math.max(0, Math.floor(page)),
    size: Math.min(PAGE_SIZE_MAX, Math.max(1, Math.floor(size))),
  };
  const query = q.trim().slice(0, QUERY_MAX);
  if (query) out.q = query;
  if (status) out.status = status;
  return out;
}

// 처리 요청은 DB 한 트랜잭션이지만 넉넉히 기다린다(웹 nginx 60초 · Next 중계 58초 안쪽)
const WRITE_TIMEOUT_MS = 30_000;
const BASE = '/platform-admin';

export const platformAdminApi = {
  // 운영자 여부(로그인한 본인 판정) — GET /platform-admin/access → {isAdmin}
  access: () => call(() => bossPrivateApi.get(`${BASE}/access`), parseAccess),

  // 개요 — GET /platform-admin/overview
  overview: () => call(() => bossPrivateApi.get(`${BASE}/overview`), parseOverview),

  // 회원 — GET /platform-admin/members?q=&status=&page=&size=
  members: (query: PlatformListQuery<MemberStatusFilter>) =>
    call(() => bossPrivateApi.get(`${BASE}/members`, { params: listParams(query) }), parseMemberPage),

  // 회원 한 명 — GET /platform-admin/members/{id}
  member: (id: number) => call(() => bossPrivateApi.get(`${BASE}/members/${id}`), parseMember),

  // 개인정보 하나만 그때 조회. 저장·미리 읽기·재시도 없음. 포인터가 벗어나면 요청도 취소한다.
  revealMemberField: (id: number, field: MemberPrivateField, signal: AbortSignal) =>
    call(() => bossPrivateApi.post(`${BASE}/members/${id}/reveal`, { field }, { signal, timeout: 10_000 }),
      (raw) => parseMemberFieldValue(raw, id, field)),

  // 이용 정지 · 해제 — POST /platform-admin/members/{id}/status. 보던 상태(expectedStatus)가 바뀌었으면 409. 자동 재시도 없음.
  setMemberStatus: (id: number, body: MemberStatusRequest) =>
    call(() => bossPrivateApi.post(`${BASE}/members/${id}/status`, body, { timeout: WRITE_TIMEOUT_MS }), parseMember),

  // 구독 기록(읽기 전용) — GET /platform-admin/subscriptions?q=&page=&size=
  subscriptions: (query: PlatformListQuery) =>
    call(() => bossPrivateApi.get(`${BASE}/subscriptions`, { params: listParams(query) }), parseSubscriptionPage),

  // 결제 기록(읽기 전용) — GET /platform-admin/payments?q=&page=&size=
  payments: (query: PlatformListQuery) =>
    call(() => bossPrivateApi.get(`${BASE}/payments`, { params: listParams(query) }), parsePaymentPage),

  // 공지 — GET /platform-admin/notices?q=&status=&page=&size=
  notices: (query: PlatformListQuery<NoticeStatusFilter>) =>
    call(() => bossPrivateApi.get(`${BASE}/notices`, { params: listParams(query) }), parseNoticePage),

  // 공지 한 건 — GET /platform-admin/notices/{id}
  notice: (id: number) => call(() => bossPrivateApi.get(`${BASE}/notices/${id}`), parseNotice),

  // 공지 작성 — POST /platform-admin/notices. 푸시 · 이메일은 보내지 않는다(서버). 자동 재시도 없음.
  createNotice: (body: NoticeCreateRequest) =>
    call(() => bossPrivateApi.post(`${BASE}/notices`, body, { timeout: WRITE_TIMEOUT_MS }), parseNotice),

  // 공지 수정 · 공개 · 숨김 — PUT /platform-admin/notices/{id}. 보던 판(expectedUpdatedAt)이 바뀌었으면 409.
  updateNotice: (id: number, body: NoticeUpdateRequest) =>
    call(() => bossPrivateApi.put(`${BASE}/notices/${id}`, body, { timeout: WRITE_TIMEOUT_MS }), parseNotice),

  // 공지 삭제(되살리지 않는 숨김 삭제) — POST /platform-admin/notices/{id}/delete
  deleteNotice: (id: number, body: NoticeDeleteRequest) =>
    call(() => bossPrivateApi.post(`${BASE}/notices/${id}/delete`, body, { timeout: WRITE_TIMEOUT_MS }), parseNotice),

  // 신고 — GET /platform-admin/reports?q=&status=&page=&size=
  reports: (query: PlatformListQuery<CaseStatusFilter>) =>
    call(() => bossPrivateApi.get(`${BASE}/reports`, { params: listParams(query) }), parseReportPage),

  // 신고 처리 — POST /platform-admin/reports/{id}/resolve. 이미 처리됐으면 409. 글 삭제는 하지 않는다.
  resolveReport: (id: number, body: ReportResolveRequest) =>
    call(() => bossPrivateApi.post(`${BASE}/reports/${id}/resolve`, body, { timeout: WRITE_TIMEOUT_MS }), parseReport),

  // 문의 — GET /platform-admin/inquiries?q=&status=&page=&size=
  inquiries: (query: PlatformListQuery<CaseStatusFilter>) =>
    call(() => bossPrivateApi.get(`${BASE}/inquiries`, { params: listParams(query) }), parseInquiryPage),

  // 문의 처리 완료(운영 메모) — POST /platform-admin/inquiries/{id}/resolve. 이메일 회신은 하지 않는다.
  resolveInquiry: (id: number, body: InquiryResolveRequest) =>
    call(() => bossPrivateApi.post(`${BASE}/inquiries/${id}/resolve`, body, { timeout: WRITE_TIMEOUT_MS }), parseInquiry),

  // 감사 이력 — GET /platform-admin/audit?q=&page=&size=
  audit: (query: PlatformListQuery) =>
    call(() => bossPrivateApi.get(`${BASE}/audit`, { params: listParams(query) }), parseAuditPage),
};
