'use client';

// 사장님 영수증 지출관리 — 월별 목록 페이지
// Flutter receipt_home_page.dart 포팅
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, RefreshCw, Inbox, Receipt as ReceiptIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { bossReceiptApi } from '@/lib/api/boss/receipt';
import type { MonthlySummary, ReceiptData } from '@/types/boss-receipt';
import { categoryLabel, paymentLabel } from '@/types/boss-receipt';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Badge,
  RowList,
  RowItem,
  RowThumb,
  RowChevron,
  EmptyState,
  Skeleton,
  SectionHeader,
} from '@/components/boss/ui';

const CATEGORY_COLORS: Record<string, string> = {
  MATERIAL: 'rgb(var(--boss-primary))',
  LABOR: 'rgb(var(--boss-info))',
  FUEL: 'rgb(var(--boss-warning))',
  MEAL: '#f97316',
  VEHICLE: '#8b5cf6',
  UTILITY: '#06b6d4',
  RENT: '#ec4899',
  ETC: 'rgb(var(--boss-text-muted))',
};

const CHART_STYLE = {
  tooltipBg: 'rgb(var(--boss-surface))',
  tooltipBorder: 'rgb(var(--boss-border))',
};

function fmtWon(n?: number): string {
  if (n == null) return '₩0';
  if (n >= 100_000_000) return `₩${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `₩${(n / 10_000).toFixed(0)}만`;
  return `₩${n.toLocaleString('ko-KR')}`;
}

function fmtDate(s?: string): string {
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.length >= 10 ? s.substring(0, 10).replace(/-/g, '.') : s;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function ymLabel(ym: string): string {
  if (ym.length === 6) return `${ym.substring(0, 4)}.${ym.substring(4, 6)}`;
  return ym;
}

function currentYm(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftYm(ym: string, delta: number): string {
  const y = Number(ym.substring(0, 4));
  const m = Number(ym.substring(4, 6));
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BossReceiptListPage() {
  const [ym, setYm] = useState(currentYm());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetYm: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossReceiptApi.monthly(targetYm);
      if (res.success !== false && res.data) {
        setSummary(res.data);
      } else {
        setSummary(null);
        if (res.success === false) {
          setError(res.message || '영수증을 불러오지 못했습니다.');
        }
      }
    } catch {
      setError('네트워크 오류로 영수증을 불러오지 못했습니다.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(ym);
  }, [ym, load]);

  const receipts = summary?.receipts ?? [];
  const totalAmount = summary?.totalAmount ?? 0;
  const receiptCount = receipts.length;

  const categoryData = useMemo(() => {
    return (summary?.byCategory ?? []).map((c) => ({
      name: c.label,
      value: c.amount,
      count: c.count,
      color: CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS['ETC'],
    }));
  }, [summary]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="영수증"
        title="지출 관리"
        description="영수증을 관리하고 월별 지출을 추적하세요."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => load(ym)}
            disabled={loading}
          >
            새로고침
          </Button>
        }
      />

      {/* 월 선택 */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          onClick={() => setYm(shiftYm(ym, -1))}
        >
          이전달
        </Button>
        <span className="min-w-[100px] text-center text-lg font-semibold text-boss-text">
          {ymLabel(ym)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setYm(shiftYm(ym, 1))}
        >
          다음달
          <ChevronRight size={13} />
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="총 지출"
          value={fmtWon(totalAmount)}
          icon={ReceiptIcon}
          loading={loading}
        />
        <StatCard
          label="영수증 건수"
          value={`${receiptCount}건`}
          icon={ReceiptIcon}
          loading={loading}
        />
        <StatCard
          label="건당 평균"
          value={receiptCount > 0 ? fmtWon(Math.round(totalAmount / receiptCount)) : '₩0'}
          icon={ReceiptIcon}
          loading={loading}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 카테고리 차트 + 목록 */}
      {loading && !summary ? (
        <div className="space-y-3">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : receiptCount === 0 ? (
        <EmptyState
          icon={Inbox}
          title="이번 달 영수증이 없습니다"
          description="모바일 앱에서 영수증을 촬영하면 여기에 표시됩니다."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* 카테고리 파이 차트 */}
          {categoryData.length > 0 && (
            <Card className="lg:col-span-1">
              <SectionHeader title="카테고리별 지출" />
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: CHART_STYLE.tooltipBg,
                      border: `1px solid ${CHART_STYLE.tooltipBorder}`,
                      borderRadius: '6px',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                    formatter={(v) => fmtWon(Number(v))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 space-y-1.5 border-t border-boss-border pt-3">
                {categoryData.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-boss-text-muted">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.name}
                      <span className="text-boss-text-muted">({c.count}건)</span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-boss-text">
                      {fmtWon(c.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 영수증 목록 */}
          <Card padded={false} className={categoryData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="border-b border-boss-border px-4 py-3">
              <h2 className="text-sm font-semibold text-boss-text">
                영수증 목록 ({receiptCount}건)
              </h2>
            </div>
            {loading ? (
              <div className="space-y-px p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded" />
                ))}
              </div>
            ) : (
              <RowList className="rounded-none border-0 shadow-none">
                {receipts.map((item) => (
                  <RowItem
                    key={item.id ?? Math.random()}
                    href={item.id ? `/boss/receipt/${item.id}` : undefined}
                    leading={
                      <RowThumb
                        src={item.imageUrl}
                        alt={item.vendorName ?? '영수증'}
                        icon={ReceiptIcon}
                      />
                    }
                    title={item.vendorName ?? '상호 없음'}
                    subtitle={fmtDate(item.txDate)}
                    tags={
                      <>
                        <Badge tone="default">
                          {categoryLabel(item.category)}
                        </Badge>
                        {item.paymentMethod && (
                          <Badge tone="sky">
                            {paymentLabel(item.paymentMethod)}
                          </Badge>
                        )}
                      </>
                    }
                    meta={
                      <span className="font-semibold text-boss-text">
                        {fmtWon(item.totalAmount)}
                      </span>
                    }
                    actions={
                      <Link href={item.id ? `/boss/receipt/${item.id}` : '#'}>
                        <RowChevron />
                      </Link>
                    }
                  />
                ))}
              </RowList>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
