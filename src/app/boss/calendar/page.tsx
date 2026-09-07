'use client';

// 사장님 월간 일정 — Industry 패턴 (agent.opentohome.com)
//
// Flutter `lib/app/table_calendar/table_calendar_page.dart` + add/view bottom sheet 의 핵심 기능을 통합한다.
// 외부 캘린더 라이브러리 없이 CSS Grid 로 직접 그린다.
//
//   좌 : 6주 × 7일 사각 셀. 오늘 = accent 테두리, 선택 = accent-100 배경.
//        일정 칩은 사각 Tag 색쌍(견적 info · 시공 ok · 일정 neutral), 셀당 2개까지 + "n건 더".
//   우 : 선택한 날짜의 일정 행 목록 + 행 안 액션(수정 · 공유 · 삭제).
//   등록/수정 · 공유는 사각 모달(Field · Segmented · CheckLine). 삭제는 ConfirmDialog.
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다 — 여기서는 월 이동 컨트롤만 둔다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Button,
  Segmented,
  AlertBanner,
  ContentCard,
  CardHead,
  DashedCta,
  Tag,
  Field,
  SelectField,
  TextareaField,
  FieldLabel,
  CheckLine,
  ConfirmDialog,
  Kicker,
  type StatusTone,
} from '@/components/boss/ui';
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  X,
  MapPin,
  Phone,
  Bell,
  Repeat,
} from 'lucide-react';
import { bossCalendarApi, parseBossDateTime } from '@/lib/api/boss/calendar';
import type {
  CalendarEvent,
  CalendarCreateRequest,
  CalendarEventType,
  RepeatType,
  RepeatData,
  CalendarShareUser,
} from '@/types/boss-calendar';

// ----- 상수: 일정 종류 -----
// color 는 등록/수정 페이로드의 `color` 필드로 백엔드(앱)에 그대로 전송되는 데이터 값이다.
// 웹 화면 표시에는 쓰지 않고 tone(Tag 색쌍)만 쓴다.
const EVENT_TYPES: {
  value: CalendarEventType;
  label: string;
  color: string;
  tone: StatusTone;
}[] = [
  { value: 'estimate', label: '견적', color: '#8fb2ff', tone: 'info' },
  { value: 'construction', label: '시공', color: '#8fdca8', tone: 'ok' },
  { value: 'appointment', label: '일정', color: '#c9cbe0', tone: 'neutral' },
];

const REPEAT_TYPES: { value: RepeatType; label: string }[] = [
  { value: 'NONE', label: '반복 없음' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'YEARLY', label: '매년' },
];

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// Tag 색쌍 — 셀 안 칩(버튼)에 그대로 입힌다
const TONE_CLS: Record<StatusTone, string> = {
  ok: 'bg-boss-pill-ok text-boss-pill-ok-fg',
  warn: 'bg-boss-pill-warn text-boss-pill-warn-fg',
  bad: 'bg-boss-pill-bad text-boss-pill-bad-fg',
  neutral: 'bg-boss-pill-neutral text-boss-pill-neutral-fg ring-1 ring-inset ring-boss-border-soft',
  info: 'bg-boss-pill-info text-boss-pill-info-fg',
};

// 이벤트 타입에 따른 페이로드 색(데이터)
function eventColor(type?: string | null): string {
  const found = EVENT_TYPES.find((t) => t.value === type);
  return found?.color ?? '#6c7093';
}

function eventTone(type?: string | null): StatusTone {
  return EVENT_TYPES.find((t) => t.value === type)?.tone ?? 'neutral';
}

function eventLabel(type?: string | null): string {
  const found = EVENT_TYPES.find((t) => t.value === type);
  return found?.label ?? '기타';
}

// 한 달 그리드(6주 × 7일)에 표시할 날짜 배열을 만든다.
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startWeekDay = first.getDay();
  const start = new Date(year, month, 1 - startWeekDay);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Date → yyyyMM
