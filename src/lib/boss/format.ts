// 고객 화면의 날짜 · 전화 표기 — 앱과 같은 모양으로 맞춘다
//
// 백엔드는 시공일 · 견적일을 'yyyyMMddHHmm' 문자열로 준다. 그대로 그리면
// "202609302100" 처럼 보여 사장님이 읽을 수 없다.
// 앱 Utils.formatDateTime 은 "2026.09.30(수) 21:00" 으로, 전화는
// StringUtils.hpMasking 으로 "010-****-5678" 처럼 보여 준다.

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 'yyyyMMddHHmm'(또는 yyyyMMdd)를 "2026.09.30(수) 21:00" 으로.
 * 시간이 없거나 00:00 이면 시간은 빼고 날짜만 보여 준다.
 * 파싱할 수 없으면 원문을 그대로 돌려준다 — 없는 값을 지어내지 않는다.
 */
export function formatAppDateTime(input?: string | null): string {
  if (!input) return '-';
  const d = String(input).replace(/[^0-9]/g, '');
  if (d.length < 8) return String(input);

  const year = Number(d.slice(0, 4));
  const month = Number(d.slice(4, 6));
  const day = Number(d.slice(6, 8));
  const hour = d.length >= 10 ? Number(d.slice(8, 10)) : 0;
  const minute = d.length >= 12 ? Number(d.slice(10, 12)) : 0;

  const date = new Date(year, month - 1, day, hour, minute);
  if (Number.isNaN(date.getTime())) return String(input);

  const pad = (n: number) => String(n).padStart(2, '0');
  const head = `${year}.${pad(month)}.${pad(day)}(${WEEKDAYS[date.getDay()]})`;
  if (hour === 0 && minute === 0) return head;
  return `${head} ${pad(hour)}:${pad(minute)}`;
}

/** 날짜만 — "2026.09.30" */
export function formatAppDate(input?: string | null): string {
  if (!input) return '-';
  const d = String(input).replace(/[^0-9]/g, '');
  if (d.length < 8) return String(input);
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
}

/** 전화번호에 하이픈만 넣는다 — 010-1234-5678 */
export function formatPhone(input?: string | null): string {
  if (!input) return '-';
  const d = String(input).replace(/[^0-9]/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return String(input);
}

/** 목록용 가림 표기 — 앱 StringUtils.hpMasking 과 같은 규칙 */
export function maskPhoneForList(input?: string | null): string {
  if (!input) return '-';
  const d = String(input).replace(/[^0-9]/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 9) return `${d.slice(0, 2)}-***-${d.slice(5)}`;
  if (d.length === 10) return `${d.slice(0, 2)}-****-${d.slice(6)}`;
  return String(input);
}
