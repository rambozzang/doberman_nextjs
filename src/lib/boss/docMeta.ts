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

export function buildDocMeta(now: Date = new Date()): DocMeta {
  const valid = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());
  const due = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10);
  return {
    docNumber: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`,
    today: docDate(now),
    validDate: docDate(valid),
    dueDate: docDate(due),
    paymentCondition: '계좌이체',
    reference: '별도협의',
  };
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
