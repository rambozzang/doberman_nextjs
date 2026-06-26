'use client';

// 사장님 대시보드 — 신규 디자인 (Phase 2)
// 원칙: 정보 밀도 우선, gradient orb 제거, 모노스페이스 숫자, 통일된 Card 프리미티브
// 로직: GET /stats/monthly + GET /stats/monthly/current (기존 API 그대로)
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useBossAuth } from '@/hooks/useBossAuth';
import {
  FileText,
  MessageSquare,
  Calendar,
  Hammer,
  Wrench,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Download,
  ShoppingCart,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { bossStatsApi, buildRecentMonthsParams } from '@/lib/api/boss/stats';
import type { BossMonthlyStat, BossCurrentMonthStats } from '@/types/boss-stats';
import { Card, StatCard, SectionHeader, Button, Badge, EmptyState } from '@/components/boss/ui';

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
  if (n >= 10_000) return `₩${(n / 10_000).toFixed(0)}만`;
  return `₩${n.toLocaleString('ko-KR')}`;
}

function calcDelta(current?: number, prev?: number): number | undefined {
  if (current == null || prev == null || prev === 0) return undefined;
  return ((current - prev) / prev) * 100;
}

// ───────────────────────────────────────────
// 빠른 이동 단축 링크
// ───────────────────────────────────────────
const QUICK_LINKS: { href: string; label: string; icon: LucideIcon; desc: string }[] = [
  { href: '/boss/requests', label: '견적 요청', icon: FileText, desc: '대기 중인 요청 확인' },
  { href: '/boss/chat', label: '고객 채팅', icon: MessageSquare, desc: '상담 메시지' },
  { href: '/boss/calendar', label: '일정', icon: Calendar, desc: '오늘 예정' },
  { href: '/boss/construction', label: '시공 기록', icon: Hammer, desc: '진행 중 현장' },
  { href: '/boss/orders', label: '주문', icon: ShoppingCart, desc: '계약 관리' },
  { href: '/boss/as', label: 'AS', icon: Wrench, desc: '사후 관리' },
];

