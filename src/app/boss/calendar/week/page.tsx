'use client';

// 사장님 주간 캘린더 — Flutter `week_view_page.dart` 대응
// 7일 × 24시간 그리드에서 이벤트를 절대배치한다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarRange,
  Bell,
  Repeat,
} from 'lucide-react';
import { bossCalendarApi, parseBossDateTime, formatBossDateTime } from '@/lib/api/boss/calendar';
import type { CalendarEvent } from '@/types/boss-calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48;
const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function eventColor(type?: string | null): string {
  if (type === 'estimate') return '#3b82f6';
  if (type === 'construction') return '#10b981';
  if (type === 'appointment') return '#a855f7';
  return '#64748b';
}

// 주의 시작(일요일)과 끝(토요일)
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

export default function BossCalendarWeekPage() {
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  // 주간 데이터: search API 사용 (startDate, endDate)
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = new Date(weekStart);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      const res = await bossCalendarApi.search({
        startDate: formatBossDateTime(start),
        endDate: formatBossDateTime(end),
      });
      if (res.success) {
        setEvents((res.data as CalendarEvent[] | undefined) ?? []);
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
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = useMemo(() => new Date(), []);

  // 요일별 배치된 이벤트
  const eventsByDay = useMemo(() => {
    const arr: { ev: CalendarEvent; top: number; height: number }[][] = Array.from(
      { length: 7 },
      () => [],
    );
    events.forEach((ev) => {
      const start = parseBossDateTime(ev.startDate);
      const end = parseBossDateTime(ev.endDate);
      if (!start) return;
      const dayIdx = weekDays.findIndex(
        (d) =>
          d.getFullYear() === start.getFullYear() &&
          d.getMonth() === start.getMonth() &&
          d.getDate() === start.getDate(),
      );
      if (dayIdx < 0) return;
      const startMin = start.getHours() * 60 + start.getMinutes();
      const endMin = end ? end.getHours() * 60 + end.getMinutes() : startMin + 60;
      arr[dayIdx].push({
        ev,
        top: (startMin / 60) * HOUR_HEIGHT,
        height: Math.max(20, ((endMin - startMin) / 60) * HOUR_HEIGHT),
      });
    });
    return arr;
  }, [events, weekDays]);

  const goPrev = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setAnchor(d);
  };
  const goNext = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setAnchor(d);
  };
  const goToday = () => setAnchor(new Date());

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <CalendarRange size={20} className="text-emerald-300" /> 주간 일정
          </h1>
          <p className="text-sm text-slate-400">한 주간의 일정을 시간대별로 확인하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:text-white"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/calendar"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:text-white"
          >
            월간
          </Link>
          <Link
            href="/boss/calendar/day"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:text-white"
          >
            일간
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-[220px] text-center text-lg font-semibold text-white">
            {weekStart.getFullYear()}.{weekStart.getMonth() + 1}.{weekStart.getDate()} ~{' '}
            {weekDays[6].getMonth() + 1}.{weekDays[6].getDate()}
          </h2>
          <button
            type="button"
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            이번주
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* 주간 그리드 */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-slate-800 bg-slate-900/60">
          <div />
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={i}
                className={`px-2 py-2 text-center text-xs font-semibold ${
                  i === 0 ? 'text-rose-300' : i === 6 ? 'text-sky-300' : 'text-slate-300'
                }`}
              >
                <div>{WEEK_LABELS[i]}</div>
                <div
                  className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                    isToday ? 'bg-emerald-500 text-white' : 'text-slate-200'
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 시간 + 일자 컬럼 */}
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="border-r border-slate-800 bg-slate-900/60 text-[10px] text-slate-500">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="-mt-2 pl-2 pt-1"
              >
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {weekDays.map((d, i) => (
            <div key={i} className="relative border-r border-slate-800/60">
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-slate-800/40"
                />
              ))}
              {eventsByDay[i].map(({ ev, top, height }, idx) => (
                <div
                  key={`${ev.id}-${idx}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: eventColor(ev.eventType) + '33',
                    borderLeftColor: eventColor(ev.eventType),
                  }}
                  className="absolute left-1 right-1 overflow-hidden rounded border-l-2 bg-slate-900 px-1 py-0.5 text-[10px]"
                  title={ev.title ?? ''}
                >
                  <div className="flex items-center gap-1">
                    {ev.isrepeat && <Repeat size={8} className="text-slate-500" />}
                    {ev.isreminder && <Bell size={8} className="text-amber-300" />}
                    <span className="truncate font-semibold text-white">
                      {ev.title || '제목 없음'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
