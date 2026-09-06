// 고객 개인정보 마스킹 — 앱 `lib/utils/utils.dart` 의 maskName / maskPhoneNumber / maskEmail 과 같은 규칙
//
// 웹견적 요청 상세에서 "내 견적이 채택(채택 성공)되기 전" 에는 고객 이름 · 연락처 · 이메일을
// 이 함수로 가려서 보여 준다. 앱과 다른 모양으로 가리면 사장님이 헛갈리므로 규칙을 그대로 옮겼다.

/** 이름 — 1자 그대로 · 2자 `김*` · 3자 `김*수` · 4자 `김**수` · 5자 이상 첫/끝만 */
export function maskName(name: string): string {
  const chars = Array.from(name);
  const n = chars.length;
  if (n === 0) return '이름 없음';
  if (n === 1) return name;
  if (n === 2) return `${chars[0]}*`;
  if (n === 3) return `${chars[0]}*${chars[2]}`;
  if (n === 4) return `${chars[0]}**${chars[3]}`;
  return `${chars[0]}${'*'.repeat(n - 2)}${chars[n - 1]}`;
}

/** 전화번호 — 숫자만 남기고 가운데를 가린다 (010-****-5678) */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '연락처 정보 없음';
  const digits = phone.replace(/[^0-9]/g, '');
  const len = digits.length;

  if (len < 8) {
    if (len <= 4) return '*'.repeat(len);
    return `${digits.slice(0, len - 4)}****`;
  }
  if (len === 10) return `${digits.slice(0, 3)}-****-${digits.slice(6)}`;
  if (len === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (len === 8) return `****-${digits.slice(4)}`;

  const startVisible = len < 7 ? 2 : 3;
  const endVisible = len < 7 ? 2 : 4;
  const start = digits.slice(0, startVisible);
  const end = digits.slice(len - endVisible);
  return `${start}${'*'.repeat(len - startVisible - endVisible)}${end}`;
}

/** 이메일 — @ 앞부분을 가린다 (ab***c@domain) */
export function maskEmail(email: string): string {
  if (!email) return '이메일 정보 없음';
  if (!email.includes('@')) return email;
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  const chars = Array.from(local);
  const n = chars.length;
  if (n === 0) return email;
  if (n <= 2) return `${chars[0]}***@${domain}`;
  if (n <= 4) return `${chars[0]}**${chars[n - 1]}@${domain}`;
  return `${chars[0]}${chars[1]}***${chars[n - 1]}@${domain}`;
}
