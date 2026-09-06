'use client';

// 사장님 주간 일정 — Industry 패턴 (agent.opentohome.com)
// Flutter `week_view_page.dart` 대응. 7일 × 24시간 그리드에 일정을 절대배치한다.
//
//   상단 : ‹ › + 주 범위(Barlow Condensed) + 이번 주 · 우측 보기 전환(월간/주간/일간) + 새로고침
//   본문 : 패널 안 요일 헤더(TH 조판 · 오늘 열 accent-100) + 시간 열 + 사각 일정 블록
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RefreshCw, Bell, Repeat } from 'lucide-react';
import {
  AlertBanner,
  Button,
  ContentCard,
  Segmented,
  type StatusTone,
} from '@/components/boss/ui';
import { bossCalendarApi, parseBossDateTime, formatBossDateTime } from '@/lib/api/boss/calendar';
import type { CalendarEvent } from '@/types/boss-calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48;
const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 종류 → Tag 색쌍 (월간 화면과 같은 매핑)
function eventTone(type?: string | null): StatusTone {
  if (type === 'estimate') return 'info';
  if (type === 'construction') return 'ok';
  return 'neutral';
}

const BLOCK_CLS: Record<StatusTone, string> = {
  ok: 'bg-boss-pill-ok text-boss-pill-ok-fg border-l-boss-success',
  warn: 'bg-boss-pill-warn text-boss-pill-warn-fg border-l-boss-warning',
  bad: 'bg-boss-pill-bad text-boss-pill-bad-fg border-l-boss-error',
  neutral: 'bg-boss-inset text-boss-text border-l-boss-text-ghost',
  info: 'bg-boss-pill-info text-boss-pill-info-fg border-l-boss-primary',
};

// 주의 시작(일요일)과 끝(토요일)
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

export default function BossCalendarWeekPage() {
  const router = useRouter();
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

  const placedCount = eventsByDay.reduce((n, list) => n + list.length, 0);

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
    <div className="flex flex-col gap-3.5">
      {/* 상단 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex">
          <Button variant="secondary" size="sm" onClick={goPrev} aria-label="지난주">
            <ChevronLeft size={13} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goNext} aria-label="다음 주" className="-ml-px">
            <ChevronRight size={13} />
          </Button>
        </div>
        <h2 className="whitespace-nowrap font-boss-head text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-boss-text">
          {weekStart.getFullYear()}.{weekStart.getMonth() + 1}.{weekStart.getDate()} ~{' '}
          {weekDays[6].getMonth() + 1}.{weekDays[6].getDate()}
        </h2>
        <Button variant="secondary" size="sm" onClick={goToday}>
          이번 주
        </Button>
        <div className="flex-1" />
        <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : `이번 주 ${placedCount}건`}
        </span>
        <Segmented
          ariaLabel="보기 전환"
          value="week"
          onChange={(k) => {
            if (k === 'month') router.push('/boss/calendar');
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

      {/* 주간 그리드 */}
      <ContentCard>
        {/* 요일 헤더 — TH 조판. 오늘 열은 accent-100 */}
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-boss-border bg-boss-inset">
          <div className="border-r border-boss-border" />
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={i}
                className={`px-1 py-2 text-center ${isToday ? 'bg-boss-elevated' : ''}`}
              >
                <div
                  className={`text-[11px] font-semibold tracking-[0.08em] ${
                    isToday
                      ? 'text-boss-primary'
                      : i === 0
                        ? 'text-boss-error'
                        : i === 6
                          ? 'text-boss-info'
                          : 'text-boss-text-secondary'
                  }`}
                >
                  {WEEK_LABELS[i]}
                </div>
                <div
                  className={`mt-0.5 font-boss-head text-[15px] font-semibold tabular-nums leading-none ${
                    isToday ? 'text-boss-primary' : 'text-boss-text'
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
          <div className="border-r border-boss-border bg-boss-inset font-boss-head text-[10.5px] tabular-nums text-boss-text-muted">
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
            <div
              key={i}
              className={`relative border-r border-boss-border-row last:border-r-0 ${
                isSameDay(d, today) ? 'bg-boss-elevated/40' : ''
              }`}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-boss-border-row last:border-b-0"
                />
              ))}
              {eventsByDay[i].map(({ ev, top, height }, idx) => (
                <div
                  key={`${ev.id}-${idx}`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  className={`absolute left-1 right-1 overflow-hidden border-l-[3px] px-1.5 py-0.5 text-[10.5px] ${BLOCK_CLS[eventTone(ev.eventType)]}`}
                  title={ev.title ?? ''}
                >
                  <div className="flex items-center gap-1">
                    {ev.isrepeat && <Repeat size={8} aria-label="반복" />}
                    {ev.isreminder && <Bell size={8} aria-label="알림" />}
                    <span className="truncate font-semibold">{ev.title || '제목 없음'}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ContentCard>

      {!loading && !error && placedCount === 0 && (
        <p className="text-center text-[12.5px] text-boss-text-secondary">
          이번 주에 잡힌 일정이 없습니다. 월간 화면에서 날짜를 골라 등록하세요.
        </p>
      )}
    </div>
  );
}