function formatYyyyMM(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}`;
}

// 빈 폼 초기값
function emptyForm(date: Date): FormState {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return {
    title: '',
    description: '',
    location: '',
    phone: '',
    eventType: 'appointment',
    startDate: dateStr,
    startTime: '09:00',
    endDate: dateStr,
    endTime: '10:00',
    isAllDay: false,
    isReminder: false,
    isRepeat: false,
    repeatType: 'NONE',
  };
}

interface FormState {
  id?: number;
  title: string;
  description: string;
  location: string;
  phone: string;
  eventType: CalendarEventType;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  isReminder: boolean;
  isRepeat: boolean;
  repeatType: RepeatType;
}

// 폼 → 백엔드 등록/수정 페이로드
function formToCreate(form: FormState, overrides?: { startTime?: string; endTime?: string }): CalendarCreateRequest {
  const startTime = overrides?.startTime ?? form.startTime;
  const endTime = overrides?.endTime ?? form.endTime;
  const startDateTime = `${form.startDate.replace(/-/g, '')}${startTime.replace(':', '')}`;
  const endDateTime = `${form.endDate.replace(/-/g, '')}${endTime.replace(':', '')}`;
  const repeat: RepeatData | null = form.isRepeat
    ? {
        type: form.repeatType,
        startDate: form.startDate,
        endDate: form.endDate,
      }
    : null;
  return {
    title: form.title,
    description: form.description,
    location: form.location,
    phone: form.phone,
    eventType: form.eventType,
    startDate: startDateTime,
    endDate: endDateTime,
    startTime,
    endTime,
    isallday: form.isAllDay,
    isreminder: form.isReminder,
    isrepeat: form.isRepeat,
    color: eventColor(form.eventType),
    repeatData: repeat,
    // 서버 엔티티가 널을 받지 않는 항목 — 앱(calendar_add_cntr)과 같은 기본값을 보낸다.
    // 빠뜨리면 "Validation failed for TbCalendarEvent" 로 등록 · 수정이 모두 500 이 난다.
    customerId: 0,
    visibility: 'N',
    busyStatus: 'N',
    reminderList: '',
  };
}

function formToDates(form: FormState): { start: Date; end: Date } | null {
  const start = parseBossDateTime(`${form.startDate.replace(/-/g, '')}${form.startTime.replace(':', '')}`);
  const end = parseBossDateTime(`${form.endDate.replace(/-/g, '')}${form.endTime.replace(':', '')}`);
  if (!start || !end) return null;
  return { start, end };
}

// 응답 → 폼 (수정 모드)
function eventToForm(ev: CalendarEvent): FormState {
  const start = parseBossDateTime(ev.startDate) ?? new Date();
  const end = parseBossDateTime(ev.endDate) ?? new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    id: ev.id,
    title: ev.title ?? '',
    description: ev.description ?? '',
    location: ev.location ?? '',
    phone: ev.phone ?? '',
    eventType: (ev.eventType as CalendarEventType) ?? 'appointment',
    startDate: fmtDate(start),
    startTime: fmtTime(start),
    endDate: fmtDate(end),
    endTime: fmtTime(end),
    isAllDay: ev.isallday ?? false,
    isReminder: ev.isreminder ?? false,
    isRepeat: ev.isrepeat ?? false,
    repeatType: 'NONE',
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function BossCalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const router = useRouter();
  // 상단바 검색(`/` 로 포커스)을 이 화면에 연결한다
  const { query: keyword } = useBossSearch('일정 제목');

  // 모달 상태
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(today));
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState<CalendarEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ ev: CalendarEvent; repeatAll: boolean } | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // 월간 그리드
  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  // 데이터 로드
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const yyyyMM = formatYyyyMM(cursor);
      const res = await bossCalendarApi.getMonth(yyyyMM, 1);
      if (res.success) {
        const list = (res.data as CalendarEvent[] | undefined) ?? [];
        setEvents(Array.isArray(list) ? list : []);
      } else {
        setError(res.message || '일정을 불러오지 못했습니다.');
        setEvents([]);
      }
    } catch {
      setError('네트워크 오류로 일정을 불러오지 못했습니다.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    void load();
  }, [load]);

  // 날짜별 이벤트 매핑 (yyyy-mm-dd → events[])
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const filtered = keyword.trim()
      ? events.filter((e) => (e.title ?? '').toLowerCase().includes(keyword.toLowerCase()))
      : events;
    filtered.forEach((ev) => {
      const d = parseBossDateTime(ev.startDate);
      if (!d) return;
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [events, keyword]);

  const selectedKey = useMemo(() => {
    return `${selectedDate.getFullYear()}-${pad2(selectedDate.getMonth() + 1)}-${pad2(selectedDate.getDate())}`;
  }, [selectedDate]);

  const selectedEvents = eventsByDate.get(selectedKey) ?? [];

  // 이번 달(표시 중인 달) 일정 수 — 검색어 적용 후
  const monthCount = useMemo(() => {
    let n = 0;
    eventsByDate.forEach((list, key) => {
      if (key.startsWith(`${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}`)) n += list.length;
    });
    return n;
  }, [eventsByDate, cursor]);

  // 핸들러
  const handlePrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const handleNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const handleToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
  };

  const openCreate = (date: Date) => {
    setForm(emptyForm(date));
    setShowForm(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setForm(eventToForm(ev));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    const overrides = form.isAllDay ? { startTime: '00:00', endTime: '23:59' } : undefined;
    const dates = formToDates(form);
    if (dates) {
      const start = form.isAllDay
        ? new Date(dates.start.getFullYear(), dates.start.getMonth(), dates.start.getDate(), 0, 0)
        : dates.start;
      const end = form.isAllDay
        ? new Date(dates.end.getFullYear(), dates.end.getMonth(), dates.end.getDate(), 23, 59)
        : dates.end;
      if (start.getTime() >= end.getTime()) {
        toast.error('종료 일시는 시작 일시보다 늦어야 합니다.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = formToCreate(form, overrides);
      if (form.id) {
        const res = await bossCalendarApi.update({ ...payload, id: form.id });
        if (res.success) {
          toast.success('일정이 수정되었습니다.');
          setShowForm(false);
          await load();
        } else {
          toast.error(res.message || '수정 실패');
        }
      } else {
        const res = await bossCalendarApi.create(payload);
        if (res.success) {
          toast.success('일정이 등록되었습니다.');
          setShowForm(false);
          await load();
        } else {
          toast.error(res.message || '등록 실패');
        }
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 삭제 — ConfirmDialog 확인 후 실행
  const handleDelete = async (ev: CalendarEvent, repeatAll: boolean) => {
    setDeleting(true);
    try {
      const res = repeatAll
        ? await bossCalendarApi.deleteRepeatEvents(ev.id)
        : await bossCalendarApi.delete(ev.id);
      if (res.success) {
        toast.success('삭제되었습니다.');
        setPendingDelete(null);
        await load();
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* ───── 상단 컨트롤 — ‹ › + 월 + 오늘 · 우측 보기 전환 · 새로고침 · 등록 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex">
          <Button variant="secondary" size="sm" onClick={handlePrev} aria-label="이전 달">
            <ChevronLeft size={13} />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNext} aria-label="다음 달" className="-ml-px">
            <ChevronRight size={13} />
          </Button>
        </div>
        <h2 className="whitespace-nowrap font-boss-head text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-boss-text">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </h2>
        <Button variant="secondary" size="sm" onClick={handleToday}>
          오늘
        </Button>
        <p className="hidden text-[12px] text-boss-text-muted md:block">
          날짜를 누르면 오른쪽에 그날 일정이 보입니다 · 빈 칸의 + 로 바로 등록
        </p>
        <div className="flex-1" />
        <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : `이번 달 ${monthCount}건`}
        </span>
        <Segmented
          ariaLabel="보기 전환"
          value="month"
          onChange={(k) => {
            if (k === 'week') router.push('/boss/calendar/week');
            if (k === 'day') router.push('/boss/calendar/day');
          }}
          options={[
            { key: 'month', label: '월간' },
            { key: 'week', label: '주간' },
            { key: 'day', label: '일간' },
          ]}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => void load()}
          disabled={loading}
        >
          새로고침
        </Button>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => openCreate(selectedDate)}>
          일정 등록
        </Button>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void load()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* ───── 월 그리드 ───── */}
        <ContentCard>
          {/* 요일 헤더 — 표 TH 와 같은 조판. 오늘이 속한 열은 accent-100 */}
          <div className="grid grid-cols-7 border-b border-boss-border">
            {WEEK_LABELS.map((w, i) => {
              const isTodayCol = i === today.getDay();
              return (
                <div
                  key={w}
                  className={`whitespace-nowrap px-2 py-[9px] text-center text-[11px] font-semibold tracking-[0.08em] ${
                    isTodayCol
                      ? 'bg-boss-elevated text-boss-primary'
                      : 'bg-boss-inset text-boss-text-secondary'
                  }`}
                >
                  {w}
                </div>
              );
            })}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7">
            {grid.map((d, idx) => {
              const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
              const dayEvents = eventsByDate.get(key) ?? [];
              const inMonth = isSameMonth(d, cursor);
              const isToday = isSameDay(d, today);
              const isSelected = isSameDay(d, selectedDate);
              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일 ${dayEvents.length}건`}
                  onClick={() => setSelectedDate(d)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDate(d);
                    }
                  }}
                  className={`flex min-h-[108px] cursor-pointer flex-col gap-1.5 border-b border-r border-boss-border-row p-2 transition-colors duration-[120ms] ease-out [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0 ${
                    inMonth ? '' : 'opacity-45'
                  } ${isSelected ? 'bg-boss-elevated' : 'hover:bg-boss-inset'} ${
                    isToday ? 'shadow-[inset_0_0_0_1px_rgb(var(--boss-primary))]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-boss-head text-[12.5px] font-semibold tabular-nums ${
                        isToday ? 'text-boss-primary' : 'text-boss-text-secondary'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="font-boss-head text-[10.5px] tabular-nums text-boss-text-muted">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* 일정 칩 — 사각 Tag 색쌍, 2개까지 */}
                  {dayEvents.slice(0, 2).map((ev) => {
                    const start = parseBossDateTime(ev.startDate);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        title={ev.title ?? ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(ev);
                        }}
                        className={`flex w-full min-w-0 items-center gap-1.5 px-1.5 py-[3px] text-left text-[11px] leading-[1.3] transition-opacity duration-[120ms] ease-out hover:opacity-75 ${TONE_CLS[eventTone(ev.eventType)]}`}
                      >
                        <span className="font-boss-head tabular-nums">
                          {start && !ev.isallday ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : '종일'}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {ev.title || '제목 없음'}
                        </span>
                      </button>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <p className="font-boss-head text-[10.5px] tabular-nums text-boss-text-muted">
                      +{dayEvents.length - 2}건
                    </p>
                  )}

                  {/* 빈 슬롯 — 누르면 그 날짜로 등록 폼이 열린다 */}
                  {dayEvents.length === 0 && (
                    <button
                      type="button"
                      aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일 일정 등록`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreate(d);
                      }}
                      className="boss-dashed-cta mt-auto flex min-h-[28px] items-center justify-center text-[13px] font-medium"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </ContentCard>

        {/* ───── 우측: 선택한 날짜 일정 ───── */}
        <ContentCard>
          <CardHead
            title={`${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`}
            meta={`${WEEK_LABELS[selectedDate.getDay()]}요일${isSameDay(selectedDate, today) ? ' · 오늘' : ''}`}
            count={selectedEvents.length > 0 ? `${selectedEvents.length}건` : undefined}
            countTone="accent"
            action="등록"
            onAction={() => openCreate(selectedDate)}
          />
          {selectedEvents.length === 0 ? (
            <div className="p-4">
              <p className="mb-3 text-center text-[13px] text-boss-text-secondary">
                {keyword.trim()
                  ? `"${keyword.trim()}" 에 맞는 일정이 이 날짜에 없습니다.`
                  : '이 날짜에 잡힌 일정이 없습니다.'}
              </p>
              <DashedCta onClick={() => openCreate(selectedDate)}>
                <Plus size={12} /> 이 날짜에 일정 추가
              </DashedCta>
            </div>
          ) : (
            <ul>
              {selectedEvents.map((ev) => {
                const start = parseBossDateTime(ev.startDate);
                const end = parseBossDateTime(ev.endDate);
                const timeStr = ev.isallday
                  ? '종일'
                  : start && end
                    ? `${pad2(start.getHours())}:${pad2(start.getMinutes())} ~ ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
                    : '시간 미정';
                return (
                  <li key={ev.id} className="boss-row">
                    <div className="flex items-center gap-2">
                      <Tag tone={eventTone(ev.eventType)}>{eventLabel(ev.eventType)}</Tag>
                      <span className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                        {timeStr}
                      </span>
                      {ev.isrepeat && (
                        <Repeat size={11} className="text-boss-text-muted" aria-label="반복" />
                      )}
                      {ev.isreminder && (
                        <Bell size={11} className="text-boss-warning" aria-label="알림" />
                      )}
                    </div>
                    <p className="mt-1 truncate text-[13.5px] font-semibold text-boss-text">
                      {ev.title || '제목 없음'}
                    </p>
                    {(ev.location || ev.phone) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-boss-text-secondary">
                        {ev.location && (
                          <span className="flex min-w-0 items-center gap-1 truncate">
                            <MapPin size={11} /> {ev.location}
                          </span>
                        )}
                        {ev.phone && (
                          <a
                            href={`tel:${ev.phone.replace(/[^0-9+]/g, '')}`}
                            className="flex items-center gap-1 font-boss-head tabular-nums"
                          >
                            <Phone size={11} /> {ev.phone}
                          </a>
                        )}
                      </div>
                    )}
                    <div className="mt-1.5 -ml-2 flex items-center gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ev)}>
                        수정
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowShare(ev)}>
                        공유
                      </Button>
                      <div className="flex-1" />
                      {ev.isrepeat && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-boss-text-muted hover:!text-boss-error"
                          onClick={() => setPendingDelete({ ev, repeatAll: true })}
                        >
                          반복 전체 삭제
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!text-boss-text-muted hover:!text-boss-error"
                        onClick={() => setPendingDelete({ ev, repeatAll: false })}
                      >
                        삭제
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ContentCard>
      </div>

      {/* 등록/수정 모달 */}
      {showForm && (
        <EventFormModal
          form={form}
          saving={saving}
          onChange={setForm}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {/* 공유 모달 */}
      {showShare && (
        <ShareModal event={showShare} onClose={() => setShowShare(null)} />
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.repeatAll ? '반복 일정을 전체 삭제할까요?' : '이 일정을 삭제할까요?'}
        description={
          pendingDelete
            ? `${pendingDelete.ev.title || '제목 없음'} — ${
                pendingDelete.repeatAll ? '같은 반복 묶음의 일정이 모두 지워집니다.' : '삭제한 일정은 되돌릴 수 없습니다.'
              }`
            : undefined
        }
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete.ev, pendingDelete.repeatAll);
        }}
      />
    </div>
  );
}

// ----- 모달 껍데기 — 사각 패널 + 헤더 + 스크롤 본문 + 하단 액션 -----
function ModalFrame({
  title,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  // Escape 로 닫기 — role="dialog" 의 기본 기대
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 클릭으로는 닫지 않는다 — 입력 중인 폼이 날아간다. 닫기는 X · 취소로만 */}
      <div className="absolute inset-0 bg-boss-text/40" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidth} border border-boss-border bg-boss-surface shadow-boss-lg`}
      >
        <div className="boss-card-head">
          <h3 className="boss-section-title">{title}</h3>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="boss-btn boss-btn-sm boss-btn-ghost -mr-2 !text-boss-text-muted hover:!text-boss-text"
          >
            <X size={14} />
          </button>
        </div>
        <div className="boss-scroll max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-boss-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ----- 등록/수정 모달 -----
function EventFormModal({
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  form: FormState;
  saving: boolean;
  onChange: (f: FormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <ModalFrame
      title={form.id ? '일정 수정' : '일정 등록'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 종류 */}
        <div>
          <FieldLabel>종류</FieldLabel>
          <Segmented
            ariaLabel="일정 종류"
            value={form.eventType}
            onChange={(v) => onChange({ ...form, eventType: v })}
            options={EVENT_TYPES.map((t) => ({ key: t.value, label: t.label }))}
          />
        </div>

        <Field
          id="ev-title"
          label="제목"
          required
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="예) 김OO 고객 견적 방문"
          autoFocus
          maxLength={200}
        />

        <CheckLine
          checked={form.isAllDay}
          onChange={(v) => onChange({ ...form, isAllDay: v })}
        >
          종일
        </CheckLine>

        {/* 시작 / 종료 */}
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="ev-start-date"
            label="시작일"
            type="date"
            value={form.startDate}
            onChange={(e) => onChange({ ...form, startDate: e.target.value })}
          />
          <Field
            id="ev-start-time"
            label="시작 시간"
            type="time"
            value={form.startTime}
            disabled={form.isAllDay}
            onChange={(e) => onChange({ ...form, startTime: e.target.value })}
          />
          <Field
            id="ev-end-date"
            label="종료일"
            type="date"
            value={form.endDate}
            onChange={(e) => onChange({ ...form, endDate: e.target.value })}
          />
          <Field
            id="ev-end-time"
            label="종료 시간"
            type="time"
            value={form.endTime}
            disabled={form.isAllDay}
            onChange={(e) => onChange({ ...form, endTime: e.target.value })}
          />
        </div>

        {/* 장소 / 전화 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="ev-location"
            label="장소"
            value={form.location}
            onChange={(e) => onChange({ ...form, location: e.target.value })}
            placeholder="현장 주소"
            maxLength={200}
          />
          <Field
            id="ev-phone"
            label="전화"
            type="tel"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="010-0000-0000"
            maxLength={20}
          />
        </div>

        <TextareaField
          id="ev-desc"
          label="메모"
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="준비물 · 특이사항"
          maxLength={2000}
        />

        {/* 반복 / 알림 */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <CheckLine
            checked={form.isRepeat}
            onChange={(v) => onChange({ ...form, isRepeat: v })}
          >
            반복
          </CheckLine>
          <CheckLine
            checked={form.isReminder}
            onChange={(v) => onChange({ ...form, isReminder: v })}
          >
            일정 전 알림
          </CheckLine>
        </div>
        {form.isRepeat && (
          <SelectField
            id="ev-repeat"
            label="반복 주기"
            value={form.repeatType}
            onChange={(e) => onChange({ ...form, repeatType: e.target.value as RepeatType })}
          >
            {REPEAT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectField>
        )}
      </div>
    </ModalFrame>
  );
}

// ----- 공유 모달 -----
function ShareModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const [users, setUsers] = useState<CalendarShareUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [receiveUserId, setReceiveUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | number | null>(null);
  const [removing, setRemoving] = useState(false);

  const customerId = event.customerId ? String(event.customerId) : '';

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await bossCalendarApi.shareUsers(customerId);
      if (res.success) setUsers((res.data as CalendarShareUser[] | undefined) ?? []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleShare = async () => {
    if (!receiveUserId.trim()) {
      toast.error('공유할 사용자 ID를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await bossCalendarApi.share({
        customerId: customerId || null,
        receiveUserId: receiveUserId.trim(),
      });
      if (res.success) {
        toast.success('공유되었습니다.');
        setReceiveUserId('');
        await load();
      } else {
        toast.error(res.message || '공유 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: string | number) => {
    if (!customerId) return;
    setRemoving(true);
    try {
      const res = await bossCalendarApi.deleteShare(customerId, userId);
      if (res.success) {
        toast.success('공유가 해제되었습니다.');
        setPendingRemove(null);
        await load();
      } else {
        toast.error(res.message || '해제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <ModalFrame title="일정 공유" onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="boss-card-inset px-3 py-2.5">
          <Kicker>대상 일정</Kicker>
          <p className="mt-0.5 text-[13.5px] font-semibold text-boss-text">
            {event.title || '제목 없음'}
          </p>
        </div>

        <div>
          <FieldLabel htmlFor="share-user">공유할 사용자 ID</FieldLabel>
          <div className="flex gap-2">
            <input
              id="share-user"
              value={receiveUserId}
              onChange={(e) => setReceiveUserId(e.target.value)}
              placeholder="상대방 로그인 아이디"
              className="boss-input"
              maxLength={50}
            />
            <Button variant="primary" onClick={handleShare} disabled={submitting}>
              {submitting ? '공유 중…' : '공유'}
            </Button>
          </div>
          {!customerId && (
            <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
              고객이 연결되지 않은 일정이라 공유 목록은 비어 있습니다.
            </p>
          )}
        </div>

        <div>
          <Kicker className="mb-1.5">공유된 사용자</Kicker>
          {loading ? (
            <p className="py-3 text-center text-[12.5px] text-boss-text-secondary">불러오는 중…</p>
          ) : users.length === 0 ? (
            <p className="border border-boss-border bg-boss-inset px-3 py-4 text-center text-[12.5px] text-boss-text-secondary">
              아직 공유한 사람이 없습니다. 위에 아이디를 넣고 공유하세요.
            </p>
          ) : (
            <ul className="border border-boss-border">
              {users.map((u, idx) => (
                <li
                  key={`${u.userId ?? u.id ?? idx}`}
                  className="flex items-center justify-between gap-2 border-b border-boss-border-row px-3 py-2 text-[13px] text-boss-text last:border-b-0"
                >
                  <span className="min-w-0 truncate">{u.userName ?? u.userId ?? u.receiveUserId ?? '-'}</span>
                  {(u.userId ?? u.receiveUserId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mr-2 !text-boss-text-muted hover:!text-boss-error"
                      onClick={() => setPendingRemove(u.userId ?? u.receiveUserId ?? '')}
                    >
                      해제
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="공유를 해제할까요?"
        description="상대방 화면에서 이 일정이 사라집니다."
        confirmLabel="해제"
        loading={removing}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove !== null) void handleRemove(pendingRemove);
        }}
      />
    </ModalFrame>
  );
}
