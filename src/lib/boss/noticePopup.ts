import { plainNoticeContent, plainNoticeTitle } from './noticeText';
import {
  NOTICE_POPUP_DESTINATIONS,
  NOTICE_POPUP_KINDS,
  type NoticePopupSettings,
} from '@/types/boss-platform-admin';

export const EMPTY_NOTICE_POPUP: NoticePopupSettings = {
  enabled: false, kind: 'NOTICE', summary: '', ctaLabel: '자세히 보기',
  destination: 'NOTICE_DETAIL', startsAt: null, endsAt: null, priority: 0, imageUrl: null,
};

/** 팝업 이미지 — 우리 이미지 올리기가 돌려준 Cloudflare Images 주소만(물음표 · # · 공백 없이). 서버와 같은 규칙. */
const POPUP_IMAGE_URL = /^https:\/\/imagedelivery\.net\/[A-Za-z0-9_-]{1,64}\/[A-Za-z0-9_-]{1,100}\/[A-Za-z0-9_-]{1,40}$/;
export const POPUP_IMAGE_URL_MAX = 500;
export const POPUP_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const POPUP_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const POPUP_IMAGE_URL_MESSAGE = '팝업 이미지는 이미지 올리기로 올린 주소만 사용할 수 있습니다.';

export function isPopupImageUrl(value: string): boolean {
  return value.length <= POPUP_IMAGE_URL_MAX && POPUP_IMAGE_URL.test(value);
}

/** 올리기 전에 고른 파일을 확인한다 — 문제가 없으면 null */
export function popupImageFileProblem(file: { type: string; size: number }): string | null {
  if (!POPUP_IMAGE_TYPES.includes(file.type as never)) return 'PNG · JPG · WEBP 이미지만 올릴 수 있습니다.';
  if (file.size > POPUP_IMAGE_MAX_BYTES) return '10MB 이하 이미지만 올릴 수 있습니다.';
  return null;
}

export const POPUP_KIND_OPTIONS = [
  { key: 'NOTICE', label: '공지사항' },
  { key: 'EVENT', label: '이벤트' },
  { key: 'FEATURE', label: '새 기능' },
] as const;
export const POPUP_DESTINATION_OPTIONS = [
  { key: 'NOTICE_DETAIL', label: '이 공지 · 이벤트 내용' },
  { key: 'TAX_INVOICES', label: '전자세금계산서' },
  { key: 'TAX_REGISTRATION', label: '발급 서비스 등록' },
  { key: 'TAX_GUIDE', label: '세금계산서 시작 안내' },
  { key: 'MATERIAL_CALCULATOR', label: '자재 · 면적 계산기' },
] as const;

/** 날짜는 브라우저의 시간대와 무관하게 한국 시각인 벽시계 값으로 전송한다. */
export function popupDate(value: string | null): string | null {
  if (!value) return null;
  const v = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return null;
  const date = new Date(`${v}Z`);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 2000 && date.toISOString().slice(0, 19) === v ? v : null;
}

/** 모르는 설정을 기본값으로 덮어쓰지 않도록 엄격하게 읽는다. */
export function parseNoticePopup(raw: unknown): NoticePopupSettings | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.enabled !== 'boolean' || !NOTICE_POPUP_KINDS.includes(p.kind as never) ||
      !NOTICE_POPUP_DESTINATIONS.includes(p.destination as never) ||
      typeof p.summary !== 'string' || typeof p.ctaLabel !== 'string' ||
      !Number.isInteger(p.priority) || (p.priority as number) < 0 || (p.priority as number) > 100 ||
      (p.startsAt != null && (typeof p.startsAt !== 'string' || !popupDate(p.startsAt))) ||
      (p.endsAt != null && (typeof p.endsAt !== 'string' || !popupDate(p.endsAt))) ||
      (p.imageUrl != null && (typeof p.imageUrl !== 'string' || !isPopupImageUrl(p.imageUrl)))) return null;
  // 이미지 칸이 없는 옛 서버 응답은 '이미지 없음'으로 읽는다
  return { ...(p as unknown as NoticePopupSettings), imageUrl: (p.imageUrl as string | null | undefined) ?? null };
}

