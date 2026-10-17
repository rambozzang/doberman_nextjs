// 도배르만 운영(대표 전용) — 응답 정리 · 화면 문구 · 입력 검사 (화면과 분리한 순수 함수)
//
// 원칙
//   모르는 값은 모른다고 쓴다 — 숫자가 없으면 "-"(0 아님), 상태를 모르면 "확인 필요". 다른 값으로 짐작하지 않는다.
//   구독 · 결제는 저장된 기록을 그대로 보인다 — 원천 상태값을 바꾸지 않고, 통화가 섞일 수 있어 합계를 내지 않는다.
//   공지 본문은 일반 글자다 — 화면은 글자 그대로(줄바꿈만 살려) 그리고 HTML 로 해석하지 않는다.
//   입력 검사는 화면용 미리 알림일 뿐이다. 서버가 같은 규칙(제목 200 · 본문 20000 · 빈 값 거절)을 다시 검사한다.

import {
  CASE_STATUSES,
  MEMBER_STATUSES,
  NOTICE_STATUSES,
  type CaseStatus,
  type MemberStatus,
  type NoticeEditableStatus,
  type NoticeStatus,
  type PlatformAdminAccess,
  type PlatformAudit,
  type PlatformInquiry,
  type PlatformInquiryPage,
  type PlatformMember,
  type PlatformNotice,
  type PlatformOverview,
  type PlatformPage,
  type PlatformPayment,
  type PlatformPaymentPage,
  type PlatformReport,
  type PlatformSourceInfo,
  type PlatformSubscription,
  type PlatformSubscriptionPage,
} from '@/types/boss-platform-admin';

export type AdminTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'info';

// ─────────────────────────────────────────────
// 응답 정리
// ─────────────────────────────────────────────

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const id = (v: unknown): number | null => {
  const n = num(v);
  return n != null && Number.isSafeInteger(n) && n > 0 ? n : null;
};
/** 건수 — 음수 · 소수 · 빈 값은 모르는 값(null)이지 0이 아니다 */
const countOrNull = (v: unknown): number | null => {
  const n = num(v);
  return n != null && n >= 0 && Number.isSafeInteger(n) ? n : null;
};
/** 참/거짓 — 서버가 원래 열 값(0/1 정수)으로도 준다. 그 밖의 값은 모르는 값 */
const flag = (v: unknown): boolean | null => {
  if (typeof v === 'boolean') return v;
  if (v === 1) return true;
  if (v === 0) return false;
  return null;
};
/** 아이디 · 번호 글자 — 숫자로 와도 글자로 */
const label = (v: unknown): string | null => (typeof v === 'number' && Number.isFinite(v) ? String(v) : str(v));
/** 금액은 글자로 받는다 — 숫자로 와도 그대로 글자로. 없으면 null(0 아님) */
const money = (v: unknown): string | null => (typeof v === 'number' && Number.isFinite(v) ? String(v) : str(v)?.trim() ?? null);
const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | null =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : null;

/** isAdmin 이 참/거짓으로 오지 않으면 판정하지 못한 것 — 진입을 열지 않는다 */
export function parseAccess(raw: unknown): PlatformAdminAccess | null {
  const a = obj(raw);
  return a && typeof a.isAdmin === 'boolean' ? { isAdmin: a.isAdmin } : null;
}

/** 목록 모양(items 배열)이 아니면 읽지 못한 것. 쪽 · 크기 · 건수가 없으면 받은 목록으로 채운다 */
function parsePage<T>(raw: unknown, item: (v: unknown) => T | null): PlatformPage<T> | null {
  const p = obj(raw);
  if (!p || !Array.isArray(p.items)) return null;
  const items = p.items.map(item).filter((x): x is T => x != null);
  const page = countOrNull(p.page);
  const size = countOrNull(p.size);
  const total = countOrNull(p.totalElements);
  return {
    items,
    page: page ?? 0,
    size: size != null && size > 0 ? size : Math.max(1, items.length),
    totalElements: total ?? items.length,
  };
}

