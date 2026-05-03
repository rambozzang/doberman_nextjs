// 사장님 캘린더 API
// Flutter `lib/repo/calendar/calendar_repo.dart` 의 메서드들과 1:1 매핑
import BossApiClient from '@/lib/bossApi';
import type {
  CalendarEvent,
  CalendarCreateRequest,
  CalendarUpdateRequest,
  CalendarSearchRequest,
  CalendarShareRequest,
  CalendarShareUser,
  RepeatData,
} from '@/types/boss-calendar';

export const bossCalendarApi = {
  // 월별 이벤트 조회 — Flutter: CalendarRepo.getLists → GET /calendar/month?yyyyMM=&count=
  getMonth: (yyyyMM: string, count: string | number = 1) =>
    BossApiClient.getPrivate<CalendarEvent[]>(
      `/calendar/month?yyyyMM=${encodeURIComponent(yyyyMM)}&count=${encodeURIComponent(String(count))}`,
    ),

  // 이벤트 등록 — Flutter: CalendarRepo.saveEvent → POST /calendar/create
  create: (data: CalendarCreateRequest) =>
    BossApiClient.postPrivate<CalendarEvent>('/calendar/create', data),

  // 이벤트 수정 — Flutter: CalendarRepo.updateEvent → PUT /calendar/update
  update: (data: CalendarUpdateRequest) =>
    BossApiClient.putPrivate<CalendarEvent>('/calendar/update', data),

  // 이벤트 삭제 — Flutter: CalendarRepo.deleteEvent → DELETE /calendar/delete/{id}
  delete: (id: number | string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(`/calendar/delete/${encodeURIComponent(String(id))}`),

  // 반복 이벤트 전체 삭제 — Flutter: CalendarRepo.deleteRepeatEvents → DELETE /calendar/deleteRepeatEvents/{id}
  deleteRepeatEvents: (id: number | string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/calendar/deleteRepeatEvents/${encodeURIComponent(String(id))}`,
    ),

  // 검색 — Flutter: CalendarRepo.searchList → POST /calendar/search
  search: (data: CalendarSearchRequest) =>
    BossApiClient.postPrivate<CalendarEvent[]>('/calendar/search', data),

  // 특정 날짜 이벤트 조회 — Flutter: CalendarRepo.searchListByDate → GET /calendar/searchDataByDate?date=
  searchByDate: (date: string) =>
    BossApiClient.getPrivate<CalendarEvent[]>(
      `/calendar/searchDataByDate?date=${encodeURIComponent(date)}`,
    ),

  // 반복 데이터 조회 — Flutter: CalendarRepo.getRepeatData → GET /calendarRepeat/{id}
  getRepeatData: (id: number | string) =>
    BossApiClient.getPrivate<RepeatData>(`/calendarRepeat/${encodeURIComponent(String(id))}`),

  // 공유 등록 — Flutter: CalendarRepo.shareEvent → POST /calendar/share
  share: (data: CalendarShareRequest) =>
    BossApiClient.postPrivate<{ success?: boolean }>('/calendar/share', data),

  // 공유 사용자 조회 — Flutter: CalendarRepo.searchShareUsers → GET /calendar/share/customer/{customerId}
  shareUsers: (customerId: string | number) =>
    BossApiClient.getPrivate<CalendarShareUser[]>(
      `/calendar/share/customer/${encodeURIComponent(String(customerId))}`,
    ),

  // 공유 삭제 — Flutter: CalendarRepo.deleteShareUser → DELETE /calendar/share/delete?customerId=&userId=
  deleteShare: (customerId: string | number, userId: string | number) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/calendar/share/delete?customerId=${encodeURIComponent(String(customerId))}&userId=${encodeURIComponent(String(userId))}`,
    ),
};

// ----- 유틸: 백엔드 yyyyMMddHHmm 문자열 ↔ Date 변환 -----
// Flutter CalendarResData.parseDateTime 와 동일한 포맷을 사용한다.
export function parseBossDateTime(input?: string | null): Date | null {
  if (!input) return null;
  const s = String(input);
  if (s.length < 12) return null;
  const year = Number(s.substring(0, 4));
  const month = Number(s.substring(4, 6));
  const day = Number(s.substring(6, 8));
  const hour = Number(s.substring(8, 10));
  const minute = Number(s.substring(10, 12));
  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null;
  return new Date(year, month - 1, day, hour, minute);
}

export function formatBossDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}` +
    `${pad(date.getHours())}` +
    `${pad(date.getMinutes())}`
  );
}

// yyyy-MM-dd → Date (로컬)
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

// Date → yyyy-MM-dd
export function formatLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
