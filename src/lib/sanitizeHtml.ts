// 경량 HTML sanitizer (RichEditor 출력물 전용)
// 목적: 사장님 커뮤니티 등에서 TipTap이 만든 HTML을 안전하게 innerHTML 로 렌더.
// 외부 라이브러리 추가 없이 브라우저 DOMParser 를 이용한 whitelist 방식.
// 주의: 이 함수는 XSS 방어 "마지막 수단" 이 아니라 "기본 필터" 입니다.
//       사용자 입력을 서버 저장 전에 별도 검증하는 것도 권장합니다.

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  's',
  'u',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'span',
  'hr',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  span: new Set(['class']),
};

function isSafeUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v.startsWith('javascript:') || v.startsWith('data:')) return false;
  if (v.startsWith('vbscript:') || v.startsWith('file:')) return false;
  return true;
}

function sanitizeNode(node: Element) {
  const tag = node.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    // 허용되지 않은 태그는 children만 살려서 펼치기
    const parent = node.parentNode;
    if (parent) {
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
    }
    return;
  }

  const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
  const attrs = Array.from(node.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on')) {
      node.removeAttribute(attr.name);
      continue;
    }
    if (!allowed.has(name)) {
      node.removeAttribute(attr.name);
      continue;
    }
    if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
      node.removeAttribute(attr.name);
      continue;
    }
  }

  // 외부 링크는 보안을 위해 rel/target 강제
  if (tag === 'a' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }

  // 자식 노드 재귀 처리
  const children = Array.from(node.children);
  for (const child of children) sanitizeNode(child);
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    // SSR 환경에서는 태그 전부 제거 (보수적 fallback)
    return String(input).replace(/<[^>]*>/g, '');
  }
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, 'text/html');
  const root = doc.body.firstChild as Element | null;
  if (!root) return '';
  const children = Array.from(root.children);
  for (const child of children) sanitizeNode(child);
  return root.innerHTML;
}

// 기존 plain-text 호환: HTML 태그가 없는 입력인지 감지
export function looksLikePlainText(input: string | null | undefined): boolean {
  if (!input) return true;
  return !/<[a-zA-Z][^>]*>/.test(input);
}
