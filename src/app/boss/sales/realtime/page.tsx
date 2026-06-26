'use client';

// 사장님 실시간 매출 페이지 — Flutter sales_status_page 의 리스트 영역에 대응
// GET /stats/monthly/current 호출하여 현재월(또는 선택월) 매출 현황을 표시한다.
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Activity, RefreshCw, Calendar, Wallet } from 'lucide-react';
import { bossStatsApi, formatYearMonth } from '@/lib/api/boss/stats';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossCurrentMonthStats } from '@/types/boss-stats';
import type { BossOrderItem } from '@/types/boss';

// yyyyMMdd / ISO 모두 yyyy.MM.dd 로 변환
function fmtDate(s?: string): string {
  if (!s) return '-';
  const digits = s.replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    return `${digits.substring(0, 4)}.${digits.substring(4, 6)}.${digits.substring(6, 8)}`;
  }
  return s;
}

function fmtWon(n?: number): string {
  if (n == null || Number.isNaN(n)) return '₩0';
  return `₩${n.toLocaleString('ko-KR')}`;
}

function yearMonthRange(ym: string) {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(4, 6));
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${y}${pad(m)}010000`;
  const end = `${y}${pad(m)}${pad(new Date(y, m, 0).getDate())}2359`;
  return { start, end };
}

// 최근 3개월 yearMonth 옵션 생성
function buildMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: formatYearMonth(d),
      label: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return opts;
}

export default function BossSalesRealtimePage() {
  const monthOptions = useMemo(buildMonthOptions, []);
  const [yearMonth, setYearMonth] = useState<string>(monthOptions[0].value);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BossCurrentMonthStats | null>(null);
  const [items, setItems] = useState<BossOrderItem[]>([]);

  const fetchData = async (ym: string) => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = yearMonthRange(ym);
      const [statsRes, ordersRes] = await Promise.all([
        bossStatsApi.current(ym),
        bossOrdersApi.list({
          page: 0,
          size: 200,
          sortType: 'WORK_DATE',
          workDateFrom: start,
          workDateTo: end,
        }),
      ]);
      if (statsRes.success === false) {
        const msg = statsRes.error || statsRes.message || '실시간 매출 정보를 불러오지 못했습니다.';
        setError(msg);
        setStats(null);
        toast.error(msg);
      } else {
        setStats(statsRes.data ?? null);
      }
      if (ordersRes.success === false) {
        const msg = ordersRes.error || ordersRes.message || '주문 목록을 불러오지 못했습니다.';
        setError((prev) => prev ?? msg);
        toast.error(msg);
        setItems([]);
      } else {
        setItems(ordersRes.data?.content ?? []);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '실시간 매출 정보를 불러오지 못했습니다.';
      setError(msg);
      setStats(null);
      setItems([]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData(yearMonth);
  }, [yearMonth]);

  // 합계: 응답 집계 우선, 없으면 리스트 합산
  const totalCount = stats?.totalCount ?? items.length;
  const totalAmount = (stats?.collectedAmount ?? 0) + (stats?.uncollectedAmount ?? 0);
  const paidAmount = stats?.collectedAmount ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-boss-error/20 bg-boss-error/5 px-3 py-1">
            <Activity size={11} className="text-boss-error" />
            <span className="text-[11px] font-medium text-boss-error">실시간 매출 현황</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-boss-text md:text-3xl">실시간 실적</h1>
          <p className="mt-1 text-sm text-boss-text-muted">선택한 월의 실시간 매출과 시공 건을 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="rounded-xl border border-boss-border bg-boss-surface/50 px-3 py-2 text-xs font-medium text-boss-text outline-none hover:text-boss-text"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-boss-surface">
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fetchData(yearMonth)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-boss-border bg-boss-surface/50 text-boss-text-secondary hover:text-boss-text"
            aria-label="새로고침"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* 요약 카드 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="총 건수" value={`${totalCount.toLocaleString('ko-KR')}건`} icon={<Calendar size={18} />} accent="from-sky-500 to-sky-700" loading={loading} />
        <SummaryCard label="총 매출" value={fmtWon(totalAmount)} icon={<Activity size={18} />} accent="from-rose-500 to-rose-700" loading={loading} />
        <SummaryCard label="수금 금액" value={fmtWon(paidAmount)} icon={<Wallet size={18} />} accent="from-boss-primary to-emerald-700" loading={loading} />
      </section>

      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/30 bg-boss-error/10 p-4 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 시공 리스트 */}
      <section className="rounded-2xl border border-boss-border bg-boss-surface/50 p-5">
        <h2 className="mb-4 text-sm font-semibold text-boss-text">매출 상세 목록</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-boss-elevated/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-boss-text-muted">표시할 매출이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-boss-border">
            {items.map((item, i) => (
              <li key={item.id ?? i} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-boss-text">{item.name ?? '이름 없음'}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-boss-text-muted">
                    <span>시공일: {fmtDate(item.workDate)}</span>
                    <span>상태: {item.statusCd ?? '-'}</span>
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-boss-text">
                  {fmtWon(item.totalAmount)}
                </div>
              </li>
            ))}
          </ul>
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
          <div className="mt-1 h-7 w-32 animate-pulse rounded bg-boss-elevated/60" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-boss-text">{value}</p>
        )}
      </div>
    </div>
  );
}
