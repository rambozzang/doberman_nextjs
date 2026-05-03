'use client';

// 사장님 월간 캘린더 페이지
// Flutter `lib/app/table_calendar/table_calendar_page.dart` + add/view bottom sheet 의 핵심 기능을 통합한다.
// 외부 캘린더 라이브러리를 사용하지 않고 Tailwind CSS Grid 로 직접 그린다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
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
  { value: 'estimate', label: '견적', color: '#3b82f6' },
  { value: 'construction', label: '시공', color: '#10b981' },
  { value: 'appointment', label: '일정', color: '#a855f7' },
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
  return found?.color ?? '#64748b';
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
function formToCreate(form: FormState): CalendarCreateRequest {
  const startDateTime = `${form.startDate.replace(/-/g, '')}${form.startTime.replace(':', '')}`;
  const endDateTime = `${form.endDate.replace(/-/g, '')}${form.endTime.replace(':', '')}`;
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
    startTime: form.startTime,
    endTime: form.endTime,
    isallday: form.isAllDay,
    isreminder: form.isReminder,
    isrepeat: form.isRepeat,
    color: eventColor(form.eventType),
    repeatData: repeat,
  };
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
  const [keyword, setKeyword] = useState('');

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
    setSaving(true);
    try {
      const payload = formToCreate(form);
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
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">일정 캘린더</h1>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {events.length.toLocaleString()}건
            </span>
          </div>
          <p className="text-sm text-slate-400">월별 견적/시공/일정을 한눈에 관리하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="제목 검색"
              className="h-9 w-48 rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/calendar/week"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            주간
          </Link>
          <Link
            href="/boss/calendar/day"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            일간
          </Link>
          <Link
            href="/boss/calendar/alarm"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <Bell size={14} /> 알람
          </Link>
          <button
            type="button"
            onClick={() => openCreate(selectedDate)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            <Plus size={14} /> 일정 등록
          </button>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-[140px] text-center text-lg font-semibold text-white">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </h2>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="ml-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white"
          >
            오늘
          </button>
        </div>
        <div className="hidden items-center gap-3 text-xs text-slate-400 md:flex">
          {EVENT_TYPES.map((t) => (
            <span key={t.value} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 캘린더 그리드 */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {WEEK_LABELS.map((w, i) => (
                <div
                  key={w}
                  className={`px-2 py-2 text-center ${
                    i === 0 ? 'text-rose-300' : i === 6 ? 'text-sky-300' : ''
                  }`}
                >
                  {w}
                </div>
              ))}
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
                const dow = d.getDay();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    onDoubleClick={() => openCreate(d)}
                    className={`group relative flex min-h-[96px] flex-col border-b border-r border-slate-800 p-1.5 text-left transition-colors ${
                      inMonth ? 'bg-slate-900/30' : 'bg-slate-950/40'
                    } ${isSelected ? 'ring-2 ring-inset ring-emerald-500/60' : ''} hover:bg-slate-800/40`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isToday
                            ? 'bg-emerald-500 text-white'
                            : inMonth
                              ? dow === 0
                                ? 'text-rose-300'
                                : dow === 6
                                  ? 'text-sky-300'
                                  : 'text-slate-200'
                              : 'text-slate-600'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-slate-500">{dayEvents.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: eventColor(ev.eventType) + 'cc' }}
                          title={ev.title ?? ''}
                        >
                          {ev.title || '제목 없음'}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-slate-500">+{dayEvents.length - 3}건</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측 패널: 선택한 날짜 일정 */}
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays size={14} className="text-emerald-300" />
              {selectedDate.getFullYear()}.{selectedDate.getMonth() + 1}.{selectedDate.getDate()} 일정
            </h3>
            <button
              type="button"
              onClick={() => openCreate(selectedDate)}
              className="flex h-7 items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white"
            >
              <Plus size={12} /> 추가
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-3 py-6 text-center text-xs text-slate-500">
              등록된 일정이 없습니다.
            </p>
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
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-emerald-500/40"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: eventColor(ev.eventType) }}
                      />
                      <span className="text-[10px] font-semibold text-slate-400">
                        {eventLabel(ev.eventType)}
                      </span>
                      {ev.isrepeat && <Repeat size={10} className="text-slate-500" />}
                      {ev.isreminder && <Bell size={10} className="text-amber-300" />}
                    </div>
                    <h4 className="mb-1 truncate text-sm font-semibold text-white">{ev.title || '제목 없음'}</h4>
                    <div className="space-y-1 text-[11px] text-slate-400">
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
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-300 hover:text-white"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowShare(ev)}
                        className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-300 hover:text-white"
                      >
                        <Share2 size={10} /> 공유
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev, false)}
                        className="ml-auto flex items-center gap-1 rounded-md border border-rose-800/40 bg-rose-950/40 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-900/40"
                      >
                        <Trash2 size={10} /> 삭제
                      </button>
                      {ev.isrepeat && (
                        <button
                          type="button"
                          onClick={() => handleDelete(ev, true)}
                          className="rounded-md border border-rose-800/40 bg-rose-950/40 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-900/40"
                        >
                          반복전체삭제
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
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
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h3 className="text-base font-semibold text-white">
            {form.id ? '일정 수정' : '일정 등록'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* 종류 */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">종류</label>
            <div className="flex gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onChange({ ...form, eventType: t.value })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    form.eventType === t.value
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">제목 *</label>
            <input
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="일정 제목"
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* 종일 */}
          <label className="flex items-center gap-2 text-xs text-slate-300">
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
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">시작일</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => onChange({ ...form, startDate: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">시작시간</label>
              <input
                type="time"
                value={form.startTime}
                disabled={form.isAllDay}
                onChange={(e) => onChange({ ...form, startTime: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none disabled:opacity-40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">종료일</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => onChange({ ...form, endDate: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">종료시간</label>
              <input
                type="time"
                value={form.endTime}
                disabled={form.isAllDay}
                onChange={(e) => onChange({ ...form, endTime: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none disabled:opacity-40"
              />
            </div>
          </div>

          {/* 위치 / 전화 */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              <MapPin size={12} className="-mt-0.5 mr-1 inline" /> 장소
            </label>
            <input
              value={form.location}
              onChange={(e) => onChange({ ...form, location: e.target.value })}
              placeholder="장소"
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              <Phone size={12} className="-mt-0.5 mr-1 inline" /> 전화
            </label>
            <input
              value={form.phone}
              onChange={(e) => onChange({ ...form, phone: e.target.value })}
              placeholder="010-0000-0000"
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              <AlignLeft size={12} className="-mt-0.5 mr-1 inline" /> 메모
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={3}
              placeholder="설명"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* 반복 / 알람 */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.isRepeat}
                onChange={(e) => onChange({ ...form, isRepeat: e.target.checked })}
                className="h-4 w-4 accent-emerald-500"
              />
              <Repeat size={12} /> 반복
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
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
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">반복 종류</label>
              <select
                value={form.repeatType}
                onChange={(e) => onChange({ ...form, repeatType: e.target.value as RepeatType })}
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
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

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
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
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Share2 size={16} className="text-emerald-300" /> 일정 공유
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">대상 일정</p>
            <p className="text-sm font-semibold text-white">{event.title || '제목 없음'}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">공유할 사용자 ID</label>
            <div className="flex gap-2">
              <input
                value={receiveUserId}
                onChange={(e) => setReceiveUserId(e.target.value)}
                placeholder="userId"
                className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleShare}
                disabled={submitting}
                className="rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
              >
                공유
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-400">공유된 사용자</p>
            {loading ? (
              <p className="text-xs text-slate-500">불러오는 중...</p>
            ) : users.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-3 py-4 text-center text-xs text-slate-500">
                공유된 사용자가 없습니다.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {users.map((u, idx) => (
                  <li
                    key={`${u.userId ?? u.id ?? idx}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"
                  >
                    <span>{u.userName ?? u.userId ?? u.receiveUserId ?? '-'}</span>
                    {(u.userId ?? u.receiveUserId) && (
                      <button
                        type="button"
                        onClick={() => handleRemove(u.userId ?? u.receiveUserId ?? '')}
                        className="rounded-md border border-rose-800/40 bg-rose-950/40 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-900/40"
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
