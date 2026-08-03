'use client';

// 사장님 월간 캘린더 페이지
// Flutter `lib/app/table_calendar/table_calendar_page.dart` + add/view bottom sheet 의 핵심 기능을 통합한다.
// 외부 캘린더 라이브러리를 사용하지 않고 Tailwind CSS Grid 로 직접 그린다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Button,
  Segmented,
  AlertBanner,
  ContentCard,
  CardHead,
  Chip,
  DashedCta,
  chipToneOf,
} from '@/components/boss/ui';
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  X,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Bell,
  Repeat,
  Trash2,
  Save,
  Share2,
  AlignLeft,
} from 'lucide-react';
import { bossCalendarApi, parseBossDateTime, formatBossDateTime } from '@/lib/api/boss/calendar';
import type {
  CalendarEvent,
  CalendarCreateRequest,
  CalendarEventType,
  RepeatType,
  RepeatData,
  CalendarShareUser,
} from '@/types/boss-calendar';

// ----- 상수: 일정 종류 / 색상 -----
const EVENT_TYPES: { value: CalendarEventType; label: string; color: string }[] = [
  { value: 'estimate', label: '견적', color: '#8fb2ff' },
  { value: 'construction', label: '시공', color: '#8fdca8' },
  { value: 'appointment', label: '일정', color: '#c9cbe0' },
];

