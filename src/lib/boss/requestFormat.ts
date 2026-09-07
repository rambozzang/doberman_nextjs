// 웹견적 요청 표기 — 목록(웹견적 요청 · 나의 견적)이 같은 규칙을 쓴다
//
// 서버 값에는 대괄호가 붙어 온다: "[사무실]", "[방 1개]", "[실크벽지]".
// 사장님이 읽는 화면에서는 대괄호를 걷어내고, 요청 내용을 한 줄로 묶어 보여 준다.

/** "[사무실]" → "사무실", "[방 1개],[전체]" → "방 1개 · 전체" */
export function stripBrackets(value?: string | null): string {
  if (!value) return '';
  const v = String(value);
  // 대괄호가 없으면 손대지 않는다 — 특이사항 같은 자유 문구의 쉼표를 · 로 바꾸면 안 된다
  if (!v.includes('[') && !v.includes(']')) return v.trim();
  return v
    .replace(/[[\]]/g, '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .join(' · ');
}

/** 접수 일시 — "09.07 14:20" (올해가 아니면 "2025.12.31", 시각이 없으면 날짜만) */
export function formatReceivedAt(input?: string | null): string {
  const d = toDate(input);
  if (!d) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const date = sameYear
    ? `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
    : `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  // 날짜만 들어온 값(예: "2026-09-04")에 00:00 을 붙이면 오해를 준다
  if (!hasTimePart(input)) return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 오늘 들어온 요청인가 — 목록에서 NEW 로 표시한다 */
export function isToday(input?: string | null): boolean {
  const d = toDate(input);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** "3시간 전" 처럼 얼마나 지났는지 */
export function timeAgo(input?: string | null): string {
  const d = toDate(input);
  if (!d) return '';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}일 전`;
  return `${Math.floor(day / 30)}개월 전`;
}

/** 요청 내용 한 줄 — "사무실 · 방 1개 · 9.92㎡ · 실크벽지" */
export function requestSummary(item: {
  buildingType?: string | null;
  constructionLocation?: string | null;
  roomCount?: number | null;
  areaSize?: number | null;
  wallpaper?: string | null;
  ceiling?: string | null;
}): string {
  const parts: string[] = [];
  const building = stripBrackets(item.buildingType);
  if (building) parts.push(building);
  const loc = stripBrackets(item.constructionLocation);
  if (loc) parts.push(loc);
  if (item.areaSize) parts.push(`${item.areaSize}㎡`);
  const paper = stripBrackets(item.wallpaper);
  if (paper) parts.push(paper);
  const ceiling = stripBrackets(item.ceiling);
  if (ceiling) parts.push(`천장 ${ceiling}`);
  return parts.join(' · ');
}

/** 희망일 — "협의 가능" 같은 문구는 그대로 둔다 */
export function formatPreferredDate(value?: string | null): string {
  if (!value) return '-';
  const v = String(value).trim();
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : v;
}

function hasTimePart(input?: string | null): boolean {
  const v = String(input ?? '').trim();
  if (/^\d{8}$/.test(v)) return false; // yyyyMMdd
  if (/^\d{12,14}$/.test(v)) return true; // yyyyMMddHHmm
  return /[T ]\d{1,2}:\d{2}/.test(v);
}

function toDate(input?: string | null): Date | null {
  if (!input) return null;
  const v = String(input).trim();
  if (!v) return null;

  // 앱이 쓰는 형식 — "202609041818"(yyyyMMddHHmm) · "20260904"(yyyyMMdd)
  const digits = v.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?/);
  if (/^\d{8}$/.test(v) || /^\d{12,14}$/.test(v)) {
    if (digits) {
      const d = new Date(
        Number(digits[1]),
        Number(digits[2]) - 1,
        Number(digits[3]),
        Number(digits[4] ?? 0),
        Number(digits[5] ?? 0)
      );
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  // 날짜만 온 값은 그 지역의 자정으로 읽는다 ("2026-09-04" 를 UTC 로 읽으면 하루가 밀린다)
  const dateOnly = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  // 서버가 "2026-09-04 18:18:03.0" 형태로 준다 — Safari 에서 그대로 파싱되지 않는다
  const normalized = v.replace(' ', 'T').replace(/\.\d+$/, '');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}
