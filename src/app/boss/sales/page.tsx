'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { TrendingUp, BarChart3, RefreshCw, Calendar } from 'lucide-react';
import { bossStatsApi, buildRecentMonthsParams } from '@/lib/api/boss/stats';
import type { BossMonthlyStat } from '@/types/boss-stats';
import {
  PageHeader,
  Card,
  StatCard,
  DataTable,
  EmptyState,
  Button,
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
  return `₩${n.toLocaleString('ko-KR')}`;
}

const PERIOD_OPTIONS = [
  { value: 3, label: '3개월' },
  { value: 6, label: '6개월' },
  { value: 12, label: '12개월' },
];

const CHART_STYLE = {
  grid: 'rgb(var(--boss-border))',
  axis: 'rgb(var(--boss-text-muted))',
  tooltipBg: 'rgb(var(--boss-surface))',
  tooltipBorder: 'rgb(var(--boss-border))',
  tooltipLabel: 'rgb(var(--boss-text-secondary))',
};

export default function BossSalesPage() {
  const [months, setMonths] = useState<number>(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BossMonthlyStat[]>([]);

  const fetchData = async (m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossStatsApi.monthly(buildRecentMonthsParams(m));
      if (res.success === false) {
        const msg = res.error || res.message || '매출 통계를 불러오지 못했습니다.';
        setError(msg);
        setRows([]);
        toast.error(msg);
        return;
      }
      setRows(extractList(res.data));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '매출 통계를 불러오지 못했습니다.';
      setError(msg);
      setRows([]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData(months);
  }, [months]);

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        label: rowLabel(r),
        amount: r.collectedAmount ?? 0,
        count: r.totalCount ?? 0,
        total: (r.collectedAmount ?? 0) + (r.uncollectedAmount ?? 0),
      })),
    [rows],
  );

  const totals = useMemo(
    () => ({
      amount: rows.reduce((s, r) => s + ((r.collectedAmount ?? 0) + (r.uncollectedAmount ?? 0)), 0),
      count: rows.reduce((s, r) => s + (r.totalCount ?? 0), 0),
      paid: rows.reduce((s, r) => s + (r.collectedAmount ?? 0), 0),
    }),
    [rows],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="매출 분석"
        title="월별 매출 통계"
        description="기간을 선택해 매출 추이를 확인하세요."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-boss-border bg-boss-bg p-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMonths(opt.value)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    months === opt.value
                      ? 'bg-boss-elevated text-boss-text'
                      : 'text-boss-text-muted hover:text-boss-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchData(months)}
              disabled={loading}
            >
              새로고침
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="총 매출" value={fmtWon(totals.amount)} icon={TrendingUp} loading={loading} />
        <StatCard label="총 건수" value={`${totals.count.toLocaleString('ko-KR')}건`} icon={BarChart3} loading={loading} />
        <StatCard label="수금 금액" value={fmtWon(totals.paid)} icon={Calendar} loading={loading} />
      </section>

      {error && !loading && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-boss-text">매출 추이</h2>
            <p className="mt-0.5 text-xs text-boss-text-muted">최근 {months}개월 매출액</p>
          </div>
          {loading ? (
            <div className="h-56 animate-pulse rounded-lg bg-boss-elevated" />
          ) : chartData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="데이터가 없습니다" description="통계가 집계되면 표시됩니다." />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="amount" stroke="rgb(var(--boss-primary))" strokeWidth={1.5} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-boss-text">건수 추이</h2>
            <p className="mt-0.5 text-xs text-boss-text-muted">최근 {months}개월 시공 건수</p>
          </div>
          {loading ? (
            <div className="h-56 animate-pulse rounded-lg bg-boss-elevated" />
          ) : chartData.length === 0 ? (
            <EmptyState icon={BarChart3} title="데이터가 없습니다" description="통계가 집계되면 표시됩니다." />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={CHART_STYLE.grid} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--boss-primary) / 0.04)' }}
                  contentStyle={{ background: CHART_STYLE.tooltipBg, border: `1px solid ${CHART_STYLE.tooltipBorder}`, borderRadius: '6px', fontSize: '11px', padding: '6px 10px' }}
                  labelStyle={{ color: CHART_STYLE.tooltipLabel }}
                />
                <Bar dataKey="count" fill="rgb(var(--boss-primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card padded={false}>
        <div className="border-b border-boss-border px-4 py-3">
          <h2 className="text-sm font-semibold text-boss-text">월별 상세</h2>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={BarChart3} title="데이터가 없습니다" />
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>월</th>
                <th>건수</th>
                <th>매출액</th>
                <th>수금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.yearMonth ?? i}`}>
                  <td className="font-medium text-boss-text">{rowLabel(r)}</td>
                  <td className="text-boss-text-secondary">{(r.totalCount ?? 0).toLocaleString('ko-KR')}건</td>
                  <td className="text-boss-text-secondary">{fmtWon((r.collectedAmount ?? 0) + (r.uncollectedAmount ?? 0))}</td>
                  <td className="font-medium text-boss-primary">{fmtWon(r.collectedAmount ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </div>
  );
}