export function popupPayload(p: NoticePopupSettings): NoticePopupSettings {
  return { ...p, summary: plainNoticeContent(p.summary).replace(/\t/g, ' '), ctaLabel: plainNoticeTitle(plainNoticeContent(p.ctaLabel)) || '자세히 보기',
    startsAt: popupDate(p.startsAt), endsAt: popupDate(p.endsAt), imageUrl: p.imageUrl?.trim() || null };
}

export const POPUP_EVENT_IMAGE_MESSAGE = '이벤트 팝업은 이미지 한 장으로 띄웁니다. 팝업 이미지를 올려 주세요.';

export function popupBlockers(p?: NoticePopupSettings | null): string[] {
  if (!p) return [];
  const out: string[] = [];
  if (p.summary.trim().length > 160) out.push('팝업 소개는 160자 이하로 줄여 주세요.');
  if (p.ctaLabel.trim().length > 24) out.push('팝업 버튼 이름은 24자 이하로 줄여 주세요.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(`${p.summary}${p.ctaLabel}`)) out.push('팝업 문구에 사용할 수 없는 글자가 있습니다.');
  if (!NOTICE_POPUP_KINDS.includes(p.kind) || !NOTICE_POPUP_DESTINATIONS.includes(p.destination)) out.push('팝업 종류와 이동 화면을 다시 골라 주세요.');
  if (!Number.isInteger(p.priority) || p.priority < 0 || p.priority > 100) out.push('노출 우선순위는 0부터 100 사이의 정수로 적어 주세요.');
  const start = popupDate(p.startsAt), end = popupDate(p.endsAt);
  if (p.startsAt && !start) out.push('팝업 시작 시각을 올바르게 적어 주세요.');
  if (p.endsAt && !end) out.push('팝업 종료 시각을 올바르게 적어 주세요.');
  if (start && end && start >= end) out.push('팝업 종료는 시작보다 뒤여야 합니다.');
  const image = p.imageUrl?.trim();
  if (image && !isPopupImageUrl(image)) out.push(POPUP_IMAGE_URL_MESSAGE);
  // 이벤트는 이미지 한 장으로만 띄운다(2026-10-18) — 서버 PlatformNoticePopups.EVENT_IMAGE_REQUIRED 와 같은 규칙
  if (p.enabled && p.kind === 'EVENT' && !image) out.push(POPUP_EVENT_IMAGE_MESSAGE);
  return out;
}

export function samePopup(a?: NoticePopupSettings | null, b?: NoticePopupSettings | null): boolean {
  const x = popupPayload(a ?? EMPTY_NOTICE_POPUP), y = popupPayload(b ?? EMPTY_NOTICE_POPUP);
  return x.enabled === y.enabled && x.kind === y.kind && x.summary === y.summary && x.ctaLabel === y.ctaLabel &&
    x.destination === y.destination && x.startsAt === y.startsAt && x.endsAt === y.endsAt && x.priority === y.priority &&
    x.imageUrl === y.imageUrl;
}

/** 팝업 기간 한 줄 — 앱과 같은 모양. 자정에 끝나면 '10월 31일까지', 아니면 '10월 31일 18:00 전까지'. */
export function popupPeriodLabel(endsAt: string | null): string | null {
  const v = popupDate(endsAt);
  if (!v) return null;
  const end = new Date(`${v}Z`); // 한국 벽시계 값을 그대로 다룬다(브라우저 시간대와 무관)
  if (v.endsWith('T00:00:00')) {
    const last = new Date(end.getTime() - 86_400_000);
    return `${last.getUTCMonth() + 1}월 ${last.getUTCDate()}일까지`;
  }
  return `${end.getUTCMonth() + 1}월 ${end.getUTCDate()}일 ${v.slice(11, 16)} 전까지`;
}

export function popupVisibility(status: string | null, p?: NoticePopupSettings | null, now = Date.now()): string {
  if (!p?.enabled) return '사용 안 함';
  if (status !== 'PUBLISHED') return status === 'DELETED' ? '삭제됨' : '공개 대기';
  const start = p.startsAt ? Date.parse(`${p.startsAt}+09:00`) : null;
  const end = p.endsAt ? Date.parse(`${p.endsAt}+09:00`) : null;
  if (end != null && now >= end) return '기간 종료';
  if (start != null && now < start) return '예약됨';
  return '노출 중';
}