function parseSource(p: Raw): PlatformSourceInfo {
  return {
    // 참으로 오지 않으면 연동 안 됨으로 본다 — 빈 목록을 "기록 없음"으로 단정하지 않는다
    available: p.available === true,
    source: str(p.source),
    explanation: str(p.explanation)?.trim() ?? null,
  };
}

export function parseOverview(raw: unknown): PlatformOverview | null {
  const o = obj(raw);
  if (!o) return null;
  return {
    checkedAt: str(o.checkedAt),
    totalMembers: countOrNull(o.totalMembers),
    activeMembers: countOrNull(o.activeMembers),
    suspendedMembers: countOrNull(o.suspendedMembers),
    deletedMembers: countOrNull(o.deletedMembers),
    newMembers7d: countOrNull(o.newMembers7d),
    publishedNotices: countOrNull(o.publishedNotices),
    openReports: countOrNull(o.openReports),
    openInquiries: countOrNull(o.openInquiries),
    subscriptionsAvailable: o.subscriptionsAvailable === true,
    paymentsAvailable: o.paymentsAvailable === true,
  };
}

export function parseMember(raw: unknown): PlatformMember | null {
  const m = obj(raw);
  const mid = id(m?.id);
  const userId = label(m?.userId);
  if (!m || mid == null || !userId) return null;
  return {
    id: mid,
    userId,
    name: str(m.name),
    nickName: str(m.nickName),
    companyName: str(m.companyName),
    phone: str(m.phone),
    email: str(m.email),
    status: oneOf(m.status, MEMBER_STATUSES),
    createdAt: str(m.createdAt),
    lastLoginAt: str(m.lastLoginAt),
    // TB_USER.EXTENDED_ACCESS 원래 값(0/1) — 유료 구독 여부가 아니다
    extendedAccess: flag(m.extendedAccess),
  };
}

export const parseMemberPage = (raw: unknown) => parsePage(raw, parseMember);

function parseSubscription(raw: unknown): PlatformSubscription | null {
  const s = obj(raw);
  const sid = num(s?.id) ?? str(s?.id);
  if (!s || sid == null) return null;
  return {
    id: sid,
    userId: label(s.userId) ?? '',
    name: str(s.name),
    productName: str(s.productName),
    status: str(s.status),
    startedAt: str(s.startedAt),
    expiresAt: str(s.expiresAt),
    source: str(s.source),
  };
}

export function parseSubscriptionPage(raw: unknown): PlatformSubscriptionPage | null {
  const p = obj(raw);
  if (!p) return null;
  const source = parseSource(p);
  // 연동 안 됨이면 목록이 없어도 된다 — 안내만 그린다
  const page = parsePage(Array.isArray(p.items) ? p : { ...p, items: [] }, parseSubscription);
  if (!page || (source.available && !Array.isArray(p.items))) return null;
  return { ...page, ...source };
}

function parsePayment(raw: unknown): PlatformPayment | null {
  const x = obj(raw);
  const pid = label(x?.id);
  if (!x || !pid) return null;
  return {
    id: pid,
    userId: label(x.userId) ?? '',
    name: str(x.name),
    productName: str(x.productName),
    amount: money(x.amount),
    currency: str(x.currency)?.trim() ?? null,
    status: str(x.status),
    createdAt: str(x.createdAt),
    source: str(x.source),
  };
}

export function parsePaymentPage(raw: unknown): PlatformPaymentPage | null {
  const p = obj(raw);
  if (!p) return null;
  const source = parseSource(p);
  const page = parsePage(Array.isArray(p.items) ? p : { ...p, items: [] }, parsePayment);
  if (!page || (source.available && !Array.isArray(p.items))) return null;
  return { ...page, ...source };
}

export function parseNotice(raw: unknown): PlatformNotice | null {
  const n = obj(raw);
  const nid = id(n?.id);
  if (!n || nid == null) return null;
  return {
    id: nid,
    title: text(n.title),
    content: text(n.content),
    status: oneOf(n.status, NOTICE_STATUSES),
    createdAt: str(n.createdAt),
    updatedAt: str(n.updatedAt),
    authorUserId: label(n.authorUserId),
  };
}

export const parseNoticePage = (raw: unknown) => parsePage(raw, parseNotice);

