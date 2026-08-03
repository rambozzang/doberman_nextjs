'use client';

// 사장님 대시보드 — onGo 리디자인 시안 `오늘` 화면
//
// 시안 구조를 도배 업무로 매핑
//   발행 큐        → 오늘의 일감 타임라인 (GET /calendar/searchDataByDate)
//   확인 필요      → 수금 대기 · 취소 · 진행 중 시공
//   채널 상태      → 이번 달 진행 현황 (견적 → 계약 → 완료)
//   일별 조회 차트 → 월별 수금 막대 차트 (순수 CSS, 상위 10% accent)
//
// 레이아웃: KPI 4장 → 2열 minmax(0,1.55fr) minmax(0,1fr) → 전체폭 차트
// 세로 gap 18px, KPI gap 10px, 2열 gap 14px

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, RefreshCw, Plus, CalendarDays } from 'lucide-react';
import { bossStatsApi, buildRecentMonthsParams } from '@/lib/api/boss/stats';
import { bossCalendarApi } from '@/lib/api/boss/calendar';
import type { BossMonthlyStat, BossCurrentMonthStats } from '@/types/boss-stats';
import type { CalendarEvent } from '@/types/boss-calendar';
import {
  ContentCard,
  CardHead,
  Row,
  StatCard,
  StatusPill,
  Chip,
  TagPill,
  Button,
  AlertBanner,
  AttentionItem,
  DashedCta,
  MetricBox,
  BarChart,
  EmptyState,
  RowSkeleton,
  type StatusTone,
  type ChipTone,
} from '@/components/boss/ui';

// ───────────────────────────────────────────
// 헬퍼
// ───────────────────────────────────────────
function extractList(data: unknown): BossMonthlyStat[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as BossMonthlyStat[];
  const obj = data as { list?: BossMonthlyStat[]; content?: BossMonthlyStat[] };
  return obj.list ?? obj.content ?? [];
}

function rowLabel(row: BossMonthlyStat): string {
  if (row.yearMonth) {
    const ym = row.yearMonth.replace('-', '');
    if (ym.length >= 6) return `${Number(ym.substring(4, 6))}월`;
  }
  if (row.month) return `${row.month}월`;
  return '-';
}

function fmtWonShort(n?: number): string {
  if (n == null || n === 0) return '₩0';
  if (n >= 100_000_000) return `₩${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `₩${Math.round(n / 10_000).toLocaleString('ko-KR')}만`;
  return `₩${n.toLocaleString('ko-KR')}`;
}

function calcDelta(current?: number, prev?: number): number | undefined {
  if (current == null || prev == null || prev === 0) return undefined;
  return ((current - prev) / prev) * 100;
}

/** 백엔드는 yyyyMMddHHmm 문자열로 내려준다 */
function eventTime(raw?: string | null): string {
  if (!raw || raw.length < 12) return '—';
  return `${raw.substring(8, 10)}:${raw.substring(10, 12)}`;
}

function eventSortKey(e: CalendarEvent): string {
  return e.startDate ?? '999999999999';
}

const EVENT_META: Record<string, { label: string; short: string; tone: ChipTone }> = {
  estimate: { label: '견적', short: '견', tone: 'blue' },
  construction: { label: '시공', short: '시', tone: 'green' },
  appointment: { label: '일정', short: '일', tone: 'gray' },
};

function eventMeta(type?: string | null) {
  return EVENT_META[String(type ?? '')] ?? { label: '일정', short: '일', tone: 'gray' as ChipTone };
}

function todayStamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/** 현재 시각을 백엔드와 같은 yyyyMMddHHmm 형식으로 — 일정의 진행/완료 판정에 쓴다 */
function nowStamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${todayStamp(d)}${p(d.getHours())}${p(d.getMinutes())}`;
}

type EventState = { label: string; tone: StatusTone };

function eventState(ev: CalendarEvent, now: string): EventState {
  const start = ev.startDate ?? '';
  const end = ev.endDate ?? start;
  if (end && end < now) return { label: '완료', tone: 'neutral' };
  if (start && start <= now) return { label: '진행 중', tone: 'warn' };
  return { label: '예정', tone: 'ok' };
}