// ───────────────────────────────────────────
// 페이지
// ───────────────────────────────────────────
export default function BossDashboardPage() {
  const { bossAuth } = useBossAuth();
  const name = bossAuth.userInfo?.name ?? bossAuth.userId ?? '사장님';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<BossMonthlyStat[]>([]);
  const [current, setCurrent] = useState<BossCurrentMonthStats | null>(null);
  const [chartTab, setChartTab] = useState<'revenue' | 'count'>('revenue');

  const fetchData = async () => {
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
      const msg = e instanceof Error ? e.message : '대시보드 데이터를 불러오지 못했습니다.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // 차트 데이터 (매출 = 수금액)
  const revenueData = useMemo(
    () =>
      monthly.map((r) => ({
        month: rowLabel(r),
        revenue: r.collectedAmount ?? 0,
        count: r.totalCount ?? 0,
      })),
    [monthly]
  );

  const handleExport = useCallback(() => {
    if (revenueData.length === 0) {
      toast.error('내보낼 데이터가 없습니다.');
      return;
    }
    const header = '월,매출,건수';
    const rows = revenueData.map((r) => `${r.month},${r.revenue},${r.count}`);
    const csv = [header, ...rows].join('\n');
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
  }, [revenueData]);

  // 이전달 대비 변화율 (마지막/직전 월)
  const revenueDelta = useMemo(() => {
    if (revenueData.length < 2) return undefined;
    const last = revenueData[revenueData.length - 1];
    const prev = revenueData[revenueData.length - 2];
    return calcDelta(last.revenue, prev.revenue);
  }, [revenueData]);

  const countDelta = useMemo(() => {
    if (revenueData.length < 2) return undefined;
    const last = revenueData[revenueData.length - 1];
    const prev = revenueData[revenueData.length - 2];
    return calcDelta(last.count, prev.count);
  }, [revenueData]);

  // 견적 상태 분포
  const statusData = useMemo(
    () => [
      { name: '진행중', value: current?.inProgressCount ?? 0, color: 'rgb(var(--boss-info))' },
      { name: '수금중', value: current?.collectingCount ?? 0, color: 'rgb(var(--boss-warning))' },
      { name: '완료', value: current?.completedCount ?? 0, color: 'rgb(var(--boss-primary))' },
      { name: '취소', value: current?.canceledCount ?? 0, color: 'rgb(var(--boss-text-muted))' },
    ],
    [current]
  );
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);

  // 상단 메트릭
  const monthlyTotalCount = current?.totalCount ?? 0;
  const monthlyInProgressCount = current?.inProgressCount ?? 0;
  const monthlyRevenue = current?.collectedAmount ?? 0;
  const monthlyCompletedCount = current?.completedCount ?? 0;

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div>
      {/* ───── PageHeader ───── */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-boss-border pb-5">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-boss-primary">
              Dashboard
            </span>
            <Badge tone="default">{today}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-boss-text md:text-[26px]">
            안녕하세요, {name} 사장님
          </h1>
          <p className="mt-1 text-sm text-boss-text-muted">
            이번 달 비즈니스 현황을 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={RefreshCw} onClick={() => void fetchData()} disabled={loading}>
            새로고침
          </Button>
          <Button icon={Download} variant="secondary" onClick={() => void handleExport()}>
            내보내기
          </Button>
        </div>
      </header>

      {error && !loading && (
        <div className="mb-4 rounded-lg border border-boss-error/20 bg-boss-error/10 px-3 py-2 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* ───── 메트릭 카드 ───── */}
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="이번 달 총 건수"
          value={`${monthlyTotalCount.toLocaleString('ko-KR')}건`}
          icon={FileText}
          delta={countDelta}
          hint="전월 대비"
          loading={loading}
        />
        <StatCard
          label="진행 중 시공"
          value={`${monthlyInProgressCount.toLocaleString('ko-KR')}건`}
          icon={Hammer}
          hint="진행중"
          loading={loading}
        />
        <StatCard
          label="이번 달 수금"
          value={fmtWonShort(monthlyRevenue)}
          icon={TrendingUp}
          delta={revenueDelta}
          hint="전월 대비"
          loading={loading}
        />
        <StatCard
          label="이번 달 완료"
          value={`${monthlyCompletedCount.toLocaleString('ko-KR')}건`}
          icon={CheckCircle2}
          hint="이번 달"
          loading={loading}
        />
      </section>

      {/* ───── 차트 영역 ───── */}
      <section className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* 매출/건수 트렌드 */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-boss-text">실적 트렌드</h2>
              <p className="mt-0.5 text-xs text-boss-text-muted">최근 7개월 실시간 데이터</p>
            </div>
            <div className="flex rounded-md border border-boss-border bg-boss-elevated p-0.5">
              <TabButton active={chartTab === 'revenue'} onClick={() => setChartTab('revenue')}>
                매출
              </TabButton>
              <TabButton active={chartTab === 'count'} onClick={() => setChartTab('count')}>
                건수
              </TabButton>
            </div>
          </div>

          {loading ? (
            <div className="h-64 animate-pulse rounded-lg bg-boss-elevated" />
          ) : revenueData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="데이터가 없습니다" description="통계가 집계되면 여기에 표시됩니다." />
          ) : chartTab === 'revenue' ? (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1d" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${Math.round(v / 10000)}만`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0a0a0b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    padding: '6px 10px',
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '2px' }}
                  formatter={(v) => [fmtWonShort(Number(v)), '매출']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  fill="url(#dashRevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1d" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(34,197,94,0.04)' }}
                  contentStyle={{
                    background: '#0a0a0b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    padding: '6px 10px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v) => [`${v}건`, '건수']}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 견적 상태 분포 */}
        <Card>
          <SectionHeader
            title="견적 상태 분포"
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
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0a0a0b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 space-y-1.5 border-t border-boss-border pt-3">
                {statusData.map((s) => (
                  <li key={s.name} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 text-boss-text-muted">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: s.color }}
                      />
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

      {/* ───── 빠른 이동 + 할 일 ───── */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* 빠른 이동 */}
        <Card className="lg:col-span-2">
          <SectionHeader
            title="빠른 이동"
            description="자주 쓰는 메뉴로 한 번에"
            actions={
              <Link
                href="/boss/statistics"
                className="flex items-center gap-0.5 text-[11px] font-medium text-boss-primary hover:text-boss-primary"
              >
                종합 통계 <ArrowRight size={11} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-lg border border-boss-border bg-boss-elevated p-3 transition-colors hover:border-boss-border hover:bg-boss-elevated"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-boss-elevated text-boss-text-muted transition-colors group-hover:bg-boss-primary/10 group-hover:text-boss-primary">
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-boss-text">{label}</p>
                  <p className="truncate text-[10px] text-boss-text-muted">{desc}</p>
                </div>
                <ChevronRight
                  size={13}
                  className="text-boss-text-muted transition-colors group-hover:text-boss-text-muted"
                />
              </Link>
            ))}
          </div>
        </Card>

        {/* 이번 달 핵심 지표 */}
        <Card>
          <SectionHeader
            title="이번 달 핵심 지표"
            description="현재 월 기준 주요 지표"
            actions={<Sparkles size={12} className="text-boss-primary" />}
          />
          <div className="grid grid-cols-2 gap-2">
            <MetricItem label="견적" value={current?.estimateCount ?? 0} tone="emerald" />
            <MetricItem label="계약" value={current?.contractCount ?? 0} tone="sky" />
            <MetricItem label="완료" value={current?.completeCount ?? 0} tone="violet" />
            <MetricItem label="취소" value={current?.cancelCount ?? 0} tone="rose" />
          </div>
          <p className="mt-3 text-[11px] text-boss-text-muted">
            이번 달 전체 통합된 진행 현황입니다.
          </p>
        </Card>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────
// 내부 컴포넌트
// ───────────────────────────────────────────
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? 'bg-boss-elevated text-boss-text'
          : 'text-boss-text-muted hover:text-boss-text-secondary'
      }`}
    >
      {children}
    </button>
  );
}

function MetricItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'sky' | 'violet' | 'rose';
}) {
  const ringColors: Record<typeof tone, string> = {
    emerald: 'ring-boss-primary/30 bg-boss-primary/10 text-boss-primary',
    sky: 'ring-boss-info/30 bg-boss-info/10 text-boss-info',
    violet: 'ring-violet-500/30 bg-violet-500/10 text-violet-400',
    rose: 'ring-boss-error/30 bg-boss-error/10 text-boss-error',
  };
  return (
    <div className={`rounded-lg p-3 ring-1 ring-inset ${ringColors[tone]}`}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {value.toLocaleString('ko-KR')}
      </p>
    </div>
  );
}
