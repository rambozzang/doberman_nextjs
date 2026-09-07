'use client';

// 사장님 대시보드 — Industry 패턴 (agent.opentohome.com 대시보드 조판)
//
// 조판
//   히어로 밴드(네이비)  오늘 날짜 · 회사명 kicker + "오늘 처리할 일이 n건" + 큰 숫자 3개
//   KPI 4장             이번 달 수금 · 수금 대기 · 이번 달 완료 · 취소 (카드 클릭 → 해당 화면)
//   2열                 좌 "오늘 처리할 것" 표 / 우 이번 달 진행 · 구독 플랜 · 회사 정보
//   전체폭              월별 수금 막대 차트
//
// 여기 있는 숫자는 전부 서버에서 온 것이다.
//   GET /stats/monthly · /stats/monthly/current — 건수 · 금액
//   GET /calendar/searchDataByDate            — 오늘 일정
//   회사 · 구독은 셸(BossPortalContext)이 이미 읽어 둔 값을 그대로 쓴다.
// 없는 지표는 지어내지 않는다 — 못 읽은 값은 0 이 아니라 '—' 로 둔다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Download, RefreshCw } from 'lucide-react';
import { bossStatsApi, buildRecentMonthsParams } from '@/lib/api/boss/stats';
import { bossCalendarApi } from '@/lib/api/boss/calendar';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import type { BossMonthlyStat, BossCurrentMonthStats } from '@/types/boss-stats';
import type { CalendarEvent } from '@/types/boss-calendar';
import type { BossCompanyData } from '@/types/boss';
import type { BossSubscriptionStatusResponse } from '@/types/boss-billing';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import { formatPhone } from '@/lib/boss/format';
import {
  ContentCard,
  CardHead,
  Panel,
  StatCard,
  Tag,
  Button,
  ButtonLink,
  AlertBanner,
  MetricBox,
  DescRow,
  BarChart,
  EmptyState,
  RowSkeleton,
  Skeleton,
  type StatusTone,
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

const EVENT_META: Record<string, { label: string; tone: StatusTone }> = {
  estimate: { label: '견적', tone: 'info' },
  construction: { label: '시공', tone: 'ok' },
  appointment: { label: '일정', tone: 'neutral' },
};

function eventMeta(type?: string | null) {
  return EVENT_META[String(type ?? '')] ?? { label: '일정', tone: 'neutral' as StatusTone };
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

/** '오늘 처리할 것' 표의 한 줄 — 일정과 확인 항목을 같은 꼴로 맞춘다 */
type Todo = {
  key: string;
  time: string;
  kind: string;
  kindTone: StatusTone;
  title: string;
  sub?: string;
  state: EventState;
  href: string;
  cta: string;
};

// ───────────────────────────────────────────
// 페이지
// ───────────────────────────────────────────
export default function BossDashboardPage() {
  const { company, subscription } = useBossPortal();
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<BossMonthlyStat[]>([]);
  const [current, setCurrent] = useState<BossCurrentMonthStats | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // 홈택스 발행이 아직 안 된 세금계산서 요청 건수 — 못 읽으면 null (지어내지 않는다)
  const [taxRequested, setTaxRequested] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const now = useMemo(() => nowStamp(today), [today]);
  const dateLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const weekday = today.toLocaleDateString('ko-KR', { weekday: 'short' });

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

  const fetchTaxRequests = useCallback(async () => {
    try {
      const res = await bossTaxInvoiceApi.byStatus('REQUESTED');
      setTaxRequested(res.success !== false && Array.isArray(res.data) ? res.data.length : null);
    } catch {
      setTaxRequested(null);
    }
  }, []);

  const reload = useCallback(() => {
    void fetchStats();
    void fetchEvents();
    void fetchTaxRequests();
  }, [fetchStats, fetchEvents, fetchTaxRequests]);

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

  // ── 오늘 처리할 것 (실데이터 파생만) ──
  // 오늘 일정 + 수금 대기 · 취소 · 진행 중 시공. 전부 서버가 준 건수·행이다.
  const todos = useMemo<Todo[]>(() => {
    const list: Todo[] = events.map((ev) => {
      const m = eventMeta(ev.eventType);
      return {
        key: `ev-${ev.id}`,
        time: eventTime(ev.startDate),
        kind: m.label,
        kindTone: m.tone,
        title: ev.title || m.label,
        sub: ev.location ?? undefined,
        state: eventState(ev, now),
        href: `/boss/calendar/day?date=${todayStamp(today)}`,
        cta: '보기',
      };
    });
    if ((taxRequested ?? 0) > 0) {
      list.push({
        key: 'tax-requested',
        time: '—',
        kind: '계산서',
        kindTone: 'warn',
        title: `세금계산서 발행 요청 ${taxRequested}건`,
        sub: '홈택스에서 발행한 뒤 승인번호를 남기세요',
        state: { label: '미발행', tone: 'warn' },
        href: '/boss/tax-invoice?status=REQUESTED',
        cta: '발행',
      });
    }
    if (!current) return list;

    if ((current.collectingCount ?? 0) > 0) {
      list.push({
        key: 'collecting',
        time: '—',
        kind: '수금',
        kindTone: 'warn',
        title: `수금 대기 ${current.collectingCount}건`,
        sub: '시공은 끝났지만 아직 수금되지 않았습니다',
        state: { label: '미수금', tone: 'warn' },
        href: '/boss/customers',
        cta: '수금',
      });
    }
    if ((current.canceledCount ?? 0) > 0) {
      list.push({
        key: 'canceled',
        time: '—',
        kind: '취소',
        kindTone: 'bad',
        title: `이번 달 취소 ${current.canceledCount}건`,
        sub: '취소 사유를 확인하세요',
        state: { label: '취소', tone: 'bad' },
        href: '/boss/customers',
        cta: '확인',
      });
    }
    if ((current.inProgressCount ?? 0) > 0) {
      list.push({
        key: 'in-progress',
        time: '—',
        kind: '시공',
        kindTone: 'info',
        title: `진행 중 시공 ${current.inProgressCount}건`,
        sub: '현장 진행 상황을 기록하세요',
        state: { label: '진행 중', tone: 'info' },
        href: '/boss/construction',
        cta: '기록',
      });
    }
    return list;
  }, [events, current, now, today, taxRequested]);

  const busy = loading || eventsLoading;

  // 못 읽은 값(current 없음)은 0 이 아니라 '—' 로 둔다
  const cnt = (n?: number) => (current ? String(n ?? 0) : '—');
  const cntUnit = (n?: number) => (current ? `${n ?? 0}건` : '—');

  return (
    <div className="flex flex-col gap-[22px]">
      {/* ───── 실패는 최상단에 상시 노출 (TRUST 원칙) ───── */}
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

      {/* ───── 1. 히어로 밴드 ───── */}
      <Hero
        dateLabel={dateLabel}
        companyName={company?.name}
        loading={busy}
        todoCount={todos.length}
        todayEvents={eventsLoading ? '—' : `${events.length}건`}
        inProgress={loading ? '—' : cntUnit(current?.inProgressCount)}
        collecting={loading ? '—' : cntUnit(current?.collectingCount)}
      />

      {/* ───── 2. KPI 4장 ───── */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="이번 달 수금"
          value={current ? fmtWonShort(current.collectedAmount) : '—'}
          delta={revenueDelta}
          hint="전월 대비 · 수금 완료 금액"
          loading={loading}
          href="/boss/sales"
        />
        <StatCard
          label="수금 대기"
          value={cnt(current?.collectingCount)}
          hint={
            current?.uncollectedAmount != null
              ? `미수금 ${fmtWonShort(current.uncollectedAmount)}`
              : '시공은 끝났지만 아직 수금되지 않은 건'
          }
          loading={loading}
          href="/boss/customers"
          alert={(current?.collectingCount ?? 0) > 0}
        />
        <StatCard
          label="이번 달 완료"
          value={cnt(current?.completedCount)}
          hint={current ? `이번 달 고객 ${(current.totalCount ?? 0).toLocaleString('ko-KR')}건 중` : '시공 완료 건수'}
          loading={loading}
          href="/boss/statistics"
        />
        <StatCard
          label="취소"
          value={cnt(current?.canceledCount)}
          hint="이번 달 취소된 건 · 사유를 확인하세요"
          loading={loading}
          href="/boss/customers"
          alert={(current?.canceledCount ?? 0) > 0}
        />
      </section>

      {/* ───── 3. 2열: 좌 오늘 처리할 것 / 우 진행 · 구독 · 회사 ───── */}
      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ContentCard>
          <CardHead
            title="오늘 처리할 것"
            meta={`${dateLabel} ${weekday}`}
            count={!busy && todos.length > 0 ? `${todos.length}건` : undefined}
            action="일정 보기"
            actionHref="/boss/calendar"
          />

          {busy ? (
            <RowSkeleton rows={4} />
          ) : todos.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13.5px] font-semibold text-boss-text">지금 처리하실 일이 없습니다</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
                오늘 등록된 일정도, 수금 대기 · 취소 건도 없습니다.
              </p>
            </div>
          ) : (
            <div className="boss-scroll overflow-x-auto">
              <table className="boss-table">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>유형</th>
                    <th>내용</th>
                    <th>상태</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {todos.map((t) => (
                    <tr key={t.key}>
                      <td className="w-[64px] font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
                        {t.time}
                      </td>
                      <td className="w-[64px]">
                        <Tag tone={t.kindTone}>{t.kind}</Tag>
                      </td>
                      <td className="wrap">
                        <Link href={t.href} className="block min-w-0 !text-boss-text hover:underline">
                          <span className="line-clamp-2 text-[13.5px]">{t.title}</span>
                        </Link>
                        {t.sub && (
                          <span className="mt-0.5 block truncate text-[11.5px] text-boss-text-secondary">
                            {t.sub}
                          </span>
                        )}
                      </td>
                      <td>
                        <Tag tone={t.state.tone}>{t.state.label}</Tag>
                      </td>
                      <td className="w-[72px] text-right">
                        <Link href={t.href} className="boss-btn boss-btn-sm boss-btn-ghost -mr-2">
                          {t.cta}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-boss-border px-5 py-2.5">
            <p className="text-[12px] leading-relaxed text-boss-text-secondary">
              오늘 일정 · 수금 대기 · 취소 · 진행 중 시공을 한 줄씩 모았습니다.
            </p>
            <Link href="/boss/calendar" className="boss-btn boss-btn-sm boss-btn-ghost -mr-2">
              + 일정 추가
            </Link>
          </div>
        </ContentCard>

        <div className="flex flex-col gap-4">
          <Panel
            kicker={`${today.getFullYear()}년 ${today.getMonth() + 1}월`}
            title="이번 달 진행"
            right={
              <Link href="/boss/statistics" className="boss-btn boss-btn-sm boss-btn-ghost -mr-2">
                통계
              </Link>
            }
          >
            {loading ? (
              <Skeleton className="h-[62px]" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <MetricBox label="견적" value={cnt(current?.estimateCount)} />
                <MetricBox label="계약" value={cnt(current?.contractCount)} />
                <MetricBox label="완료" value={cnt(current?.completeCount)} />
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 border-t border-boss-border-row pt-2.5 text-[12px] text-boss-text-secondary">
              <span className="flex-1">취소 · 반려</span>
              <span className="font-boss-head text-[14px] font-semibold tabular-nums text-boss-text">
                {loading ? '—' : cnt(current?.cancelCount)}
              </span>
            </div>
          </Panel>

          {/* 결제 기능이 열릴 때까지 구독 패널을 감춘다 */}
          {/* <PlanPanel sub={subscription} /> */}
          <CompanyPanel company={company} />
        </div>
      </section>

      {/* ───── 4. 월별 수금 — 전체폭 막대 차트 ───── */}
      <ContentCard>
        <CardHead
          title="월별 수금"
          meta="최근 7개월"
          action="매출 분석"
          actionHref="/boss/sales"
        />
        <div className="p-5">
          {loading ? (
            <Skeleton className="h-[168px]" />
          ) : chartData.length === 0 ? (
            <EmptyState
              title={error ? '월별 실적을 불러오지 못했습니다' : '집계된 실적이 없습니다'}
              description={
                error
                  ? '위의 다시 시도 버튼으로 다시 불러올 수 있습니다.'
                  : '고객이 등록되고 수금이 완료되면 여기에 표시됩니다.'
              }
              action={
                error ? undefined : (
                  <ButtonLink href="/boss/customers/new" variant="secondary" size="sm">
                    고객 등록
                  </ButtonLink>
                )
              }
            />
          ) : (
            <>
              <p className="mb-3.5 text-[12px] text-boss-text-secondary">
                진한 막대 = 최근 7개월 중 상위 10%
              </p>
              <BarChart data={chartData} labelEvery={1} formatValue={fmtWonShort} />
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 border-t border-boss-border px-5 py-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={reload} disabled={loading}>
            새로고침
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            CSV 내보내기
          </Button>
        </div>
      </ContentCard>
    </div>
  );
}

// ───────────────────────────────────────────
// 히어로 밴드 — 참조의 accent-900 짙은 띠
// 글자 #f5f5f8 은 이 밴드에서만 쓴다(네이비 위 밝은 글자, 토큰 없음).
// ───────────────────────────────────────────
function Hero({
  dateLabel,
  companyName,
  loading,
  todoCount,
  todayEvents,
  inProgress,
  collecting,
}: {
  dateLabel: string;
  companyName?: string;
  loading: boolean;
  todoCount: number;
  todayEvents: string;
  inProgress: string;
  collecting: string;
}) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-x-7 gap-y-5 bg-boss-rail px-6 py-[22px] text-boss-rail-text">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-rail-text/60">
          {dateLabel}
          {companyName ? ` · ${companyName}` : ''}
        </span>
        <h2 className="font-boss-head text-[27px] font-semibold leading-[1.1] tracking-[-0.01em] sm:text-[32px]">
          {loading ? (
            '오늘 할 일을 불러오는 중…'
          ) : todoCount > 0 ? (
            <>
              오늘 처리할 일이 <span className="tabular-nums">{todoCount}</span>건 있습니다
            </>
          ) : (
            '지금 처리하실 일이 없습니다'
          )}
        </h2>
      </div>

      <dl className="flex flex-wrap items-end gap-x-[26px] gap-y-3">
        <HeroStat label="오늘 일정" value={todayEvents} />
        <HeroStat label="진행 중 시공" value={inProgress} />
        <HeroStat label="수금 대기" value={collecting} />
      </dl>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-rail-text/60">
        {label}
      </dt>
      <dd className="font-boss-head text-[28px] font-semibold leading-none tabular-nums tracking-[-0.01em] sm:text-[34px]">
        {value}
      </dd>
    </div>
  );
}

// ───────────────────────────────────────────
// 구독 플랜 — 레일 카드와 같은 판정. 응답이 없으면 '무료' 로 두고 안내만 한다.
// ───────────────────────────────────────────
function planView(sub: BossSubscriptionStatusResponse | null) {
  const active = sub?.isActive === true || sub?.status === 'ACTIVE';
  const name = sub?.productName ?? sub?.entitlement?.productName;
  const exp = sub?.expirationDate ?? sub?.entitlement?.expirationDate;
  const expText = exp ? exp.slice(0, 10) : null;
  if (active) {
    return {
      active: true,
      value: name ?? 'PRO',
      sub: expText ? `${expText}까지 이용할 수 있습니다` : sub?.willRenew ? '자동 갱신 중입니다' : '이용 중입니다',
      warn: false,
      expText,
      name,
    };
  }
  if (sub?.status === 'GRACE_PERIOD') {
    return { active: false, value: '결제 보류', sub: '결제 수단을 확인해야 구독이 유지됩니다.', warn: true, expText, name };
  }
  if (sub?.status === 'EXPIRED') {
    return { active: false, value: '만료', sub: '다시 구독하면 바로 이어집니다.', warn: true, expText, name };
  }
  return { active: false, value: '무료', sub: 'PRO 로 바꾸면 견적 무제한 · 고급 리포트를 쓸 수 있습니다.', warn: false, expText, name };
}

function PlanPanel({ sub }: { sub: BossSubscriptionStatusResponse | null }) {
  const v = planView(sub);
  return (
    <Panel
      kicker="구독"
      title="구독 플랜"
      right={
        <Link href="/boss/billing" className="boss-btn boss-btn-sm boss-btn-ghost -mr-2">
          관리
        </Link>
      }
    >
      <div className="flex items-baseline gap-2">
        <span className="font-boss-head text-[36px] font-semibold leading-none tracking-[-0.01em] text-boss-text">
          {v.value}
        </span>
        {v.warn && <Tag tone="warn">확인 필요</Tag>}
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-boss-text-secondary">{v.sub}</p>

      {v.active && sub && (
        <dl className="mt-3">
          <DescRow label="상품" value={v.name ?? '—'} />
          <DescRow label="만료일" value={v.expText ?? '—'} />
          <DescRow
            label="자동 갱신"
            value={sub.willRenew == null ? '—' : sub.willRenew ? '켜짐' : '꺼짐'}
          />
        </dl>
      )}

      {!v.active && (
        <ButtonLink href="/boss/billing/plans" variant="secondary" size="sm" className="mt-3">
          요금제 보기
        </ButtonLink>
      )}
    </Panel>
  );
}

// ───────────────────────────────────────────
// 회사 정보 — 참조의 사무소 패널. 없으면 등록으로 바로 보낸다.
// ───────────────────────────────────────────
function CompanyPanel({ company }: { company: BossCompanyData | null }) {
  if (!company) {
    return (
      <Panel kicker="회사" title="회사 정보">
        <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
          등록된 회사 정보가 없습니다. 상호 · 사업자번호 · 연락처는 견적서와 영수증에 그대로
          찍힙니다.
        </p>
        <ButtonLink href="/boss/me/company/new" variant="primary" size="sm" className="mt-3">
          회사 정보 등록
        </ButtonLink>
      </Panel>
    );
  }

  const addr = [company.address1, company.address2].filter(Boolean).join(' ');
  return (
    <Panel
      kicker="회사"
      title={company.name || '회사 정보'}
      right={
        <Link href="/boss/me/company" className="boss-btn boss-btn-sm boss-btn-ghost -mr-2">
          자세히
        </Link>
      }
    >
      <dl>
        <DescRow label="사업자번호" value={company.bizno || '—'} />
        <DescRow label="대표" value={company.owner || '—'} />
        <DescRow label="전화" value={company.phone ? formatPhone(company.phone) : '—'} />
        <DescRow label="주소" value={addr || '—'} />
      </dl>
    </Panel>
  );
}
