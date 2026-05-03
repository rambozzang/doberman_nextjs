'use client';

// 사장님 일정 알람 — Flutter `alram_page.dart` 대응
// 알람(isreminder=true)이 설정된 이벤트만 모아 보여준다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Bell,
  RefreshCw,
  Clock,
  MapPin,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { bossCalendarApi, parseBossDateTime } from '@/lib/api/boss/calendar';
import type { CalendarEvent } from '@/types/boss-calendar';

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

function formatYyyyMM(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}`;
}

export default function BossCalendarAlarmPage() {
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 월간 데이터에서 isreminder 필터링
      const res = await bossCalendarApi.getMonth(formatYyyyMM(cursor), 1);
      if (res.success) {
        setEvents((res.data as CalendarEvent[] | undefined) ?? []);
      } else {
        setError(res.message || '알람을 불러오지 못했습니다.');
        setEvents([]);
      }
    } catch {
      setError('네트워크 오류로 알람을 불러오지 못했습니다.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    void load();
  }, [load]);

  const alarms = useMemo(() => {
    return events
      .filter((ev) => ev.isreminder === true)
      .map((ev) => ({ ev, start: parseBossDateTime(ev.startDate) }))
      .filter((x): x is { ev: CalendarEvent; start: Date } => x.start !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events]);

  const handleDelete = async (ev: CalendarEvent) => {
    if (!confirm('알람이 설정된 일정을 삭제할까요?')) return;
    try {
      const res = await bossCalendarApi.delete(ev.id);
      if (res.success) {
        toast.success('삭제되었습니다.');
        await load();
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    }
  };

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <Bell size={20} className="text-amber-300" /> 일정 알람
          </h1>
          <p className="text-sm text-slate-400">알람이 설정된 일정 목록입니다.</p>
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
            <CalendarDays size={14} /> 캘린더
          </Link>
        </div>
      </div>

      {/* 월 네비 */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-[140px] text-center text-lg font-semibold text-white">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </h2>
          <button
            type="button"
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
          알람 {alarms.length}건
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {alarms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-slate-200">등록된 알람이 없습니다.</p>
          <p className="mt-1 text-xs text-slate-500">캘린더에서 일정을 등록할 때 알람을 켜보세요.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alarms.map(({ ev, start }) => {
            const end = parseBossDateTime(ev.endDate);
            const pad = (n: number) => String(n).padStart(2, '0');
            const dateStr = `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())}`;
            const timeStr = end
              ? `${pad(start.getHours())}:${pad(start.getMinutes())} ~ ${pad(end.getHours())}:${pad(end.getMinutes())}`
              : `${pad(start.getHours())}:${pad(start.getMinutes())}`;
            return (
              <li
                key={ev.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-amber-500/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <Bell size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: eventColor(ev.eventType) }}
                      />
                      <span className="text-[10px] font-semibold text-slate-400">
                        {eventLabel(ev.eventType)}
                      </span>
                      <span className="text-[10px] text-slate-500">#{ev.id}</span>
                    </div>
                    <h3 className="mb-1 truncate text-sm font-semibold text-white">
                      {ev.title || '제목 없음'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} /> {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {timeStr}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={11} /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev)}
                    className="rounded-md border border-rose-800/40 bg-rose-950/40 px-3 py-1.5 text-[11px] text-rose-200 hover:bg-rose-900/40"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
