'use client';

// 실시간 매출 — Industry 패턴 (agent.opentohome.com)
//
// 구조
//   필터 줄(월 Seg 3개 + 집계 기준 + 우측 새로고침)
//   → KPI 3장 (StatCard)
//   → 해당 월 시공 건 표(고객 · 시공일 · 상태 · 금액 · 주문 보기)
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다. 첫 조회 실패와 0건은 문구를 다르게 낸다.

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import { bossStatsApi, formatYearMonth } from '@/lib/api/boss/stats';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossCurrentMonthStats } from '@/types/boss-stats';
import type { BossOrderItem } from '@/types/boss';
import {
  ContentCard,
  CardHead,
  StatCard,
  StatusPill,
  ButtonLink,
  Button,
  Segmented,
  AlertBanner,
  RowSkeleton,
  type StatusTone,
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

// 주문 상태 코드 → 표시 라벨 (주문 관리 화면과 같은 규칙)
function orderStatus(code?: string): { label: string; tone: StatusTone } {
  const c = (code ?? '').toUpperCase();
  if (c.includes('NEW') || c.includes('대기')) return { label: '대기', tone: 'neutral' };
  if (c.includes('CONFIRM') || c.includes('확정')) return { label: '확정', tone: 'ok' };
  if (c.includes('PROGRESS') || c.includes('진행')) return { label: '진행', tone: 'info' };
  if (c.includes('DONE') || c.includes('완료')) return { label: '완료', tone: 'ok' };
  if (c.includes('CANCEL') || c.includes('취소')) return { label: '취소', tone: 'bad' };
  return { label: code || '신규', tone: 'neutral' };
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
  const monthLabel = monthOptions.find((o) => o.value === yearMonth)?.label ?? yearMonth;

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented
          ariaLabel="조회 월"
          options={monthOptions.map((o) => ({ key: o.value, label: o.label }))}
          value={yearMonth}
          onChange={setYearMonth}
        />
        <p className="text-[12px] text-boss-text-muted">시공일 기준 · 수금 포함</p>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchData(yearMonth)}
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
            <Button variant="primary" size="sm" onClick={() => fetchData(yearMonth)}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {/* ───── KPI 3장 ───── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="총 건수"
          value={`${totalCount.toLocaleString('ko-KR')}건`}
          hint={`${monthLabel} 시공 건`}
          loading={loading}
        />
        <StatCard
          label="총 매출"
          value={fmtWon(totalAmount)}
          hint="수금 + 미수 합계"
          loading={loading}
        />
        <StatCard
          label="수금 금액"
          value={fmtWon(paidAmount)}
          delta={totalAmount > 0 ? `${((paidAmount / totalAmount) * 100).toFixed(0)}%` : undefined}
          deltaTone={
            totalAmount > 0 && paidAmount / totalAmount >= 0.8
              ? 'ok'
              : totalAmount > 0 && paidAmount / totalAmount >= 0.5
                ? 'warn'
                : 'bad'
          }
          hint="수금률"
          loading={loading}
        />
      </section>

      {/* ───── 시공 건 표 ───── */}
      <ContentCard>
        <CardHead
          title="매출 상세"
          meta={`${monthLabel} 시공일 순`}
          count={loading ? undefined : `${items.length.toLocaleString('ko-KR')}건`}
          countTone="muted"
        />
        {loading ? (
          <RowSkeleton rows={6} />
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-boss-text-secondary">
            {error
              ? '주문을 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
              : `${monthLabel}에 시공일이 잡힌 주문이 없습니다. 주문 관리에서 시공일을 입력하면 여기에 집계됩니다.`}
          </p>
        ) : (
          <div className="boss-scroll overflow-x-auto">
            <table className="boss-table">
              <thead>
                <tr>
                  <th>고객</th>
                  <th>시공일</th>
                  <th>상태</th>
                  <th className="num">금액</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const status = orderStatus(item.statusCd);
                  return (
                    <tr key={item.id ?? i}>
                      <td className="font-semibold">{item.name ?? '이름 없음'}</td>
                      <td className="num text-left text-boss-text-secondary">{fmtDate(item.workDate)}</td>
                      <td>
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </td>
                      <td className="num font-semibold">{fmtWon(item.totalAmount)}</td>
                      <td className="text-right">
                        {item.id != null && (
                          <ButtonLink href={`/boss/orders/${item.id}`} variant="ghost" size="sm">
                            주문 보기
                          </ButtonLink>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
    </div>
  );
}
