'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { BarChart3, RefreshCw, TrendingUp, FileText, Hammer, CheckCircle2 } from 'lucide-react';
import { bossStatsApi, buildRecentMonthsParams } from '@/lib/api/boss/stats';
import type { BossMonthlyStat, BossCurrentMonthStats } from '@/types/boss-stats';
import {
  PageHeader,
  Card,
  StatCard,
  SectionHeader,
  EmptyState,
  Button,
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

const CHART_STYLE = {
  grid: 'rgb(var(--boss-border))',
  axis: 'rgb(var(--boss-text-muted))',
  tooltipBg: 'rgb(var(--boss-surface))',
  tooltipBorder: 'rgb(var(--boss-border))',
  tooltipLabel: 'rgb(var(--boss-text-secondary))',
};

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

  const statusData = useMemo(() => {
    const c = current;
    return [
      { name: '진행중', value: c?.inProgressCount ?? 0, color: 'rgb(var(--boss-info))' },
      { name: '수금중', value: c?.collectingCount ?? 0, color: 'rgb(var(--boss-warning))' },
      { name: '완료', value: c?.completedCount ?? 0, color: 'rgb(var(--boss-primary))' },
      { name: '취소', value: c?.canceledCount ?? 0, color: 'rgb(var(--boss-text-muted))' },
    ];
  }, [current]);

  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="종합 통계"
        title="통계 대시보드"
        description="최근 12개월의 매출 추이와 현재월 상태를 한눈에 확인하세요."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchAll()}
            disabled={loading}
          >
            새로고침
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="이번달 수금" value={fmtWon(current?.collectedAmount)} icon={TrendingUp} loading={loading} />
        <StatCard label="이번달 건수" value={`${(current?.totalCount ?? 0).toLocaleString('ko-KR')}건`} icon={FileText} loading={loading} />
        <StatCard label="진행 중" value={`${(current?.inProgressCount ?? 0).toLocaleString('ko-KR')}건`} icon={Hammer} loading={loading} />
        <StatCard label="완료" value={`${(current?.completedCount ?? 0).toLocaleString('ko-KR')}건`} icon={CheckCircle2} loading={loading} />
      </section>

      {error && !loading && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader title="매출 트렌드" description="최근 12개월 매출 합계" />
          {loading ? (
            <div className="h-56 animate-pulse rounded-lg bg-boss-elevated" />
          ) : chartData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="데이터가 없습니다" description="통계가 집계되면 표시됩니다." />
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="statRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--boss-primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="rgb(var(--boss-primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke={CHART_STYLE.grid} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 10000)}만`} />
                <Tooltip
                  contentStyle={{ background: CHART_STYLE.tooltipBg, border: `1px solid ${CHART_STYLE.tooltipBorder}`, borderRadius: '6px', fontSize: '11px', padding: '6px 10px' }}
                  labelStyle={{ color: CHART_STYLE.tooltipLabel, marginBottom: '2px' }}
                  formatter={(v) => fmtWon(Number(v))}
                />
                <Area type="monotone" dataKey="amount" stroke="rgb(var(--boss-primary))" strokeWidth={1.5} fill="url(#statRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionHeader
            title="상태 분포"
            description={statusTotal > 0 ? `총 ${statusTotal}건` : '이번 달 기준'}
          />
          {loading ? (
            <div className="h-44 animate-pulse rounded-lg bg-boss-elevated" />
          ) : statusTotal === 0 ? (
            <div className="flex h-44 items-center justify-center text-xs text-boss-text-muted">
              데이터가 없습니다
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: CHART_STYLE.tooltipBg, border: `1px solid ${CHART_STYLE.tooltipBorder}`, borderRadius: '6px', fontSize: '11px', padding: '6px 10px' }}
                    labelStyle={{ color: CHART_STYLE.tooltipLabel }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 space-y-1.5 border-t border-boss-border pt-3">
                {statusData.map((s) => (
                  <li key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-boss-text-muted">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-boss-text">
                      {s.value}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </section>

      <Card>
        <SectionHeader title="월별 건수" description="최근 12개월 시공 건수" />
        {loading ? (
          <div className="h-48 animate-pulse rounded-lg bg-boss-elevated" />
        ) : chartData.length === 0 ? (
          <EmptyState icon={BarChart3} title="데이터가 없습니다" description="통계가 집계되면 표시됩니다." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={CHART_STYLE.grid} vertical={false} />
              <XAxis dataKey="label" stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgb(var(--boss-primary) / 0.04)' }}
                contentStyle={{ background: CHART_STYLE.tooltipBg, border: `1px solid ${CHART_STYLE.tooltipBorder}`, borderRadius: '6px', fontSize: '11px', padding: '6px 10px' }}
                labelStyle={{ color: CHART_STYLE.tooltipLabel }}
              />
              <Bar dataKey="count" fill="rgb(var(--boss-info))" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