export function parseReport(raw: unknown): PlatformReport | null {
  const r = obj(raw);
  const rid = id(r?.id);
  if (!r || rid == null) return null;
  return {
    id: rid,
    boardId: id(r.boardId),
    title: str(r.title),
    reporterUserId: label(r.reporterUserId),
    targetUserId: label(r.targetUserId),
    reason: str(r.reason),
    createdAt: str(r.createdAt),
    status: oneOf(r.status, CASE_STATUSES),
    resolution: str(r.resolution),
    handledAt: str(r.handledAt),
    handledBy: label(r.handledBy),
    operatorNote: str(r.operatorNote),
  };
}

export const parseReportPage = (raw: unknown) => parsePage(raw, parseReport);

export function parseInquiry(raw: unknown): PlatformInquiry | null {
  const q = obj(raw);
  const qid = id(q?.id);
  if (!q || qid == null) return null;
  return {
    id: qid,
    name: str(q.name),
    email: str(q.email),
    phone: str(q.phone),
    inquiryType: str(q.inquiryType),
    title: str(q.title),
    content: str(q.content),
    createdAt: str(q.createdAt),
    status: oneOf(q.status, CASE_STATUSES),
    operatorNote: str(q.operatorNote),
    handledAt: str(q.handledAt),
    handledBy: label(q.handledBy),
  };
}

export function parseInquiryPage(raw: unknown): PlatformInquiryPage | null {
  const page = parsePage(raw, parseInquiry);
  if (!page) return null;
  return { ...page, explanation: str(obj(raw)?.explanation)?.trim() ?? null };
}

function parseAudit(raw: unknown): PlatformAudit | null {
  const a = obj(raw);
  const aid = id(a?.id);
  if (!a || aid == null) return null;
  return {
    id: aid,
    actorUserId: label(a.actorUserId),
    action: text(a.action),
    targetType: str(a.targetType),
    targetId: label(a.targetId),
    reason: str(a.reason),
    createdAt: str(a.createdAt),
  };
}

export const parseAuditPage = (raw: unknown) => parsePage(raw, parseAudit);

// ─────────────────────────────────────────────
// 표기
// ─────────────────────────────────────────────

/** 건수 → "1,234". 모르면 "-"(0 이라고 쓰지 않는다) */
export function formatCount(n: number | null | undefined): string {
  return n == null ? '-' : n.toLocaleString('ko-KR');
}

/**
 * 금액 → "12,900.00 KRW". 받은 소수 자리를 그대로 두고 천 단위 쉼표만 넣는다. 통화가 없으면 "통화 미기록".
 * 숫자 모양이 아니면 받은 글자 그대로. 없으면 null.
 */
export function formatAmount(amount: string | null, currency: string | null): string | null {
  if (amount == null) return null;
  const plain = amount.replace(/,/g, '').trim();
  const m = /^(-?)(\d+)(\.\d+)?$/.exec(plain);
  const body = m ? `${m[1]}${m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${m[3] ?? ''}` : amount;
  return `${body} ${currency || '통화 미기록'}`;
}

/** 회원 표시 이름 — 이름 → 닉네임 → 아이디 */
export function memberName(m: Pick<PlatformMember, 'name' | 'nickName' | 'userId'>): string {
  return m.name || m.nickName || m.userId;
}

// ─────────────────────────────────────────────
// 상태 문구
// ─────────────────────────────────────────────

export const MEMBER_STATUS_VIEW: Record<MemberStatus, { label: string; tone: AdminTone }> = {
  ACTIVE: { label: '이용 중', tone: 'ok' },
  SUSPENDED: { label: '이용 정지', tone: 'bad' },
  DELETED: { label: '탈퇴', tone: 'neutral' },
};

export const NOTICE_STATUS_VIEW: Record<NoticeStatus, { label: string; tone: AdminTone }> = {
  DRAFT: { label: '임시 저장', tone: 'neutral' },
  PUBLISHED: { label: '공개 중', tone: 'ok' },
  HIDDEN: { label: '숨김', tone: 'warn' },
  DELETED: { label: '삭제됨', tone: 'bad' },
};

