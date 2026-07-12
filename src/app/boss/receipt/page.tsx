'use client';

// 사장님 영수증 지출관리 — 월별 목록 페이지 (B2B 데이터 그리드)
// Flutter receipt_home_page.dart 포팅
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RefreshCw, Inbox } from 'lucide-react';
import { bossReceiptApi } from '@/lib/api/boss/receipt';
import type { MonthlySummary, ReceiptData } from '@/types/boss-receipt';
import { categoryLabel, paymentLabel } from '@/types/boss-receipt';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

function formatWon(n?: number): string {
  if (n == null) return '-';
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
  const router = useRouter();
  const [ym, setYm] = useState(currentYm());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

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

  const filtered = useMemo(() => {
    if (!keyword.trim()) return receipts;
    const k = keyword.toLowerCase();
    return receipts.filter((it) =>
      [it.vendorName, categoryLabel(it.category), it.category, paymentLabel(it.paymentMethod)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [receipts, keyword]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, it) => sum + (it.totalAmount ?? 0), 0),
    [filtered],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="영수증"
        title="지출 관리"
        description="영수증을 관리하고 월별 지출을 추적하세요."
      />

      <Toolbar>
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          onClick={() => setYm(shiftYm(ym, -1))}
          disabled={loading}
        >
          이전달
        </Button>
        <span className="min-w-[72px] text-center text-sm font-semibold text-boss-text">
          {ymLabel(ym)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setYm(shiftYm(ym, 1))}
          disabled={loading}
        >
          다음달
          <ChevronRight size={13} />
        </Button>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="거래처·카테고리 검색"
          className="ml-auto w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => load(ym)}
          disabled={loading}
        >
          새로고침
        </Button>
      </Toolbar>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={keyword.trim() ? '검색 결과가 없습니다' : '이번 달 영수증이 없습니다'}
          description={
            keyword.trim()
              ? '검색어를 변경해 보세요.'
              : '모바일 앱에서 영수증을 촬영하면 여기에 표시됩니다.'
          }
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">날짜</th>
              <th>거래처</th>
              <th>카테고리</th>
              <th className="whitespace-nowrap text-right">금액</th>
              <th>결제수단</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const id = item.id;
              const goDetail = () => id != null && router.push(`/boss/receipt/${id}`);
              return (
                <tr
                  key={id ?? idx}
                  className={id != null ? 'cursor-pointer' : ''}
                  onClick={goDetail}
                >
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {fmtDate(item.txDate)}
                  </td>
                  <td>
                    <span className="font-medium text-boss-text">
                      {item.vendorName ?? '상호 없음'}
                    </span>
                  </td>
                  <td>
                    <Badge tone="default">{categoryLabel(item.category)}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-right font-mono font-semibold tabular-nums text-boss-text">
                    {formatWon(item.totalAmount)}
                  </td>
                  <td>
                    {item.paymentMethod ? (
                      <Badge tone="sky">{paymentLabel(item.paymentMethod)}</Badge>
                    ) : (
                      <span className="text-boss-text-muted">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={goDetail}
                      disabled={id == null}
                    >
                      상세
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-boss-border pt-3 text-xs">
          <span className="text-boss-text-muted">
            {ymLabel(ym)} · 총 {filtered.length.toLocaleString()}건
          </span>
          <span className="font-mono font-semibold tabular-nums text-boss-text">
            합계 {formatWon(filteredTotal)}
          </span>
        </div>
      )}
    </div>
  );
}
