'use client';

// 사장님 종합 통계 대시보드
// GET /stats/monthly (최근 12개월) + GET /stats/monthly/current (현재월) 동시 호출
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
    [monthly]
  );

  // 상태별 파이 차트 데이터 (현재월 기준)
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-boss-primary/20 bg-boss-primary/5 px-3 py-1">
            <BarChart3 size={11} className="text-boss-primary" />
            <span className="text-[11px] font-medium text-boss-primary">종합 통계</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-boss-text md:text-3xl">통계 대시보드</h1>
          <p className="mt-1 text-sm text-boss-text-muted">최근 12개월의 매출 추이와 현재월 상태를 한눈에 확인하세요.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchAll()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-boss-border bg-boss-surface/50 text-boss-text-secondary hover:text-boss-text"
          aria-label="새로고침"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* 상단 카드 (현재월) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="이번달 수금" value={fmtWon(current?.collectedAmount)} icon={<TrendingUp size={18} />} accent="from-violet-500 to-violet-700" loading={loading} />
        <StatCard label="이번달 건수" value={`${(current?.totalCount ?? 0).toLocaleString('ko-KR')}건`} icon={<FileText size={18} />} accent="from-boss-primary to-emerald-700" loading={loading} />
        <StatCard label="진행 중" value={`${(current?.inProgressCount ?? 0).toLocaleString('ko-KR')}건`} icon={<Hammer size={18} />} accent="from-sky-500 to-sky-700" loading={loading} />
        <StatCard label="완료" value={`${(current?.completedCount ?? 0).toLocaleString('ko-KR')}건`} icon={<CheckCircle2 size={18} />} accent="from-amber-500 to-amber-700" loading={loading} />
      </section>

      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/30 bg-boss-error/10 p-4 text-sm text-boss-error">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 매출 트렌드 */}
        <div className="rounded-2xl border border-boss-border bg-boss-surface/50 p-5 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-boss-text">매출 트렌드 (최근 12개월)</h2>
            <p className="text-xs text-boss-text-muted">월별 매출 합계</p>
          </div>
          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-boss-elevated/40" />
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-boss-text-muted">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="statGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 10000)}만`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(v) => fmtWon(Number(v))}
                />
                <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#statGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 상태 분포 */}
        <div className="rounded-2xl border border-boss-border bg-boss-surface/50 p-5">
          <h2 className="mb-1 text-sm font-semibold text-boss-text">현재월 상태 분포</h2>
          <p className="mb-4 text-xs text-boss-text-muted">전체 {statusTotal}건</p>
          {loading ? (
            <div className="h-44 animate-pulse rounded-xl bg-boss-elevated/40" />
          ) : statusTotal === 0 ? (
            <div className="flex h-44 items-center justify-center text-sm text-boss-text-muted">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <ul className="mt-3 space-y-1.5">
            {statusData.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-boss-text-secondary">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-boss-text">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 월별 건수 막대 */}
      <section className="rounded-2xl border border-boss-border bg-boss-surface/50 p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-boss-text">월별 건수</h2>
          <p className="text-xs text-boss-text-muted">최근 12개월 시공 건수</p>
        </div>
        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-boss-elevated/40" />
        ) : chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-boss-text-muted">데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(34,197,94,0.05)' }}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-boss-border bg-gradient-to-br from-slate-900 to-slate-900/50 p-5">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl`} />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-boss-text`}>
            {icon}
          </div>
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-boss-text-muted">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-24 animate-pulse rounded bg-boss-elevated/60" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-boss-text">{value}</p>
        )}
      </div>
    </div>
  );
}
