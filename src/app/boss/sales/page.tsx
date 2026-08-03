'use client';

// 매출 분석 — onGo 리디자인 시안 `성과` 화면
//
// 시안 구조
//   상단 컨트롤(기간 세그먼트 + 설명 + CSV 내보내기)
//   → KPI 4장 (auto-fit minmax 190px)
//   → 막대 차트 168px (상위 10% accent, 순수 CSS)
//   → 하단 2열 minmax(0,1.5fr) minmax(0,1fr): 좌 상세 테이블 / 우 인사이트 카드 3장
//
// 시안의 "채널 비교가 아니라 어떤 영상이 통했나" 원칙을 도배에 옮기면
// "월 비교가 아니라 어느 달이 왜 좋았나" 가 된다 → 인사이트 카드는 실데이터에서 파생한다.
//
// 차트는 recharts 대신 시안과 동일한 CSS 막대를 쓴다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, RefreshCw, Download } from 'lucide-react';
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
  Row,
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

// 시안 성과 테이블 컬럼: 34px / 제목 / 76px / 62px / 76px
const TABLE_COLS = '34px minmax(0,1fr) 96px 76px 96px';

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

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 상단 컨트롤 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        <p className="text-[11.5px] text-boss-text-muted">전체 주문 · 수금 기준</p>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => void fetchData(months)}
          disabled={loading}
        >
          새로고침
        </Button>
        <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
          CSV 내보내기
        </Button>
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
      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        <StatCard
          label="총 매출"
          value={fmtWonShort(derived.total)}
          delta={monthDelta}
          hint={`최근 ${months}개월 합계`}
          loading={loading}
        />
        <StatCard
          label="수금액"
          value={fmtWonShort(derived.collected)}
          delta={`${derived.rate.toFixed(0)}%`}
          deltaTone={derived.rate >= 80 ? 'ok' : derived.rate >= 50 ? 'warn' : 'bad'}
          hint="수금률"
          loading={loading}
        />
        <StatCard
          label="미수금"
          value={fmtWonShort(derived.uncollected)}
          delta={derived.uncollected > 0 ? '회수 필요' : undefined}
          deltaTone="bad"
          hint="아직 받지 못한 금액"
          loading={loading}
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

      {/* ───── 막대 차트 ───── */}
      <ContentCard>
        <CardHead title="월별 매출" meta={`최근 ${months}개월`} />
        <div className="p-4">
          {loading ? (
            <div className="h-[168px] animate-pulse rounded-card bg-boss-elevated" />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="집계된 매출이 없습니다"
              description="주문이 등록되면 여기에 표시됩니다."
            />
          ) : (
            <>
              <p className="mb-3.5 text-[11px] text-boss-text-muted">
                막대 강조 = 기간 내 상위 10%
              </p>
              <BarChart data={chartData} labelEvery={1} formatValue={fmtWonShort} />
            </>
          )}
        </div>
      </ContentCard>

      {/* ───── 하단 2열 ───── */}
      <section className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* 좌: 월별 상세 — 시안 성과 테이블 패턴 */}
        <ContentCard>
          <CardHead title="월별 상세" meta="매출 순 아님 · 최신순" />

          {/* 모노 대문자 헤더 행 */}
          <div
            className="grid gap-2.5 border-b border-boss-border px-[15px] py-[9px] font-boss-mono text-[10.5px] uppercase tracking-[0.06em] text-boss-text-muted"
            style={{ gridTemplateColumns: TABLE_COLS }}
          >
            <div>#</div>
            <div>월</div>
            <div className="text-right">매출</div>
            <div className="text-right">건수</div>
            <div className="text-right">수금</div>
          </div>

          {loading ? (
            <RowSkeleton rows={6} />
          ) : derived.list.length === 0 ? (
            <p className="px-[15px] py-8 text-center text-[11.5px] text-boss-text-muted">
              데이터가 없습니다
            </p>
          ) : (
            derived.list.map((r, i) => (
              <Row key={r.key} columns={TABLE_COLS} gap={10} hover>
                <span className="font-boss-mono text-[11px] text-boss-text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-boss-text">{r.label}</p>
                  <div className="mt-[5px] flex items-center gap-1.5">
                    <StatusPill tone={r.rate >= 80 ? 'ok' : r.rate >= 50 ? 'warn' : 'bad'}>
                      수금률 {r.rate.toFixed(0)}%
                    </StatusPill>
                    {r.uncollected > 0 && (
                      <span className="text-[10.5px] text-boss-text-muted">
                        미수 {fmtWonShort(r.uncollected)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-right font-boss-mono text-[12.5px] text-boss-text">
                  {fmtWonShort(r.total)}
                </span>
                <span className="text-right font-boss-mono text-[12.5px] text-boss-text-dim">
                  {r.count.toLocaleString('ko-KR')}
                </span>
                <span className="text-right font-boss-mono text-[12.5px] text-boss-text-dim">
                  {fmtWonShort(r.collected)}
                </span>
              </Row>
            ))
          )}
        </ContentCard>

        {/* 우: 인사이트 — 실데이터에서 파생 */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <>
              <div className="h-[104px] animate-pulse rounded-card bg-boss-elevated" />
              <div className="h-[104px] animate-pulse rounded-card bg-boss-elevated" />
            </>
          ) : derived.list.length === 0 ? (
            <ContentCard inset>
              <p className="px-[15px] py-6 text-center text-[11.5px] text-boss-text-muted">
                데이터가 쌓이면 인사이트를 보여드립니다
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