const REPEAT_TYPES: { value: RepeatType; label: string }[] = [
  { value: 'NONE', label: '반복 없음' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'YEARLY', label: '매년' },
];

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 이벤트 타입에 따른 색상
function eventColor(type?: string | null): string {
  const found = EVENT_TYPES.find((t) => t.value === type);
  return found?.color ?? '#6c7093';
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
      const pad = (n: number) => String(n).padStart(2, '0');
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [events, keyword]);

  const selectedKey = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
  }, [selectedDate]);

  const selectedEvents = eventsByDate.get(selectedKey) ?? [];

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

  const handleDelete = async (ev: CalendarEvent, repeatAll: boolean) => {
    if (!confirm(repeatAll ? '반복 일정 전체를 삭제할까요?' : '이 일정을 삭제할까요?')) return;
    try {
      const res = repeatAll
        ? await bossCalendarApi.deleteRepeatEvents(ev.id)
        : await bossCalendarApi.delete(ev.id);
      if (res.success) {
        toast.success('삭제되었습니다.');
        await load();
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* ───── 상단 컨트롤 — 시안 캘린더: ‹ › + 제목 13px/700 + 힌트 + 우측 액션 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="이전 달"
            className="boss-btn boss-btn-sm boss-btn-outline"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="다음 달"
            className="boss-btn boss-btn-sm boss-btn-outline"
          >
            ›
          </button>
        </div>
        <h2 className="whitespace-nowrap text-[13px] font-bold text-boss-text">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </h2>
        <p className="hidden text-[11.5px] text-boss-text-muted md:block">
          날짜 클릭으로 선택 · 빈 칸 더블클릭으로 일정 추가
        </p>
        <div className="flex-1" />
        <Segmented
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
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => void load()}
          disabled={loading}
        >
          새로고침
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          오늘
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
        {/* ───── 캘린더 그리드 — 시안 주간 그리드 스펙을 월간에 적용 ───── */}
        <ContentCard>
          {/* 요일 헤더 — 오늘이 속한 열은 ac-dim 배경 + 흰색 700 */}
          <div className="grid grid-cols-7">
            {WEEK_LABELS.map((w, i) => {
              const isTodayCol = i === today.getDay();
              return (
                <div
                  key={w}
                  className={`whitespace-nowrap border-b border-boss-border px-2.5 py-[9px] text-center text-[11.5px] ${
                    isTodayCol
                      ? 'bg-[var(--boss-ac-dim)] font-bold text-white'
                      : 'font-medium text-boss-text-secondary'
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
              const pad = (n: number) => String(n).padStart(2, '0');
              const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
              const dayEvents = eventsByDate.get(key) ?? [];
              const inMonth = isSameMonth(d, cursor);
              const isToday = isSameDay(d, today);
              const isSelected = isSameDay(d, selectedDate);
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={`flex min-h-[112px] cursor-pointer flex-col gap-[7px] border-b border-r border-boss-border-row p-[9px] transition-colors duration-[120ms] ease-out ${
                    inMonth ? '' : 'opacity-45'
                  } ${isSelected ? 'bg-boss-elevated shadow-[inset_0_0_0_1px_rgb(var(--boss-primary))]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-boss-mono text-[11px] ${
                        isToday ? 'font-bold text-boss-primary' : 'text-boss-text-secondary'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="font-boss-mono text-[10px] text-boss-text-muted">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* 예약 블록 — 시안: border #2e3250 / radius 8px / bg #1f2233 / hover accent */}
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
                        className="rounded-[8px] border border-boss-border-strong bg-boss-elevated px-[9px] py-2 text-left transition-colors duration-[120ms] ease-out hover:border-boss-primary"
                      >
                        <div className="flex items-center gap-1.5">
                          <Chip tone={chipToneOf(String(ev.eventType ?? 'appointment'))} size={16}>
                            {eventLabel(ev.eventType).charAt(0)}
                          </Chip>
                          <span className="font-boss-mono text-[10px] text-boss-text-tertiary">
                            {start
                              ? `${pad(start.getHours())}:${pad(start.getMinutes())}`
                              : '종일'}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[11.5px] font-semibold leading-[1.35] text-boss-text">
                          {ev.title || '제목 없음'}
                        </p>
                      </button>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-boss-text-muted">+{dayEvents.length - 2}건</p>
                  )}

                  {/* 빈 슬롯 — 클릭 시 해당 날짜로 등록 프리필 (시안 필수 인터랙션) */}
                  {dayEvents.length === 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreate(d);
                      }}
                      className="flex min-h-[34px] flex-1 items-center justify-center rounded-[8px] border border-dashed border-boss-border-soft text-[11px] text-boss-text-ghost transition-colors duration-[120ms] ease-out hover:border-boss-primary hover:text-boss-primary"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </ContentCard>

        {/* 우측 패널: 선택한 날짜 일정 */}
        <ContentCard>
          <CardHead
            title={`${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`}
            meta={WEEK_LABELS[selectedDate.getDay()]}
            count={selectedEvents.length > 0 ? `${selectedEvents.length}건` : undefined}
            countTone="accent"
          />
          <div className="p-[15px]">
          {selectedEvents.length === 0 ? (
            <DashedCta onClick={() => openCreate(selectedDate)}>
              <Plus size={12} /> 이 날짜에 일정 추가
            </DashedCta>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((ev) => {
                const start = parseBossDateTime(ev.startDate);
                const end = parseBossDateTime(ev.endDate);
                const pad = (n: number) => String(n).padStart(2, '0');
                const timeStr =
                  start && end
                    ? `${pad(start.getHours())}:${pad(start.getMinutes())} ~ ${pad(end.getHours())}:${pad(end.getMinutes())}`
                    : '시간 미정';
                return (
                  <li
                    key={ev.id}
                    className="rounded-xl border border-boss-border bg-boss-bg/40 p-3 transition-colors hover:border-boss-primary/20"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: eventColor(ev.eventType) }}
                      />
                      <span className="text-[10px] font-semibold text-boss-text-muted">
                        {eventLabel(ev.eventType)}
                      </span>
                      {ev.isrepeat && <Repeat size={10} className="text-boss-text-muted" />}
                      {ev.isreminder && <Bell size={10} className="text-boss-warning" />}
                    </div>
                    <h4 className="mb-1 truncate text-sm font-semibold text-boss-text">{ev.title || '제목 없음'}</h4>
                    <div className="space-y-1 text-[11px] text-boss-text-muted">
                      <div className="flex items-center gap-1">
                        <Clock size={10} /> {timeStr}
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin size={10} /> {ev.location}
                        </div>
                      )}
                      {ev.phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={10} /> {ev.phone}
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => openEdit(ev)}>
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Share2}
                        onClick={() => setShowShare(ev)}
                      >
                        공유
                      </Button>
                      <div className="flex-1" />
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(ev, false)}
                      >
                        삭제
                      </Button>
                      {ev.isrepeat && (
                        <Button variant="danger" size="sm" onClick={() => handleDelete(ev, true)}>
                          반복 전체
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-boss-border bg-boss-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-4">
          <h3 className="text-base font-semibold text-boss-text">
            {form.id ? '일정 수정' : '일정 등록'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted hover:bg-boss-surface hover:text-boss-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* 종류 */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">종류</label>
            <div className="flex gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onChange({ ...form, eventType: t.value })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    form.eventType === t.value
                      ? 'border-boss-primary/60 bg-boss-primary/10 text-boss-primary'
                      : 'border-boss-border bg-boss-surface text-boss-text-muted hover:text-boss-text'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">제목 *</label>
            <input
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="일정 제목"
              className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none"
            />
          </div>

          {/* 종일 */}
          <label className="flex items-center gap-2 text-xs text-boss-text-secondary">
            <input
              type="checkbox"
              checked={form.isAllDay}
              onChange={(e) => onChange({ ...form, isAllDay: e.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
            종일
          </label>

          {/* 시작 / 종료 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">시작일</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => onChange({ ...form, startDate: e.target.value })}
                className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">시작시간</label>
              <input
                type="time"
                value={form.startTime}
                disabled={form.isAllDay}
                onChange={(e) => onChange({ ...form, startTime: e.target.value })}
                className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none disabled:opacity-40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">종료일</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => onChange({ ...form, endDate: e.target.value })}
                className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">종료시간</label>
              <input
                type="time"
                value={form.endTime}
                disabled={form.isAllDay}
                onChange={(e) => onChange({ ...form, endTime: e.target.value })}
                className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none disabled:opacity-40"
              />
            </div>
          </div>

          {/* 위치 / 전화 */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">
              <MapPin size={12} className="-mt-0.5 mr-1 inline" /> 장소
            </label>
            <input
              value={form.location}
              onChange={(e) => onChange({ ...form, location: e.target.value })}
              placeholder="장소"
              className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">
              <Phone size={12} className="-mt-0.5 mr-1 inline" /> 전화
            </label>
            <input
              value={form.phone}
              onChange={(e) => onChange({ ...form, phone: e.target.value })}
              placeholder="010-0000-0000"
              className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none"
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">
              <AlignLeft size={12} className="-mt-0.5 mr-1 inline" /> 메모
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={3}
              placeholder="설명"
              className="w-full rounded-lg border border-boss-border bg-boss-surface px-3 py-2 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none"
            />
          </div>

          {/* 반복 / 알람 */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-surface p-3 text-xs text-boss-text-secondary">
              <input
                type="checkbox"
                checked={form.isRepeat}
                onChange={(e) => onChange({ ...form, isRepeat: e.target.checked })}
                className="h-4 w-4 accent-emerald-500"
              />
              <Repeat size={12} /> 반복
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-surface p-3 text-xs text-boss-text-secondary">
              <input
                type="checkbox"
                checked={form.isReminder}
                onChange={(e) => onChange({ ...form, isReminder: e.target.checked })}
                className="h-4 w-4 accent-emerald-500"
              />
              <Bell size={12} /> 알람
            </label>
          </div>
          {form.isRepeat && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">반복 종류</label>
              <select
                value={form.repeatType}
                onChange={(e) => onChange({ ...form, repeatType: e.target.value as RepeatType })}
                className="h-10 w-full rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none"
              >
                {REPEAT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-boss-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-boss-border bg-boss-surface px-4 py-2 text-xs font-semibold text-boss-text-secondary hover:text-boss-text"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-boss-primary px-4 py-2 text-xs font-semibold text-boss-text hover:bg-boss-primary-hover disabled:opacity-50"
          >
            <Save size={12} /> {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- 공유 모달 -----
function ShareModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const [users, setUsers] = useState<CalendarShareUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [receiveUserId, setReceiveUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!confirm('공유를 해제할까요?')) return;
    try {
      const res = await bossCalendarApi.deleteShare(customerId, userId);
      if (res.success) {
        toast.success('공유가 해제되었습니다.');
        await load();
      } else {
        toast.error(res.message || '해제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-boss-border bg-boss-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-boss-text">
            <Share2 size={16} className="text-boss-primary" /> 일정 공유
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted hover:bg-boss-surface hover:text-boss-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-boss-border bg-boss-surface p-3">
            <p className="text-xs text-boss-text-muted">대상 일정</p>
            <p className="text-sm font-semibold text-boss-text">{event.title || '제목 없음'}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-boss-text-muted">공유할 사용자 ID</label>
            <div className="flex gap-2">
              <input
                value={receiveUserId}
                onChange={(e) => setReceiveUserId(e.target.value)}
                placeholder="userId"
                className="h-10 flex-1 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleShare}
                disabled={submitting}
                className="rounded-lg bg-boss-primary px-4 text-xs font-semibold text-boss-text hover:bg-boss-primary-hover disabled:opacity-50"
              >
                공유
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-boss-text-muted">공유된 사용자</p>
            {loading ? (
              <p className="text-xs text-boss-text-muted">불러오는 중...</p>
            ) : users.length === 0 ? (
              <p className="rounded-lg border border-dashed border-boss-border bg-boss-bg/40 px-3 py-4 text-center text-xs text-boss-text-muted">
                공유된 사용자가 없습니다.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {users.map((u, idx) => (
                  <li
                    key={`${u.userId ?? u.id ?? idx}`}
                    className="flex items-center justify-between rounded-lg border border-boss-border bg-boss-surface px-3 py-2 text-xs text-boss-text-secondary"
                  >
                    <span>{u.userName ?? u.userId ?? u.receiveUserId ?? '-'}</span>
                    {(u.userId ?? u.receiveUserId) && (
                      <button
                        type="button"
                        onClick={() => handleRemove(u.userId ?? u.receiveUserId ?? '')}
                        className="rounded-md border border-boss-error/40 bg-boss-error/10 px-2 py-1 text-[10px] text-boss-error hover:bg-boss-error/10"
                      >
                        해제
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 미사용 임포트 방지
void formatBossDateTime;
