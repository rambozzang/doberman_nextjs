// 문서 양식(스타일) 선택 저장 — 앱과 같은 흐름
//
// 앱은 견적서 · 영수증을 열 때 저장된 선호 양식이 있으면 바로 그 양식으로 열고,
// 문서 화면 안의 "양식 변경" 으로 바꾼다(SharedPreferences 에 저장).
// 웹도 같은 방식으로 localStorage 에 기억한다.

export type DocKind = 'estimate' | 'receipt';

const KEY: Record<DocKind, string> = {
  estimate: 'boss_estimate_style',
  receipt: 'boss_receipt_style',
};

export function loadDocStyle(kind: DocKind, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(KEY[kind]) || fallback;
  } catch {
    return fallback;
  }
}

export function saveDocStyle(kind: DocKind, style: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY[kind], style);
  } catch {
    // 저장 실패는 무시 — 이번 화면에서만 적용된다
  }
}