/** 작성 · 수정에서 고르는 상태의 뜻 — 회원에게 보이는지가 핵심이다 */
export const NOTICE_EDITABLE_OPTIONS: { key: NoticeEditableStatus; label: string; hint: string }[] = [
  { key: 'DRAFT', label: '임시 저장', hint: '회원에게 보이지 않습니다' },
  { key: 'PUBLISHED', label: '공개', hint: '앱 · 웹 공지에 바로 보입니다' },
  { key: 'HIDDEN', label: '숨김', hint: '회원에게 보이지 않습니다' },
];

export const CASE_STATUS_VIEW: Record<CaseStatus, { label: string; tone: AdminTone }> = {
  OPEN: { label: '미처리', tone: 'warn' },
  RESOLVED: { label: '처리 완료', tone: 'ok' },
};

const RESOLUTION_LABEL: Record<string, string> = {
  DISMISS: '문제 없음(기각)',
  HIDE_POST: '글 숨김',
};

/** 신고 처리 결과 — 모르는 값은 받은 글자 그대로(운영자 화면) */
export function resolutionLabel(v: string | null): string | null {
  if (!v) return null;
  return RESOLUTION_LABEL[v.toUpperCase()] ?? v;
}

// 서버(PlatformAuditLog.record) 가 남기는 코드 — 2026-10-17 backend 소스 기준
const AUDIT_ACTION_LABEL: Record<string, string> = {
  MEMBER_SUSPEND: '회원 이용 정지',
  MEMBER_RESUME: '회원 정지 해제',
  NOTICE_CREATE: '공지 작성',
  NOTICE_UPDATE: '공지 수정',
  NOTICE_STATUS: '공지 상태 변경',
  NOTICE_DELETE: '공지 삭제',
  REPORT_DISMISS: '신고 기각',
  REPORT_HIDE_POST: '신고 글 숨김',
  INQUIRY_RESOLVE: '문의 처리 완료',
};

/** 감사 이력 종류 — 모르는 코드는 받은 글자 그대로(운영자가 원문을 알아볼 수 있게) */
export function auditActionLabel(action: string): string {
  const key = action.trim().toUpperCase();
  return AUDIT_ACTION_LABEL[key] ?? (action.trim() || '기록');
}

const TARGET_TYPE_LABEL: Record<string, string> = {
  MEMBER: '회원',
  USER: '회원',
  NOTICE: '공지',
  REPORT: '신고',
  INQUIRY: '문의',
};

export function auditTargetLabel(type: string | null, targetId: string | null): string {
  const t = type ? TARGET_TYPE_LABEL[type.toUpperCase()] ?? type : '대상';
  return targetId ? `${t} #${targetId}` : t;
}

// ─────────────────────────────────────────────
// 입력 검사 — 비어 있어야 보낼 수 있다
// ─────────────────────────────────────────────

export const NOTICE_TITLE_MAX = 200;
export const NOTICE_CONTENT_MAX = 20000;
/** 사유 · 운영 메모 길이 — 서버 확정 전 화면 기준(감사 이력에 남는다) */
export const REASON_MIN = 2;
export const REASON_MAX = 500;
/** 검색어 길이 — 서버(PlatformRules.MAX_QUERY)와 같다. 넘으면 서버가 거절한다 */
export const QUERY_MAX = 100;

// 서버 PlatformText.plain 과 같은 규칙 — 저장 값 = 앱에 보이는 값이 되도록 서버가 태그 모양 글자를 걷어 낸다.
// 화면 미리보기와 "결과를 모를 때 반영 여부 확인"이 서버와 같은 결과를 보게 맞춘다(화면은 이 값을 HTML 로 그리지 않는다).
const TAG = /<[a-zA-Z/!][^>]*>/;
const TAG_ALL = /<[a-zA-Z/!][^>]*>/g;
const SCRIPT_BLOCK = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const LINE_BREAK = /<br\s*\/?>/gi;
const BLOCK_END = /<\/(p|div|li|h[1-6]|tr)\s*>/gi;

/** 본문에 저장할 때 지워질 태그 모양 글자(<b>, </p> 등)가 있는가 */
export function hasTagLikeText(content: string): boolean {
  return TAG.test(content);
}

