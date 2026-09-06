// 고객(시공 건) 상태 코드 — 앱 `lib/utils/utils.dart` 의 규칙과 1:1
//
//   00 진행중 (시공일이 지났으면 "수금중" 으로 표시)
//   01 수금중 (목록 필터 전용 — 백엔드가 00 + 시공일 경과로 해석)
//   10 수금완료
//   20 보류
//   30 취소
//
// 웹이 예전에 쓰던 01/02/03(진행/완료/취소)은 앱에 없는 값이라 앱에서 "전체"로 보였다. 다시 쓰지 않는다.

import type { StatusTone } from '@/components/boss/ui';

export type CustomerStatusCode = '00' | '01' | '10' | '20' | '30';

export const CUSTOMER_STATUS_OPTIONS: { code: CustomerStatusCode; label: string }[] = [
  { code: '00', label: '진행중' },
  { code: '10', label: '수금완료' },
  { code: '20', label: '보류' },
  { code: '30', label: '취소' },
];

/** 앱 고객 리스트의 탭 — 전체 · 진행중 · 수금중 · 수금완료 */
export const CUSTOMER_LIST_TABS: { key: '' | CustomerStatusCode; label: string }[] = [
  { key: '', label: '전체' },
  { key: '00', label: '진행중' },
  { key: '01', label: '수금중' },
  { key: '10', label: '수금완료' },
];

/** yyyyMMddHHmm 또는 yyyy-MM-dd 가 오늘보다 이전인가 */
function isPast(workDate?: string | null): boolean {
  if (!workDate) return false;
  const d = workDate.replace(/\D/g, '');
  if (d.length < 8) return false;
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(4, 6)) - 1;
  const day = Number(d.slice(6, 8));
  const hh = d.length >= 10 ? Number(d.slice(8, 10)) : 0;
  const mm = d.length >= 12 ? Number(d.slice(10, 12)) : 0;
  const t = new Date(y, m, day, hh, mm);
  return !Number.isNaN(t.getTime()) && Date.now() > t.getTime();
}

/** 상태 코드(+시공일) → 라벨 · 색. 앱 utils.dart 의 statusLabel 과 같은 판정 */
export function customerStatus(
  code?: string | null,
  workDate?: string | null
): { label: string; tone: StatusTone; code: string } {
  const c = (code ?? '').trim();
  switch (c) {
    case '00':
      return isPast(workDate)
        ? { label: '수금중', tone: 'warn', code: c }
        : { label: '진행중', tone: 'info', code: c };
    case '01':
      return { label: '수금중', tone: 'warn', code: c };
    case '10':
      return { label: '수금완료', tone: 'ok', code: c };
    case '20':
      return { label: '보류', tone: 'neutral', code: c };
    case '30':
      return { label: '취소', tone: 'bad', code: c };
    default:
      // 앱에 없는 값(예전 웹의 01~03 등)은 그대로 보여 주되 중립색 — 지어내지 않는다
      return { label: c || '진행중', tone: 'neutral', code: c };
  }
}
