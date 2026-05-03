'use client';

// 사장님 매출 통계 페이지 — Flutter sales_status_page 의 월간 통계 영역에 대응
// GET /stats/monthly 호출하여 최근 N개월 매출/건수를 recharts 로 시각화한다.
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

// 백엔드 응답에서 BossMonthlyStat[] 추출 (배열/객체 구조 모두 허용)
function extractList(data: unknown): BossMonthlyStat[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as BossMonthlyStat[];
  const obj = data as { list?: BossMonthlyStat[]; content?: BossMonthlyStat[] };
  return obj.list ?? obj.content ?? [];
}

// "202504" / "2025-04" / 분리된 year+month 모두 처리
function rowLabel(row: BossMonthlyStat): string {
  if (row.yearMonth) {
    const ym = row.yearMonth.replace('-', '');
    if (ym.length >= 6) return `${Number(ym.substring(4, 6))}월`;
  }
  if (row.month) return `${row.month}월`;
  return '-';
}

// 통화 포맷 (천 단위 콤마 + 원)
function fmtWon(n?: number): string {
  if (n == null) return '₩0';
  return `₩${n.toLocaleString('ko-KR')}`;
}

const PERIOD_OPTIONS = [
  { value: 3, label: '최근 3개월' },
  { value: 6, label: '최근 6개월' },
  { value: 12, label: '최근 12개월' },
];

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

  // 차트 데이터 변환
  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        label: rowLabel(r),
        amount: r.totalAmount ?? 0,
        count: r.totalCount ?? 0,
        paid: r.paidAmount ?? 0,
      })),
    [rows]
  );

  // 합계 계산
  const totals = useMemo(
    () => ({
      amount: rows.reduce((s, r) => s + (r.totalAmount ?? 0), 0),
      count: rows.reduce((s, r) => s + (r.totalCount ?? 0), 0),
      paid: rows.reduce((s, r) => s + (r.paidAmount ?? 0), 0),
    }),
    [rows]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1">
            <TrendingUp size={11} className="text-violet-300" />
            <span className="text-[11px] font-medium text-violet-300">매출 분석</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">월별 매출 통계</h1>
          <p className="mt-1 text-sm text-slate-400">기간을 선택해 매출 추이를 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMonths(opt.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                months === opt.value
                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fetchData(months)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white"
            aria-label="새로고침"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* 합계 카드 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="총 매출" value={fmtWon(totals.amount)} icon={<TrendingUp size={18} />} accent="from-violet-500 to-violet-700" loading={loading} />
        <SummaryCard label="총 건수" value={`${totals.count.toLocaleString('ko-KR')}건`} icon={<BarChart3 size={18} />} accent="from-emerald-500 to-emerald-700" loading={loading} />
        <SummaryCard label="수금 금액" value={fmtWon(totals.paid)} icon={<Calendar size={18} />} accent="from-sky-500 to-sky-700" loading={loading} />
      </section>

      {/* 에러 메시지 */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* 매출 추이 차트 */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">매출 추이</h2>
            <p className="text-xs text-slate-500">최근 {months}개월 매출액</p>
          </div>
        </div>
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-800/40" />
        ) : chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            표시할 데이터가 없습니다.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
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
              <Area type="monotone" dataKey="amount" stroke="#a855f7" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* 건수 차트 */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">건수 추이</h2>
            <p className="text-xs text-slate-500">최근 {months}개월 시공 건수</p>
          </div>
        </div>
        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-slate-800/40" />
        ) : chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-slate-500">표시할 데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(168,85,247,0.05)' }}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* 월별 표 */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">월별 상세</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/40" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">데이터가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-medium">월</th>
                  <th className="px-2 py-2 font-medium">건수</th>
                  <th className="px-2 py-2 font-medium">매출액</th>
                  <th className="px-2 py-2 font-medium">수금액</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.yearMonth ?? i}`} className="border-t border-slate-800/60 text-slate-200">
                    <td className="px-2 py-2">{rowLabel(r)}</td>
                    <td className="px-2 py-2">{(r.totalCount ?? 0).toLocaleString('ko-KR')}건</td>
                    <td className="px-2 py-2">{fmtWon(r.totalAmount)}</td>
                    <td className="px-2 py-2">{fmtWon(r.paidAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-5">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl`} />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
            {icon}
          </div>
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-32 animate-pulse rounded bg-slate-800/60" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        )}
      </div>
    </div>
  );
}
