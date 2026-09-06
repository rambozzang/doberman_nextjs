'use client';

// 매출 분석 — Industry 패턴 (agent.opentohome.com)
//
// 구조
//   필터 줄(기간 Seg + 기준 설명 + 우측 새로고침 · CSV)
//   → KPI 4장 (StatCard)
//   → 월별 매출 막대(순수 CSS BarChart · 상위 10% accent · 나머지 중립 회색)
//   → 하단 2열: 좌 월별 상세 표(DataTable) / 우 인사이트 3장 (실데이터에서만 파생)
//
// 숫자 · 금액은 Barlow Condensed(.num). 첫 조회 실패와 0건은 문구를 다르게 낸다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Download } from 'lucide-react';
import { bossStatsApi, buildRecentMonthsParams } from '@/lib/api/boss/stats';
import type { BossMonthlyStat } from '@/types/boss-stats';
import {
  ContentCard,
  CardHead,
  StatCard,
  StatusPill,
  BarChart,
  InsightCard,
  EmptyState,
  Button,
  Segmented,
  AlertBanner,
  RowSkeleton,
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

function fmtWonShort(n?: number): string {
  if (n == null || n === 0) return '₩0';
  if (n >= 100_000_000) return `₩${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `₩${Math.round(n / 10_000).toLocaleString('ko-KR')}만`;
  return `₩${n.toLocaleString('ko-KR')}`;
}

const PERIODS = [
  { key: '3', label: '3개월' },
  { key: '6', label: '6개월' },
  { key: '12', label: '12개월' },
];

export default function BossSalesPage() {
  const [period, setPeriod] = useState('6');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BossMonthlyStat[]>([]);

  const months = Number(period);

  const fetchData = useCallback(async (m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossStatsApi.monthly(buildRecentMonthsParams(m));
      if (res.success === false) {
        const msg = res.error || res.message || '매출 통계를 불러오지 못했습니다.';
        setError(msg);
        setRows([]);
        return;
      }
      setRows(extractList(res.data));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '매출 통계를 불러오지 못했습니다.';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(months);
  }, [months, fetchData]);

  // ── 집계 ──
  const derived = useMemo(() => {
    const list = rows.map((r) => {
      const collected = r.collectedAmount ?? 0;
      const uncollected = r.uncollectedAmount ?? 0;
      const count = r.totalCount ?? 0;
      return {
        label: rowLabel(r),
        key: r.yearMonth ?? r.month ?? rowLabel(r),
        collected,
        uncollected,
        total: collected + uncollected,
        count,
        avg: count > 0 ? Math.round((collected + uncollected) / count) : 0,
        rate: collected + uncollected > 0 ? (collected / (collected + uncollected)) * 100 : 0,
      };
    });

    const total = list.reduce((s, r) => s + r.total, 0);
    const collected = list.reduce((s, r) => s + r.collected, 0);
    const count = list.reduce((s, r) => s + r.count, 0);
    const best = list.reduce<(typeof list)[number] | null>(
      (b, r) => (!b || r.total > b.total ? r : b),
      null
    );

    return {
      list,
      total,
      collected,
      uncollected: total - collected,
      count,
      avg: count > 0 ? Math.round(total / count) : 0,
      rate: total > 0 ? (collected / total) * 100 : 0,
      best,
    };
  }, [rows]);

  // 최근 2개월 비교 델타
  const monthDelta = useMemo(() => {
    const l = derived.list;
    if (l.length < 2) return undefined;
    const prev = l[l.length - 2].total;
    if (prev === 0) return undefined;
    return ((l[l.length - 1].total - prev) / prev) * 100;
  }, [derived.list]);

  const handleExport = useCallback(() => {
    if (derived.list.length === 0) {
      toast.error('내보낼 데이터가 없습니다.');
      return;
    }
    const body = derived.list.map(
      (r) => `${r.label},${r.count},${r.total},${r.collected},${r.uncollected}`
    );
    const csv = ['월,건수,총매출,수금액,미수금', ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${months}m-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('매출 데이터를 내보냈습니다.');
  }, [derived.list, months]);

  const chartData = useMemo(
    () => derived.list.map((r) => ({ label: r.label, value: r.total })),
    [derived.list]
  );

  const rateTone = (rate: number) => (rate >= 80 ? 'ok' : rate >= 50 ? 'warn' : 'bad');

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented options={PERIODS} value={period} onChange={setPeriod} ariaLabel="조회 기간" />
        <p className="text-[12px] text-boss-text-muted">전체 주문 · 수금 기준</p>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => void fetchData(months)}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            CSV 내보내기
          </Button>
        </div>
      </div>

      {error && !loading && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void fetchData(months)}>
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
          label="총 매출"
          value={fmtWonShort(derived.total)}
          delta={monthDelta}
          hint={`최근 ${months}개월 합계 · 전월 대비`}
          loading={loading}
        />
        <StatCard
          label="수금액"
          value={fmtWonShort(derived.collected)}
          delta={`${derived.rate.toFixed(0)}%`}
          deltaTone={rateTone(derived.rate)}
          hint="수금률 = 수금액 ÷ 총 매출"
          loading={loading}
        />
        <StatCard
          label="미수금"
          value={fmtWonShort(derived.uncollected)}
          delta={derived.uncollected > 0 ? '회수 필요' : undefined}
          deltaTone="bad"
          hint="아직 받지 못한 금액"
          loading={loading}
          alert={!loading && derived.uncollected > 0}
        />
        <StatCard
          label="건당 평균"
          value={fmtWonShort(derived.avg)}
          delta={`${derived.count.toLocaleString('ko-KR')}건`}
          deltaTone="neutral"
          hint="총 건수 기준"
          loading={loading}
        />
      </section>

      {/* ───── 월별 매출 막대 ───── */}
      <ContentCard>
        <CardHead
          title="월별 매출"
          meta={`최근 ${months}개월 · 막대 강조 = 상위 10%`}
          count={derived.best ? `최고 ${derived.best.label} ${fmtWonShort(derived.best.total)}` : undefined}
          countTone="accent"
        />
        <div className="p-5">
          {loading ? (
            <Skeleton className="h-[168px]" />
          ) : error ? (
            <p className="py-10 text-center text-[13px] text-boss-text-secondary">
              매출을 불러오지 못해 차트를 그릴 수 없습니다. 위의 다시 시도를 눌러 주세요.
            </p>
          ) : chartData.length === 0 ? (
            <EmptyState
              title="집계된 매출이 없습니다"
              description={`최근 ${months}개월에 등록된 주문이 없습니다. 주문을 등록하면 다음 집계부터 표시됩니다.`}
            />
          ) : (
            <BarChart data={chartData} labelEvery={1} formatValue={fmtWonShort} />
          )}
        </div>
      </ContentCard>

      {/* ───── 하단 2열 ───── */}
      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* 좌: 월별 상세 표 */}
        <ContentCard>
          <CardHead
            title="월별 상세"
            meta="과거 → 최근 순"
            count={loading ? undefined : `${derived.list.length}개월`}
            countTone="muted"
          />
          {loading ? (
            <RowSkeleton rows={6} />
          ) : derived.list.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-boss-text-secondary">
              {error
                ? '월별 상세를 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
                : '표시할 월이 없습니다. 주문이 등록된 달부터 이 표에 쌓입니다.'}
            </p>
          ) : (
            <div className="boss-scroll overflow-x-auto">
              <table className="boss-table">
                <thead>
                  <tr>
                    <th>월</th>
                    <th className="num">건수</th>
                    <th className="num">매출</th>
                    <th className="num">수금</th>
                    <th className="num">미수</th>
                    <th>수금률</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.list.map((r) => (
                    <tr key={r.key}>
                      <td className="font-semibold">{r.label}</td>
                      <td className="num">{r.count.toLocaleString('ko-KR')}</td>
                      <td className="num font-semibold">{fmtWonShort(r.total)}</td>
                      <td className="num text-boss-text-secondary">{fmtWonShort(r.collected)}</td>
                      <td
                        className={`num ${r.uncollected > 0 ? 'text-boss-error' : 'text-boss-text-muted'}`}
                      >
                        {r.uncollected > 0 ? fmtWonShort(r.uncollected) : '—'}
                      </td>
                      <td>
                        <StatusPill tone={rateTone(r.rate)}>{r.rate.toFixed(0)}%</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>

        {/* 우: 인사이트 — 실데이터에서만 파생 */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <>
              <Skeleton className="h-[104px]" />
              <Skeleton className="h-[104px]" />
              <Skeleton className="h-[104px]" />
            </>
          ) : derived.list.length === 0 ? (
            <ContentCard inset>
              <p className="px-5 py-8 text-center text-[13px] text-boss-text-secondary">
                {error ? '데이터를 받으면 인사이트를 보여드립니다.' : '매출이 쌓이면 인사이트를 보여드립니다.'}
              </p>
            </ContentCard>
          ) : (
            <>
              {derived.best && (
                <InsightCard
                  tag="WHEN"
                  title={`${derived.best.label}이 가장 좋았습니다`}
                  description={`매출 ${fmtWon(derived.best.total)} · ${derived.best.count}건. 이 달의 유입 경로와 견적 응답 속도를 다른 달과 비교해 보세요.`}
                />
              )}
              <InsightCard
                tag="CASH"
                title={
                  derived.rate >= 80
                    ? '수금이 잘 돌고 있습니다'
                    : `미수금 ${fmtWonShort(derived.uncollected)} 회수가 급합니다`
                }
                description={
                  derived.rate >= 80
                    ? `수금률 ${derived.rate.toFixed(0)}%. 지금 속도를 유지하면 현금 흐름 문제는 없습니다.`
                    : `수금률 ${derived.rate.toFixed(0)}%. 완료됐지만 입금되지 않은 건을 주문 관리에서 먼저 처리하세요.`
                }
              />
              <InsightCard
                tag="AVG"
                title={`건당 평균 ${fmtWonShort(derived.avg)}`}
                description={`총 ${derived.count.toLocaleString('ko-KR')}건 기준. 평균 단가를 올리려면 건수를 늘리기보다 평수 큰 현장과 부대 공사(장판·필름) 비중을 보세요.`}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
