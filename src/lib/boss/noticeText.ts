// 서버 PlatformText.plain과 같은 규칙. HTML로 해석하지 않고 일반 글자로 저장·비교한다.
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

