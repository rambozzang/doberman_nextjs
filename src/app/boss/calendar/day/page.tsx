'use client';

// 사장님 일별 일정 — Industry 패턴 (agent.opentohome.com)
// Flutter `day_view_page.dart` 대응. 24시간 세로 그리드에 그날 일정을 절대배치한다.
//
//   상단 : ‹ › + 날짜(Barlow Condensed) + 오늘 + 날짜 입력 · 우측 보기 전환(월간/주간/일간) + 새로고침
//   본문 : 패널 안 시간 열(11px 숫자) + 일정 블록(사각 · 좌측 3px 종류 색 · Tag 색쌍 배경)
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MapPin,
  Phone,
  Bell,
  Repeat,
} from 'lucide-react';
import {
  AlertBanner,
  Button,
  ButtonLink,
  ContentCard,
  Segmented,
  type StatusTone,
} from '@/components/boss/ui';
import { bossCalendarApi, parseBossDateTime, formatLocalDate } from '@/lib/api/boss/calendar';
import type { CalendarEvent } from '@/types/boss-calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 종류 → Tag 색쌍 (월간 화면과 같은 매핑)
function eventTone(type?: string | null): StatusTone {
  if (type === 'estimate') return 'info';
  if (type === 'construction') return 'ok';
  return 'neutral';
}

function eventLabel(type?: string | null): string {
  if (type === 'estimate') return '견적';
  if (type === 'construction') return '시공';
  if (type === 'appointment') return '일정';
  return '기타';
}

// 블록 색 — 배경은 Tag 색쌍, 좌측 선은 시맨틱 색
const BLOCK_CLS: Record<StatusTone, string> = {
  ok: 'bg-boss-pill-ok text-boss-pill-ok-fg border-l-boss-success',
  warn: 'bg-boss-pill-warn text-boss-pill-warn-fg border-l-boss-warning',
  bad: 'bg-boss-pill-bad text-boss-pill-bad-fg border-l-boss-error',
  neutral: 'bg-boss-inset text-boss-text border-l-boss-text-ghost',
  info: 'bg-boss-pill-info text-boss-pill-info-fg border-l-boss-primary',
};

export default function BossCalendarDayPage() {
  const router = useRouter();
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

  const today = new Date();
  const isToday =
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate();

  return (
    <div className="flex flex-col gap-3.5">
      {/* 상단 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex">
          <Button variant="secondary" size="sm" onClick={goPrev} aria-label="전날">
            <ChevronLeft size={13} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goNext} aria-label="다음 날" className="-ml-px">
            <ChevronRight size={13} />
          </Button>
        </div>
        <h2 className="whitespace-nowrap font-boss-head text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-boss-text">
          {date.getFullYear()}.{date.getMonth() + 1}.{date.getDate()}{' '}
          <span className="text-[15px] font-medium text-boss-text-secondary">
            {WEEK_LABELS[date.getDay()]}
            {isToday ? ' · 오늘' : ''}
          </span>
        </h2>
        <Button variant="secondary" size="sm" onClick={goToday}>
          오늘
        </Button>
        <input
          type="date"
          aria-label="날짜 선택"
          value={dateKey}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            setDate(new Date(y, (m ?? 1) - 1, d ?? 1));
          }}
          className="boss-input !h-[30px] !w-auto text-[12.5px]"
        />
        <div className="flex-1" />
        <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : `${positioned.length}건`}
        </span>
        <Segmented
          ariaLabel="보기 전환"
          value="day"
          onChange={(k) => {
            if (k === 'month') router.push('/boss/calendar');
            if (k === 'week') router.push('/boss/calendar/week');
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

      {/* 24시간 타임라인 */}
      <ContentCard>
        <div className="relative flex">
          {/* 시간 열 */}
          <div className="w-14 shrink-0 border-r border-boss-border bg-boss-inset font-boss-head text-[11px] tabular-nums text-boss-text-muted">
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
          {/* 일정 영역 */}
          <div className="relative flex-1">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-boss-border-row last:border-b-0"
              />
            ))}
            {positioned.map(({ ev, top, height, start, end }, idx) => {
              const pad = (n: number) => String(n).padStart(2, '0');
              const timeStr =
                start && end
                  ? `${pad(start.getHours())}:${pad(start.getMinutes())} ~ ${pad(end.getHours())}:${pad(end.getMinutes())}`
                  : '';
              const tone = eventTone(ev.eventType);
              return (
                <div
                  key={`${ev.id}-${idx}`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  className={`absolute left-2 right-2 overflow-hidden border-l-[3px] px-2.5 py-1.5 text-[12px] ${BLOCK_CLS[tone]}`}
                  title={ev.title ?? ''}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] opacity-80">
                      {eventLabel(ev.eventType)}
                    </span>
                    <span className="font-boss-head text-[11px] tabular-nums opacity-80">{timeStr}</span>
                    {ev.isrepeat && <Repeat size={10} aria-label="반복" />}
                    {ev.isreminder && <Bell size={10} aria-label="알림" />}
                  </div>
                  <div className="truncate text-[13.5px] font-semibold">{ev.title || '제목 없음'}</div>
                  {(ev.location || ev.phone) && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] opacity-80">
                      {ev.location && (
                        <span className="flex min-w-0 items-center gap-1 truncate">
                          <MapPin size={10} /> {ev.location}
                        </span>
                      )}
                      {ev.phone && (
                        <span className="flex items-center gap-1 font-boss-head tabular-nums">
                          <Phone size={10} /> {ev.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && positioned.length === 0 && (
              <div className="absolute inset-x-0 top-0 flex h-[224px] items-center justify-center text-[13px] text-boss-text-secondary">
                불러오는 중…
              </div>
            )}
            {positioned.length === 0 && !loading && !error && (
              <div className="absolute inset-x-0 top-0 flex h-[224px] flex-col items-center justify-center gap-3 text-center">
                <p className="text-[13px] text-boss-text-secondary">
                  {isToday ? '오늘' : '이 날'}은 잡힌 일정이 없습니다.
                </p>
                <ButtonLink href="/boss/calendar" variant="secondary" size="sm">
                  월간 화면에서 등록
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </ContentCard>
    </div>
  );
}
