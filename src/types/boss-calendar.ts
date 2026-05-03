// 사장님(boss) 캘린더 모듈 전용 타입
// Flutter `lib/repo/calendar/calendar_repo.dart` 와 `lib/repo/calendar/data/*.dart` 에 1:1 대응한다.

// 일정(이벤트) 종류 — Flutter EventsTypeEnum 매핑
// estimate(견적), construction(시공), appointment(일정)
export type CalendarEventType = 'estimate' | 'construction' | 'appointment';

// 반복 종류 — Flutter RepeatType
export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// 월별 반복 옵션 — Flutter MonthlyType
export type MonthlyType = 'specificDay' | 'firstDay' | 'lastDay';

// 반복 데이터 — Flutter RepeatData
export interface RepeatData {
  type: RepeatType;
  dailyInterval?: string | null;
  weekInterval?: string | null;
  selectedWeekDays?: boolean[] | null;
  monthlyInterval?: string | null;
  selectedDayOfMonth?: number | null;
  selectedYearlyDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

// 캘린더 응답 데이터 — Flutter CalendarResData
// startDate / endDate 는 백엔드가 yyyyMMddHHmm 형식의 문자열로 내려준다.
export interface CalendarEvent {
  id: number;
  customerId?: number | null;
  companyId?: number | null;
  eventType?: CalendarEventType | string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  allDay?: string | null;
  recurrenceRule?: string | null;
  color?: string | null;
  isreminder?: boolean | null;
  reminderList?: string | null;
  isrepeat?: boolean | null;
  repeatEventId?: number | null;
  isallday?: boolean | null;
  visibility?: string | null;
  busyStatus?: string | null;
  createdDt?: string | null;
  createdUserId?: string | null;
  updatedDt?: string | null;
}

// 등록 요청 — Flutter CalendarCreate
export interface CalendarCreateRequest {
  custoomerId?: string | null; // 백엔드 필드명 오타 그대로 유지
  companyId?: string | null;
  eventType?: CalendarEventType | string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  recurrenceRule?: string | null;
  color?: string | null;
  isreminder?: boolean | null;
  reminderList?: string | null;
  isrepeat?: boolean | null;
  isallday?: boolean | null;
  visibility?: string | null;
  busyStatus?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  repeatData?: RepeatData | null;
  repeatGroupId?: number | null;
}

// 수정 요청 — Flutter CalendarUpdataData
export interface CalendarUpdateRequest extends CalendarCreateRequest {
  id: number;
}

// 검색 요청 — Flutter SearchData
export interface CalendarSearchRequest {
  startDate?: string | null;
  endDate?: string | null;
  title?: string | null;
  visibility?: string | null;
  eventType?: CalendarEventType | string | null;
  companyId?: number | null;
  customerId?: number | null;
  busyStatus?: string | null;
}

// 공유 요청 — Flutter ShareData
export interface CalendarShareRequest {
  customerId?: string | null;
  owerUserId?: string | null; // 백엔드 필드명 오타 그대로 유지
  receiveUserId?: string | null;
}

// 공유 사용자 응답 (백엔드 스키마가 가변적이라 느슨하게)
export interface CalendarShareUser {
  id?: number;
  userId?: string;
  userName?: string | null;
  customerId?: string | null;
  owerUserId?: string | null;
  receiveUserId?: string | null;
  createdDt?: string | null;
}

// 알람 항목 (reminderList JSON 파싱 결과 또는 isreminder=true 인 이벤트)
export interface CalendarAlarmItem {
  eventId: number;
  title: string;
  startDate: string;
  remindAt?: string | null;
  eventType?: string | null;
  color?: string | null;
}
