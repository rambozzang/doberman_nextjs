'use client';

// 사장님 일간 캘린더 — Flutter `day_view_page.dart` 대응
// 24시간 시간대를 세로 grid 로 그리고, 해당 날짜의 이벤트를 시간대 위치에 절대배치한다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Bell,
  Repeat,
} from 'lucide-react';
import { bossCalendarApi, parseBossDateTime, formatLocalDate } from '@/lib/api/boss/calendar';
import type { CalendarEvent } from '@/types/boss-calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function eventColor(type?: string | null): string {
  if (type === 'estimate') return '#3b82f6';
  if (type === 'construction') return '#10b981';
  if (type === 'appointment') return '#a855f7';
  return '#64748b';
}

function eventLabel(type?: string | null): string {
  if (type === 'estimate') return '견적';
  if (type === 'construction') return '시공';
  if (type === 'appointment') return '일정';
  return '기타';
}

export default function BossCalendarDayPage() {
  const [date, setDate] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateKey = useMemo(() => formatLocalDate(date), [date]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // searchDataByDate는 yyyyMMdd 형식으로 보낸다
      const yyyymmdd = dateKey.replace(/-/g, '');
      const res = await bossCalendarApi.searchByDate(yyyymmdd);
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
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  // 시간 위치(분 → px)
  const HOUR_HEIGHT = 56;

  // 이벤트를 시간 슬롯에 매핑
  const positioned = useMemo(() => {
    return events
      .map((ev) => {
        const start = parseBossDateTime(ev.startDate);
        const end = parseBossDateTime(ev.endDate);
        if (!start) return null;
        const sameDay =
          start.getFullYear() === date.getFullYear() &&
          start.getMonth() === date.getMonth() &&
          start.getDate() === date.getDate();
        if (!sameDay) return null;
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end
          ? end.getHours() * 60 + end.getMinutes()
          : startMin + 60;
        const top = (startMin / 60) * HOUR_HEIGHT;
        const height = Math.max(28, ((endMin - startMin) / 60) * HOUR_HEIGHT);
        return { ev, top, height, start, end };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [events, date]);

  const goPrev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };
  const goNext = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };
  const goToday = () => setDate(new Date());

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <CalendarDays size={20} className="text-emerald-300" /> 일간 일정
          </h1>
          <p className="text-sm text-slate-400">하루 단위로 시간대별 일정을 확인하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/calendar"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            월간
          </Link>
          <Link
            href="/boss/calendar/week"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            주간
          </Link>
        </div>
      </div>

      {/* 날짜 네비게이션 */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-[180px] text-center text-lg font-semibold text-white">
            {date.getFullYear()}.{date.getMonth() + 1}.{date.getDate()} (
            {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})
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
            오늘
          </button>
        </div>
        <input
          type="date"
          value={dateKey}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            setDate(new Date(y, (m ?? 1) - 1, d ?? 1));
          }}
          className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* 24시간 타임라인 */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="relative flex">
          {/* 시간 컬럼 */}
          <div className="w-14 shrink-0 border-r border-slate-800 bg-slate-900/60 text-xs text-slate-500">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="relative -mt-2 pl-2 pt-1"
              >
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {/* 이벤트 영역 */}
          <div className="relative flex-1">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-slate-800/60"
              />
            ))}
            {positioned.map(({ ev, top, height, start, end }, idx) => {
              const pad = (n: number) => String(n).padStart(2, '0');
              const timeStr =
                start && end
                  ? `${pad(start.getHours())}:${pad(start.getMinutes())} ~ ${pad(end.getHours())}:${pad(end.getMinutes())}`
                  : '';
              return (
                <div
                  key={`${ev.id}-${idx}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: eventColor(ev.eventType) + '20',
                    borderLeftColor: eventColor(ev.eventType),
                  }}
                  className="absolute left-2 right-2 overflow-hidden rounded-lg border-l-4 border-slate-800 bg-slate-900 p-2 text-xs"
                >
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {eventLabel(ev.eventType)}
                    </span>
                    {ev.isrepeat && <Repeat size={10} className="text-slate-500" />}
                    {ev.isreminder && <Bell size={10} className="text-amber-300" />}
                  </div>
                  <div className="truncate text-sm font-semibold text-white">
                    {ev.title || '제목 없음'}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={9} /> {timeStr}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={9} /> {ev.location}
                      </span>
                    )}
                    {ev.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={9} /> {ev.phone}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {positioned.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                등록된 일정이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
