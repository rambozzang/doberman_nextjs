import { AuthManager } from '@/lib/auth';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ApiResponse } from '@/types/api';
export type ConsultationRole = 'APP' | 'WEB';
export interface Visit {
  id: number;
  requestId: number;
  expertId: string;
  status: 'PROPOSED' | 'CONFIRMED' | 'CANCELED';
  slots: string[];
  selectedSlot: string | null;
  note: string | null;
  calendarEventId: number | null;
}
export interface Consultation {
  visits: Visit[];
  customerId: number | null;
}
export interface CustomerDraft {
  customerId: number | null;
  name: string;
  phone: string;
  email: string;
  address1: string;
  address2?: string;
  workDate?: string;
  estimateDate?: string;
  memo: string;
  quoteAmount: number | null;
  sourceRequestId: number;
}
export interface CustomerInput {
  name: string;
  phone: string;
  email: string;
  address1: string;
  address2?: string;
  workDate?: string;
  estimateDate?: string;
  memo?: string;
}
export function consultationPath(requestId: number, expertId: string) {
  if (!Number.isSafeInteger(requestId) || requestId <= 0 || !expertId.trim()) throw new Error('견적 정보를 확인해 주세요.');
  return `/consultations/${requestId}/${encodeURIComponent(expertId)}`;
}
export function validateVisitSlots(slots: string[], now = Date.now()): string | null {
  if (slots.length < 1 || slots.length > 3) return '가능한 시간을 1~3개 선택해 주세요.';
  if (new Set(slots).size !== slots.length) return '같은 시간은 한 번만 선택해 주세요.';
  for (const slot of slots) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(slot)) return '방문 날짜와 시간을 확인해 주세요.';
    const date = new Date(`${slot}:00+09:00`);
    if (!Number.isFinite(date.getTime()) || new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(date).replace(' ', 'T') !== slot) return '올바른 날짜를 선택해 주세요.';
    if (date.getTime() <= now) return '현재 이후의 시간을 선택해 주세요. (한국 시간)';
    if (date.getTime() > now + 365 * 24 * 60 * 60 * 1000) return '방문 시간은 오늘부터 1년 안으로 선택해 주세요.';
  }
  return null;
}
export function visitSlotTime(slot: string): number {
  return Date.parse(`${slot.length === 16 ? `${slot}:00` : slot}+09:00`);
}
export function visitLabel(slot: string) {
  const time = visitSlotTime(slot);
  if (!Number.isFinite(time)) return '날짜를 확인해 주세요';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(time));
}
export function consultationApi(role: ConsultationRole, requestId: number, expertId: string) {
  const base = consultationPath(requestId, expertId);
  async function call<T>(path: string, body?: unknown): Promise<T> {
    const token = role === 'APP' ? BossAuthManager.getToken() : AuthManager.getToken();
    if (!token) throw new Error('로그인 후 다시 시도해 주세요.');
    const response = await fetch(`/api/boss${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Client-Type': 'WEB'
      },
      ...(body === undefined ? {} : {
        body: JSON.stringify(body)
      })
    });
    const result = (await response.json()) as ApiResponse<T>;
    if (!response.ok || result.success !== true || result.data == null) throw new Error(result.message || '요청을 처리하지 못했습니다. 상태를 새로고침한 뒤 다시 시도해 주세요.');
    return result.data;
  }
  return {
    get: () => call<Consultation>(''),
    propose: (slots: string[], note?: string) => call<Visit>('/visits', {
      slots,
      note
    }),
    confirm: (visitId: number, slot: string) => call<Visit>(`/visits/${visitId}/confirm`, {
      slot
    }),
    cancel: (visitId: number) => call<Visit>(`/visits/${visitId}/cancel`, {}),
    draft: () => call<CustomerDraft>('/customer-draft'),
    saveCustomer: (input: CustomerInput) => call<{
      id: number;
      alreadyLinked: boolean;
    }>('/customer', input)
  };
}