// ───────────────────────────────────────────
// 페이지
// ───────────────────────────────────────────
export default function BossDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<BossMonthlyStat[]>([]);
  const [current, setCurrent] = useState<BossCurrentMonthStats | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const today = useMemo(() => new Date(), []);
  const now = useMemo(() => nowStamp(today), [today]);
  const todayLabel = today.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, cRes] = await Promise.all([
        bossStatsApi.monthly(buildRecentMonthsParams(7)),
        bossStatsApi.current(),
      ]);
      if (mRes.success === false) {
        const msg = mRes.error || mRes.message || '월별 통계를 불러오지 못했습니다.';
        setError(msg);
        setMonthly([]);
      } else {
        setMonthly(extractList(mRes.data));
      }
      if (cRes.success === false) {
        const msg = cRes.error || cRes.message || '현재월 통계를 불러오지 못했습니다.';
        setError((prev) => prev ?? msg);
        setCurrent(null);
      } else {
        setCurrent(cRes.data ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await bossCalendarApi.searchByDate(todayStamp(today));
      if (res.success && Array.isArray(res.data)) {
        setEvents([...res.data].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b))));
      } else {
        setEvents([]);
      }
    } catch {
      // 일정 조회 실패는 통계와 분리한다 — 대시보드 전체를 막지 않는다
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [today]);

  const reload = useCallback(() => {
    void fetchStats();
    void fetchEvents();
  }, [fetchStats, fetchEvents]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── 차트 데이터 ──
  const chartData = useMemo(
    () => monthly.map((r) => ({ label: rowLabel(r), value: r.collectedAmount ?? 0 })),
    [monthly]
  );

  const revenueDelta = useMemo(() => {
    if (chartData.length < 2) return undefined;
    return calcDelta(
      chartData[chartData.length - 1].value,
      chartData[chartData.length - 2].value
    );
  }, [chartData]);

  const handleExport = useCallback(() => {
    if (monthly.length === 0) {
      toast.error('내보낼 데이터가 없습니다.');
      return;
    }
    const rows = monthly.map((r) => `${rowLabel(r)},${r.collectedAmount ?? 0},${r.totalCount ?? 0}`);
    const csv = ['월,수금,건수', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('월별 실적 데이터를 내보냈습니다.');
  }, [monthly]);

  // ── 확인 필요 (실데이터 파생만) ──
  const attentions = useMemo(() => {
    const list: {
      tone: StatusTone;
      title: string;
      meta: string;
      actionLabel: string;
      href: string;
    }[] = [];
    if (!current) return list;

    if ((current.collectingCount ?? 0) > 0) {
      list.push({
        tone: 'warn',
        title: `수금 대기 ${current.collectingCount}건`,
        meta: '시공은 끝났지만 아직 수금되지 않았습니다',
        actionLabel: '수금',
        href: '/boss/orders',
      });
    }
    if ((current.canceledCount ?? 0) > 0) {
      list.push({
        tone: 'bad',
        title: `이번 달 취소 ${current.canceledCount}건`,
        meta: '취소 사유 확인이 필요합니다',
        actionLabel: '확인',
        href: '/boss/orders',
      });
    }
    if ((current.inProgressCount ?? 0) > 0) {
      list.push({
        tone: 'info',
        title: `진행 중 시공 ${current.inProgressCount}건`,
        meta: '현장 진행 상황을 기록하세요',
        actionLabel: '기록',
        href: '/boss/construction',
      });
    }
    return list;
  }, [current]);

  const estimateToday = events.filter((e) => e.eventType === 'estimate').length;
  const constructionToday = events.filter((e) => e.eventType === 'construction').length;

  return (
    <div className="flex flex-col gap-[18px]">
      {/* ───── 실패는 최상단에 상시 노출 (시안 TRUST 원칙) ───── */}
      {error && !loading && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={reload}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {/* ───── 1. KPI 4장 ───── */}
      <section className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">
        <StatCard
          label="오늘 일정"
          value={String(events.length)}
          delta={constructionToday > 0 ? `시공 ${constructionToday}` : undefined}
          deltaTone="ok"
          hint={estimateToday > 0 ? `견적 방문 ${estimateToday}건` : '등록된 일정 기준'}
          loading={eventsLoading}
        />
        <StatCard
          label="이번 달 수금"
          value={fmtWonShort(current?.collectedAmount ?? 0)}
          delta={revenueDelta}
          hint="전월 대비"
          loading={loading}
        />
        <StatCard
          label="진행 중 시공"
          value={String(current?.inProgressCount ?? 0)}
          delta={
            (current?.collectingCount ?? 0) > 0 ? `수금 대기 ${current?.collectingCount}` : undefined
          }
          deltaTone="warn"
          hint="현장 진행 중"
          loading={loading}
        />
        <StatCard
          label="이번 달 완료"
          value={String(current?.completedCount ?? 0)}
          delta={`총 ${(current?.totalCount ?? 0).toLocaleString('ko-KR')}건`}
          deltaTone="neutral"
          hint="시공 완료"
          loading={loading}
        />
      </section>

      {/* ───── 2. 2열: 좌 오늘의 일감 / 우 확인 필요 + 진행 현황 ───── */}
      <section className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* 좌: 오늘의 일감 — 시안 발행 큐 패턴 */}
        <ContentCard>
          <CardHead
            title="오늘의 일감"
            meta={todayLabel}
            action="일정으로 보기 →"
            actionHref="/boss/calendar"
          />

          {eventsLoading ? (
            <RowSkeleton rows={5} />
          ) : events.length === 0 ? (
            <div className="px-[15px] py-8">
              <p className="text-center text-[11.5px] text-boss-text-muted">
                오늘 등록된 일정이 없습니다
              </p>
            </div>
          ) : (
            events.map((ev) => {
              const m = eventMeta(ev.eventType);
              const state = eventState(ev, now);
              return (
                <Row
                  key={ev.id}
                  columns="62px 26px minmax(0,1fr) auto"
                  href={`/boss/calendar/day?date=${todayStamp(today)}`}
                >
                  <span className="font-boss-mono text-[13px] text-boss-text">
                    {eventTime(ev.startDate)}
                  </span>
                  <Chip tone={m.tone}>{m.short}</Chip>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-boss-text">
                      {ev.title || m.label}
                    </p>
                    <div className="mt-[5px] flex items-center gap-[7px]">
                      <TagPill>{m.label}</TagPill>
                      {ev.location && (
                        <span className="truncate text-[11px] text-boss-text-muted">
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={state.tone}>{state.label}</StatusPill>
                    <span className="text-[13px] text-boss-text-ghost">⋯</span>
                  </div>
                </Row>
              );
            })
          )}

          {/* 마지막 행 = 점선 CTA (시안) */}
          <div className="px-[15px] py-[11px]">
            <DashedCta href="/boss/calendar">
              <Plus size={12} /> 오늘 일정 추가
            </DashedCta>
          </div>
        </ContentCard>

        {/* 우: 확인 필요 + 진행 현황 */}
        <div className="flex flex-col gap-3.5">
          <ContentCard>
            <CardHead
              title="확인 필요"
              count={attentions.length > 0 ? `${attentions.length}건` : undefined}
            />
            {loading ? (
              <div className="space-y-2 px-[15px] py-4">
                <div className="h-4 animate-pulse rounded bg-boss-elevated" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-boss-elevated" />
              </div>
            ) : attentions.length === 0 ? (
              <p className="px-[15px] py-7 text-center text-[11.5px] text-boss-text-muted">
                지금 처리할 항목이 없습니다
              </p>
            ) : (
              attentions.map((a) => (
                <AttentionItem
                  key={a.title}
                  tone={a.tone}
                  title={a.title}
                  meta={a.meta}
                  actionLabel={a.actionLabel}
                  href={a.href}
                />
              ))
            )}
          </ContentCard>

          <ContentCard>
            <CardHead title="이번 달 진행" action="통계 →" actionHref="/boss/statistics" />
            <div className="grid grid-cols-3 gap-[7px] p-[15px]">
              <MetricBox label="견적" value={current?.estimateCount ?? 0} />
              <MetricBox label="계약" value={current?.contractCount ?? 0} />
              <MetricBox label="완료" value={current?.completeCount ?? 0} />
            </div>
            <div className="flex items-center gap-2 border-t border-boss-border-row px-[15px] py-[11px] text-[11px] text-boss-text-muted">
              <span className="flex-1">취소 · 반려</span>
              <span className="font-boss-mono text-boss-text-secondary">
                {(current?.cancelCount ?? 0).toLocaleString('ko-KR')}
              </span>
            </div>
          </ContentCard>
        </div>
      </section>

      {/* ───── 3. 월별 수금 — 시안 성과 화면의 막대 차트 패턴 ───── */}
      <ContentCard>
        <CardHead
          title="월별 수금"
          meta="최근 7개월"
          action="매출 분석 →"
          actionHref="/boss/sales"
        />
        <div className="p-4">
          {loading ? (
            <div className="h-[168px] animate-pulse rounded-card bg-boss-elevated" />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="집계된 실적이 없습니다"
              description="주문이 등록되고 수금이 완료되면 여기에 표시됩니다."
            />
          ) : (
            <>
              <p className="mb-3.5 text-[11px] text-boss-text-muted">
                막대 강조 = 최근 7개월 중 상위 10%
              </p>
              <BarChart data={chartData} labelEvery={1} formatValue={fmtWonShort} />
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 border-t border-boss-border px-[15px] py-[11px]">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={reload} disabled={loading}>
            새로고침
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            CSV 내보내기
          </Button>
        </div>
      </ContentCard>
    </div>
  );
}