/** 서버가 저장할 본문(일반 글자) — 태그 모양 글자를 걷고 앞뒤 공백을 지운다 */
export function plainNoticeContent(raw: string): string {
  const s = raw.replace(/\r\n/g, '\n');
  if (!TAG.test(s)) return s.trim();
  return s
    .replace(SCRIPT_BLOCK, '')
    .replace(LINE_BREAK, '\n')
    .replace(BLOCK_END, '\n')
    .replace(TAG_ALL, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 서버가 저장할 제목 — 줄바꿈 · 탭은 공백 하나로 */
export function plainNoticeTitle(raw: string): string {
  return raw.replace(/[\r\n\t]+/g, ' ').trim();
}

export function reasonBlocker(reason: string, what = '사유'): string | null {
  const r = reason.trim();
  if (r.length < REASON_MIN) return `${what}를 ${REASON_MIN}자 이상 적어 주세요. 감사 이력에 남습니다.`;
  if (r.length > REASON_MAX) return `${what}는 ${REASON_MAX}자 이하로 줄여 주세요.`;
  return null;
}

export interface NoticeForm {
  title: string;
  content: string;
  status: NoticeEditableStatus;
  /** 공개로 저장할 때 — 회원 전체에 바로 보인다는 확인 */
  publishConfirmed: boolean;
}

export function noticeBlockers(form: NoticeForm): string[] {
  const out: string[] = [];
  const title = plainNoticeTitle(form.title);
  const content = plainNoticeContent(form.content);
  if (!title) out.push('제목을 적어 주세요.');
  else if (title.length > NOTICE_TITLE_MAX) out.push(`제목은 ${NOTICE_TITLE_MAX}자 이하로 줄여 주세요.`);
  if (!content) out.push('본문을 적어 주세요.');
  else if (content.length > NOTICE_CONTENT_MAX) out.push(`본문은 ${NOTICE_CONTENT_MAX.toLocaleString()}자 이하로 줄여 주세요.`);
  if (form.status === 'PUBLISHED' && !form.publishConfirmed) out.push('공개 확인 항목에 체크하세요.');
  return out;
}

/** 보낼 내용 — 앞뒤 공백만 걷는다(본문 안 줄바꿈 · 들여쓰기는 그대로). 태그 정리는 서버가 한다 */
export function noticePayload(form: NoticeForm): { title: string; content: string; status: NoticeEditableStatus } {
  return { title: plainNoticeTitle(form.title), content: form.content.trim(), status: form.status };
}

/** 서버에 저장된 공지가 이 작성 내용과 같은가 — 결과를 모를 때 반영 여부를 확인하는 데 쓴다 */
export function noticeMatches(n: Pick<PlatformNotice, 'title' | 'content' | 'status'>, form: NoticeForm): boolean {
  return (
    n.title.trim() === plainNoticeTitle(form.title) &&
    n.content.replace(/\r\n/g, '\n').trim() === plainNoticeContent(form.content) &&
    n.status === form.status
  );
}

/** 정지 · 해제할 수 있는 상태인가 — 본인 · 탈퇴 · 상태를 모르는 계정은 화면에서 먼저 막는다(운영자 계정은 서버가 막는다) */
export function memberStatusBlockers(m: PlatformMember, myUserId: string | null, reason: string, confirmed: boolean): string[] {
  const out: string[] = [];
  if (m.status == null) out.push('회원 상태를 확인하지 못했습니다. 다시 불러와 주세요.');
  else if (m.status === 'DELETED') out.push('탈퇴한 계정은 이 화면에서 바꾸지 않습니다.');
  if (myUserId && m.userId === myUserId) out.push('본인 계정은 바꿀 수 없습니다.');
  const r = reasonBlocker(reason);
  if (r) out.push(r);
  if (!confirmed) out.push('확인 항목에 체크하세요.');
  return out;
}

/** 쪽 수 — 0건이어도 1쪽 */
export function pageCount(totalElements: number, size: number): number {
  return Math.max(1, Math.ceil(Math.max(0, totalElements) / Math.max(1, size)));
}
