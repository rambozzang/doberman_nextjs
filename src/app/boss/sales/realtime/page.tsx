'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Activity, RefreshCw, Calendar, Wallet, User } from 'lucide-react';
import { bossStatsApi, formatYearMonth } from '@/lib/api/boss/stats';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossCurrentMonthStats } from '@/types/boss-stats';
import type { BossOrderItem } from '@/types/boss';
import {
  PageHeader,
  Card,
  StatCard,
  RowList,
  RowItem,
  RowThumb,
  Badge,
  EmptyState,
  Button,
  Skeleton,
} from '@/components/boss/ui';

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

  const totalCount = stats?.totalCount ?? items.length;
  const totalAmount = (stats?.collectedAmount ?? 0) + (stats?.uncollectedAmount ?? 0);
  const paidAmount = stats?.collectedAmount ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="실시간 매출"
        title="실시간 실적"
        description="선택한 월의 실시간 매출과 시공 건을 확인하세요."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="h-8 rounded-md border border-boss-border bg-boss-bg px-2 text-xs font-medium text-boss-text focus:border-boss-primary/50 focus:outline-none"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchData(yearMonth)}
              disabled={loading}
            />
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="총 건수" value={`${totalCount.toLocaleString('ko-KR')}건`} icon={Calendar} loading={loading} />
        <StatCard label="총 매출" value={fmtWon(totalAmount)} icon={Activity} loading={loading} />
        <StatCard label="수금 금액" value={fmtWon(paidAmount)} icon={Wallet} loading={loading} />
      </section>

      {error && !loading && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      <Card padded={false}>
        <div className="border-b border-boss-border px-4 py-3">
          <h2 className="text-sm font-semibold text-boss-text">매출 상세 목록</h2>
        </div>
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState title="표시할 매출이 없습니다" description="해당 월의 주문이 없습니다." />
          </div>
        ) : (
          <RowList className="rounded-none border-0 shadow-none">
            {items.map((item, i) => (
              <RowItem
                key={item.id ?? i}
                leading={<RowThumb icon={User} />}
                title={item.name ?? '이름 없음'}
                subtitle={`시공일 ${fmtDate(item.workDate)}`}
                tags={item.statusCd ? <Badge tone="default">{item.statusCd}</Badge> : undefined}
                meta={<span className="font-semibold text-boss-primary">{fmtWon(item.totalAmount)}</span>}
              />
            ))}
          </RowList>
        )}
      </Card>
    </div>
  );
}
