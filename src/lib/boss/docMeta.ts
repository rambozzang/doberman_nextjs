// 견적서 · 영수증 문서의 공통 메타 — 앱 EstimateCntr.getEstimateData() 와 같은 규칙
//
//   docNumber        yyyyMMdd-HHmm
//   today            작성일 (오늘)
//   validDate        유효기간 = 오늘 + 2개월
//   dueDate          납기일   = 오늘 + 10일
//   paymentCondition '계좌이체'
//   reference        '별도협의'
//
// 앱이 문서마다 이 값을 채워 넣으므로 웹도 똑같이 맞춘다.

import { toKoreanAmount } from '@/lib/boss/koreanAmount';

export type DocMeta = {
  docNumber: string;
  today: string;
  validDate: string;
  dueDate: string;
  paymentCondition: string;
  reference: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026.09.07 */
export function docDate(d: Date): string {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/**
 * @param now        문서번호(docNumber)에 찍히는 실제 생성 시각. 기본은 지금.
 * @param issueDate  화면에 보이는 견적일자 · 유효기간 · 납기일의 기준일. 생략하면 now 와 같다.
 *                    사장님이 견적일자를 직접 고른 경우에만 now 와 달라진다 — 문서번호는
 *                    "언제 만들었는지"를 남겨야 하므로 견적일자를 바꿔도 그대로 둔다.
 */
export function buildDocMeta(now: Date = new Date(), issueDate: Date = now): DocMeta {
  const valid = new Date(issueDate.getFullYear(), issueDate.getMonth() + 2, issueDate.getDate());
  const due = new Date(issueDate.getFullYear(), issueDate.getMonth(), issueDate.getDate() + 10);
  return {
    docNumber: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`,
    today: docDate(issueDate),
    validDate: docDate(valid),
    dueDate: docDate(due),
    paymentCondition: '계좌이체',
    reference: '별도협의',
  };
}

/**
 * <input type="date"> 값(yyyy-MM-dd) <-> Date 상호 변환. 반드시 로컬 연 · 월 · 일로 직접
 * 만든다 — new Date('yyyy-MM-dd') 는 UTC 자정으로 해석돼 한국 시간에서 하루 당겨질 수 있다.
 */
export function dateToInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function inputValueToDate(value: string): Date {
  const [y, m, day] = value.split('-').map(Number);
  if (!y || !m || !day) return new Date();
  return new Date(y, m - 1, day);
}

/** 금액 한글 표기 — "일십이만삼천원" */
export function amountInKorean(amount?: number | null): string {
  return toKoreanAmount(amount);
}

/** 사업자등록번호 000-00-00000 */
export function formatBizNoLoose(v?: string | null): string {
  if (!v) return '';
  const d = String(v).replace(/[^0-9]/g, '');
  if (d.length !== 10) return String(v);
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}
