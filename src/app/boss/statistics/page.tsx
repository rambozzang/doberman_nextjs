'use client';

// 종합 통계 — Industry 패턴 (agent.opentohome.com)
//
// 구조
//   필터 줄(기준 설명 + 우측 새로고침)
//   → KPI 4장 (StatCard · 전월 대비 델타는 응답에 있는 값만 쓴다)
//   → 2열: 좌 매출 추이(recharts Line) / 우 이번 달 상태 분포(누적 막대 + 행)
//   → 월별 건수(recharts Bar)
//
// 차트 규칙: 선·막대 accent, 축 글자 text-muted, 그리드 border-row, 툴팁은 패널색 사각 테두리.
// 그라데이션 · 글로우 없음, 막대 radius 0. 숫자는 Barlow Condensed.

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import { bossStatsApi, buildRecentMonthsParams } from '@/lib/api/boss/stats';
import type { BossMonthlyStat, BossCurrentMonthStats } from '@/types/boss-stats';
import {
  ContentCard,
  CardHead,
  StatCard,
  Button,
  AlertBanner,
  Skeleton,
} from '@/components/boss/ui';

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

function fmtWon(n?: number): string {
  if (n == null) return '₩0';
  if (n >= 100_000_000) return `₩${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `₩${(n / 10_000).toFixed(0)}만`;
  return `₩${n.toLocaleString('ko-KR')}`;
}

/** 전월 대비 증감률. 기준값이 없거나 0 이면 그리지 않는다(지어내지 않는다). */
function deltaOf(cur?: number, prev?: number): number | undefined {
  if (cur == null || prev == null || prev === 0) return undefined;
  return ((cur - prev) / prev) * 100;
}

// ── 차트 스타일 (boss 토큰을 rgb(var()) 로 직접 참조) ──
const CHART = {
  primary: 'rgb(var(--boss-primary))',
  grid: 'rgb(var(--boss-border-row))',
  axis: 'rgb(var(--boss-text-muted))',
  cursor: 'rgb(var(--boss-elevated))',
};

const AXIS_TICK = { fontSize: 11, fontFamily: 'var(--boss-font-head)', fill: CHART.axis };

const TOOLTIP_STYLE = {
  background: 'rgb(var(--boss-surface))',
  border: '1px solid rgb(var(--boss-border))',
  borderRadius: 0,
  boxShadow: 'var(--boss-shadow)',
  fontSize: '12px',
  padding: '6px 10px',
  color: 'rgb(var(--boss-text))',
};

const TOOLTIP_LABEL_STYLE = {
  color: 'rgb(var(--boss-text-secondary))',
  marginBottom: '2px',
  fontFamily: 'var(--boss-font-head)',
};

const TOOLTIP_ITEM_STYLE = {
  color: 'rgb(var(--boss-text))',
  fontFamily: 'var(--boss-font-head)',
  fontVariantNumeric: 'tabular-nums',
};

// 상태 분포 — 막대 색은 boss 토큰 클래스
const STATUS_BAR: { key: keyof BossCurrentMonthStats; name: string; cls: string }[] = [
  { key: 'inProgressCount', name: '진행 중', cls: 'bg-boss-primary' },
  { key: 'collectingCount', name: '수금 중', cls: 'bg-boss-warning' },
  { key: 'completedCount', name: '완료', cls: 'bg-boss-success' },
  { key: 'canceledCount', name: '취소', cls: 'bg-boss-text-ghost' },
];

export default function BossStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<BossMonthlyStat[]>([]);
  const [current, setCurrent] = useState<BossCurrentMonthStats | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, cRes] = await Promise.all([
        bossStatsApi.monthly(buildRecentMonthsParams(12)),
        bossStatsApi.current(),
      ]);
      if (mRes.success === false) {
        const msg = mRes.error || mRes.message || '월별 통계를 불러오지 못했습니다.';
        setError(msg);
        toast.error(msg);
        setMonthly([]);
      } else {
        setMonthly(extractList(mRes.data));
      }
      if (cRes.success === false) {
        const msg = cRes.error || cRes.message || '현재월 통계를 불러오지 못했습니다.';
        setError((prev) => prev ?? msg);
        toast.error(msg);
        setCurrent(null);
      } else {
        setCurrent(cRes.data ?? null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '통계 정보를 불러오지 못했습니다.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const chartData = useMemo(
    () =>
      monthly.map((r) => ({
        label: rowLabel(r),
        amount: r.collectedAmount ?? 0,
        count: r.totalCount ?? 0,
      })),
    [monthly],
  );

  const statusData = useMemo(
    () =>
      STATUS_BAR.map((s) => ({
        ...s,
        value: (current?.[s.key] as number | undefined) ?? 0,
      })),
    [current],
  );

  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);

  const emptyText = (what: string) =>
    error
      ? `${what}을(를) 불러오지 못했습니다. 위의 다시 시도를 눌러 주세요.`
      : `아직 집계된 ${what}이(가) 없습니다. 주문이 등록되면 다음 집계부터 표시됩니다.`;

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[12px] text-boss-text-muted">최근 12개월 · 이번 달은 오늘까지 집계</p>
        <div className="ml-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchAll()}
            disabled={loading}
          >
            새로고침
          </Button>
        </div>
      </div>

      {error && !loading && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => fetchAll()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {/* ───── KPI 4장 ───── */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="이번 달 수금"
          value={fmtWon(current?.collectedAmount)}
          delta={deltaOf(current?.collectedAmount, current?.lastMonthCollectedAmount)}
          hint="전월 같은 기준 대비"
          loading={loading}
        />
        <StatCard
          label="이번 달 건수"
          value={`${(current?.totalCount ?? 0).toLocaleString('ko-KR')}건`}
          delta={deltaOf(current?.totalCount, current?.lastMonthTotalCount)}
          hint="등록된 주문 수"
          loading={loading}
        />
        <StatCard
          label="진행 중"
          value={`${(current?.inProgressCount ?? 0).toLocaleString('ko-KR')}건`}
          hint="시공 중인 현장"
          loading={loading}
        />
        <StatCard
          label="완료"
          value={`${(current?.completedCount ?? 0).toLocaleString('ko-KR')}건`}
          delta={deltaOf(current?.completedCount, current?.lastMonthCompletedCount)}
          hint="이번 달 마무리한 현장"
          loading={loading}
        />
      </section>

      {/* ───── 2열: 매출 추이 / 상태 분포 ───── */}
      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <ContentCard className="lg:col-span-2">
          <CardHead title="매출 추이" meta="최근 12개월 수금액" />
          <div className="p-5">
            {loading ? (
              <Skeleton className="h-[240px]" />
            ) : chartData.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-boss-text-secondary">
                {emptyText('매출')}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${Math.round(v / 10000)}만`}
                  />
                  <Tooltip
                    cursor={{ stroke: CHART.grid }}
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    formatter={(v) => [fmtWon(Number(v)), '수금']}
                  />
                  <Line
                    type="linear"
                    dataKey="amount"
                    stroke={CHART.primary}
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: CHART.primary, strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: CHART.primary, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ContentCard>

        <ContentCard>
          <CardHead
            title="상태 분포"
            meta="이번 달"
            count={statusTotal > 0 ? `${statusTotal.toLocaleString('ko-KR')}건` : undefined}
            countTone="muted"
          />
          <div className="p-5">
            {loading ? (
              <Skeleton className="h-[176px]" />
            ) : statusTotal === 0 ? (
              <p className="py-10 text-center text-[13px] text-boss-text-secondary">
                {emptyText('주문')}
              </p>
            ) : (
              <>
                {/* 누적 막대 — 참조 게이지 */}
                <div className="flex h-2 w-full overflow-hidden bg-[#d4d4d7]">
                  {statusData
                    .filter((s) => s.value > 0)
                    .map((s) => (
                      <span
                        key={s.name}
                        className={`block h-full ${s.cls}`}
                        style={{ width: `${(s.value / statusTotal) * 100}%` }}
                        title={`${s.name} ${s.value}건`}
                      />
                    ))}
                </div>
                <dl className="mt-3 flex flex-col">
                  {statusData.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between gap-3 border-b border-boss-border-row py-2 text-[13px] last:border-b-0"
                    >
                      <dt className="flex items-center gap-2 text-boss-text-secondary">
                        <span className={`h-[7px] w-[7px] flex-none ${s.cls}`} />
                        {s.name}
                      </dt>
                      <dd className="font-boss-head text-[15px] font-semibold tabular-nums text-boss-text">
                        {s.value.toLocaleString('ko-KR')}
                        <span className="ml-1.5 text-[11px] font-normal text-boss-text-muted">
                          {((s.value / statusTotal) * 100).toFixed(0)}%
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </ContentCard>
      </section>

      {/* ───── 월별 건수 ───── */}
      <ContentCard>
        <CardHead title="월별 건수" meta="최근 12개월 시공 건수" />
        <div className="p-5">
          {loading ? (
            <Skeleton className="h-[200px]" />
          ) : chartData.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-boss-text-secondary">
              {emptyText('건수')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: CHART.cursor }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  formatter={(v) => [`${Number(v).toLocaleString('ko-KR')}건`, '건수']}
                />
                <Bar
                  dataKey="count"
                  fill={CHART.primary}
                  radius={0}
                  maxBarSize={40}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ContentCard>
    </div>
  );
}
