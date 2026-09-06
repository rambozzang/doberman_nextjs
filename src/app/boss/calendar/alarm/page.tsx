'use client';

// 사장님 일정 알림 — Industry 패턴 (agent.opentohome.com)
// Flutter `alram_page.dart` 대응. 월간 일정 중 알림(isreminder=true)을 켠 것만 표로 모아 본다.
//
//   상단 : ‹ › + 월(Barlow Condensed) · 우측 "알림 n건" + 일정으로 + 새로고침
//   본문 : 표 — 종류 Tag · 제목 · 날짜 · 시간 · 장소 · 삭제(ghost)
//   삭제는 ConfirmDialog. 첫 조회 실패(AlertBanner + 다시 시도)와 0건(안내 + 다음 행동)을 구분한다.
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertBanner,
  Button,
  ButtonLink,
  ConfirmDialog,
  DataTable,
  EmptyState,
  RowSkeleton,
  ContentCard,
  Tag,
  type StatusTone,
} from '@/components/boss/ui';
import { bossCalendarApi, parseBossDateTime } from '@/lib/api/boss/calendar';
import type { CalendarEvent } from '@/types/boss-calendar';

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

function formatYyyyMM(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}`;
}

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function BossCalendarAlarmPage() {
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setDeleting(true);
    try {
      const res = await bossCalendarApi.delete(ev.id);
      if (res.success) {
        toast.success('삭제되었습니다.');
        setPendingDelete(null);
        await load();
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setDeleting(false);
    }
  };

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex flex-col gap-3.5">
      {/* 상단 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex">
          <Button variant="secondary" size="sm" onClick={goPrev} aria-label="이전 달">
            <ChevronLeft size={13} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goNext} aria-label="다음 달" className="-ml-px">
            <ChevronRight size={13} />
          </Button>
        </div>
        <h2 className="whitespace-nowrap font-boss-head text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-boss-text">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </h2>
        <div className="flex-1" />
        <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : `알림 ${alarms.length}건`}
        </span>
        <ButtonLink href="/boss/calendar" variant="secondary" size="sm">
          일정으로
        </ButtonLink>
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

      {loading && events.length === 0 ? (
        <ContentCard>
          <RowSkeleton rows={5} />
        </ContentCard>
      ) : alarms.length === 0 ? (
        error ? null : (
          <EmptyState
            icon={Bell}
            title={`${cursor.getMonth() + 1}월에 알림을 켠 일정이 없습니다`}
            description="일정을 등록하거나 수정할 때 '일정 전 알림' 을 켜면 여기에 모입니다."
            action={
              <ButtonLink href="/boss/calendar" variant="primary" size="sm">
                일정 등록하러 가기
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>종류</th>
              <th>제목</th>
              <th>날짜</th>
              <th>시간</th>
              <th>장소</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {alarms.map(({ ev, start }) => {
              const end = parseBossDateTime(ev.endDate);
              const dateStr = `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())}`;
              const timeStr = ev.isallday
                ? '종일'
                : end
                  ? `${pad(start.getHours())}:${pad(start.getMinutes())} ~ ${pad(end.getHours())}:${pad(end.getMinutes())}`
                  : `${pad(start.getHours())}:${pad(start.getMinutes())}`;
              return (
                <tr key={ev.id}>
                  <td>
                    <Tag tone={eventTone(ev.eventType)}>{eventLabel(ev.eventType)}</Tag>
                  </td>
                  <td className="wrap max-w-[320px]">
                    <span className="line-clamp-2 font-medium text-boss-text">
                      {ev.title || '제목 없음'}
                    </span>
                  </td>
                  <td className="font-boss-head tabular-nums">
                    {dateStr}{' '}
                    <span className="text-boss-text-muted">({WEEK_LABELS[start.getDay()]})</span>
                  </td>
                  <td className="font-boss-head tabular-nums">{timeStr}</td>
                  <td className="wrap max-w-[260px] text-boss-text-secondary">
                    <span className="line-clamp-1">{ev.location || '—'}</span>
                  </td>
                  <td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!text-boss-text-muted hover:!text-boss-error"
                      onClick={() => setPendingDelete(ev)}
                    >
                      삭제
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="알림이 켜진 일정을 삭제할까요?"
        description={`${pendingDelete?.title || '제목 없음'} — 알림만 끄려면 일정 화면에서 수정하세요. 삭제한 일정은 되돌릴 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete);
        }}
      />
    </div>
  );
}
