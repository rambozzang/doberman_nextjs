// 답변 양식 자동 채우기 (2026-10-23) — 앱 `web_estimate_template.dart` AnswerTemplateFill 과 같은 규칙
//
// 양식에 {지역} · {면적} · {벽지} 같은 칸을 두면, 답변 화면에서 고객 요청 내용으로 채운다.
// 사장님 대부분이 기본 양식에 금액만 넣어 보낸다(운영 답변 거의 전부 '서비스 내용' 칸이 빈 채로 나갔다) —
// 금액만 넣어도 요청 내용이 적힌 견적서가 되게 한다.
//
//   - 값이 없는 칸이 든 줄은 통째로 뺀다(예: 희망 일정이 없으면 '- 짐:' 줄이 사라진다)
//   - 모르는 칸({가격} 등)은 손대지 않는다 — 사장님이 직접 쓴 중괄호 글을 지우지 않는다
//   - 제목은 줄을 빼지 않고 빈 칸만 지운다
//   - 서식(HTML)으로 저장한 양식은 줄을 빼지 않고 칸만 바꾼다 — 한 줄짜리 HTML 을 통째로 지우지 않게

import { stripBrackets } from '@/lib/boss/requestFormat';

/** 양식에 쓸 수 있는 칸 — 양식 관리 화면 안내에도 쓴다 */
export const TEMPLATE_FIELDS = [
  '지역',
  '건물',
  '면적',
  '범위',
  '벽지',
  '천장',
  '희망일',
  '추가',
  '짐',
  '요약',
  '회사',
] as const;

export type TemplateField = (typeof TEMPLATE_FIELDS)[number];

export interface AnswerTemplateRequest {
  region?: string | null;
  buildingType?: string | null;
  constructionLocation?: string | null;
  /** 평 */
  area?: number | string | null;
  /** ㎡ */
  areaSize?: number | string | null;
  wallpaper?: string | null;
  ceiling?: string | null;
  preferredDate?: string | null;
  specialInfo?: string | null;
  specialInfoDetail?: string | null;
  hasItems?: string | null;
}

/** 39 → "39", 4.5 → "4.5", 128.934 → "128.93", 0 · 숫자 아님 → "" */
function num(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n * 100) / 100);
}

/** 요청 한 건에서 칸마다 넣을 글 */
export function templateValues(
  req: AnswerTemplateRequest | null | undefined,
  companyName?: string | null,
): Record<TemplateField, string> {
  const r = req ?? {};
  const building = stripBrackets(r.buildingType);
  const pyeong = num(r.area);
  const m2 = num(r.areaSize);
  const area = pyeong && m2 ? `${pyeong}평 (${m2}㎡)` : pyeong ? `${pyeong}평` : m2 ? `${m2}㎡` : '';

  const scopeParts = stripBrackets(r.constructionLocation)
    .split(' · ')
    .map((s) => s.trim())
    .filter(Boolean);
  const scope =
    scopeParts[0] === '전체' && scopeParts.length > 1
      ? `전체 (${scopeParts.slice(1).join(' · ')})`
      : scopeParts.join(' · ');

  const ceilingRaw = stripBrackets(r.ceiling);
  const ceiling =
    ceilingRaw === '전체' ? '포함' : ['없음', '제외', '안함', '안 함'].includes(ceilingRaw) ? '제외' : ceilingRaw;

  const dateRaw = (r.preferredDate ?? '').trim();
  const dateMatch = dateRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = dateMatch ? `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}` : dateRaw || '협의 가능';

  const special = stripBrackets(r.specialInfo).replace(/\s*,\s*/g, ' · ');
  const detail = (r.specialInfoDetail ?? '').replace(/\s+/g, ' ').trim();
  const extra = special && detail ? `${special} (${detail})` : special || detail;

  const paper = stripBrackets(r.wallpaper);
  const summary = [building, pyeong ? `${pyeong}평` : m2 ? `${m2}㎡` : '', paper].filter(Boolean).join(' · ');

  return {
    지역: (r.region ?? '').trim(),
    건물: building,
    면적: area,
    범위: scope,
    벽지: paper,
    천장: ceiling,
    희망일: date,
    추가: extra,
    짐: (r.hasItems ?? '').trim() ? '있음' : '',
    요약: summary,
    회사: (companyName ?? '').trim(),
  };
}

const TOKEN = /\{([^{}\n]+)\}/g;

function isField(name: string, values: Record<string, string>): boolean {
  return Object.prototype.hasOwnProperty.call(values, name);
}

const escapeHtml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 서식(HTML) 양식 채우기 — 칸만 바꾼다(값은 글자로 넣는다) */
export function fillTemplateHtml(html: string, values: Record<string, string>): string {
  return html.replace(TOKEN, (whole, name: string) => (isField(name, values) ? escapeHtml(values[name]) : whole));
}

/** 양식 본문 채우기 — 값이 빈 칸이 든 줄은 뺀다(줄글 양식) */
export function fillTemplate(text: string, values: Record<string, string>): string {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    let drop = false;
    const filled = line.replace(TOKEN, (whole, name: string) => {
      if (!isField(name, values)) return whole;
      const v = values[name];
      if (!v) drop = true;
      return v;
    });
    if (!drop) out.push(filled);
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

/** 양식 제목 채우기 — 빈 칸만 지우고 띄어쓰기를 정리한다 */
export function fillTitle(text: string, values: Record<string, string>): string {
  const filled = text
    .replace(TOKEN, (whole, name: string) => (isField(name, values) ? values[name] : whole))
    .replace(/\s+/g, ' ')
    .trim();
  return filled || '도배 견적 보내드립니다';
}
