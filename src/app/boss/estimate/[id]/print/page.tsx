'use client';

// 사장님 견적서 인쇄 페이지
// - URL [id] 는 customerId
// - GET /estimateitems/{customerId} 로 품목을 불러와 인쇄용 견적서로 표시
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronLeft, Printer, Receipt } from 'lucide-react';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { PageHeader, Button, EmptyState } from '@/components/boss/ui';
import type { BossEstimateItem, BossEstimateTotals } from '@/types/boss-estimate';

const fmtMoney = (v?: number | string | null): string => {
  if (v === null || v === undefined || v === '') return '0';
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '')) : v;
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('ko-KR');
};

function computeTotals(items: BossEstimateItem[]): BossEstimateTotals {
  return items.reduce<BossEstimateTotals>(
    (acc, it) => {
      acc.totalItems += 1;
      acc.totalQuantity += it.quantity ?? 0;
      acc.supplyAmount += it.supplyAmount ?? 0;
      acc.vatAmount += it.vatAmount ?? 0;
      acc.totalAmount += it.totalAmount ?? 0;
      return acc;
    },
    { totalItems: 0, totalQuantity: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0 },
  );
}

export default function BossEstimatePrintPage() {
  const params = useParams<{ id: string }>();
  const customerId = decodeURIComponent(params?.id ?? '');

  const [items, setItems] = useState<BossEstimateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!customerId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await bossEstimateApi.list(customerId);
        if (cancelled) return;
        if (res.success !== false && res.data) {
          setItems(Array.isArray(res.data) ? res.data : []);
        } else if (res.success === false) {
          setError(res.message || '품목을 불러오지 못했습니다.');
          setItems([]);
        } else {
          setItems([]);
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 품목을 불러오지 못했습니다.');
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const totals = useMemo(() => computeTotals(items), [items]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    } else {
      toast.error('인쇄를 사용할 수 없습니다.');
    }
  };

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-5">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-area * {
            color: #000000 !important;
          }
          .print-table,
          .print-table th,
          .print-table td {
            border-color: #000000 !important;
          }
        }
      `}</style>

      <PageHeader
        title="견적서 출력"
        description={`고객 ID: ${customerId || '-'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/boss/estimate"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-boss-border bg-boss-elevated px-3 text-xs font-medium text-boss-text hover:border-boss-border hover:bg-boss-elevated"
            >
              <ChevronLeft size={13} /> 뒤로
            </Link>
            <Button icon={Printer} onClick={handlePrint}>
              인쇄하기
            </Button>
          </div>
        }
      />

      {error && (
        <div className="no-print rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="no-print space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl border border-boss-border bg-boss-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="등록된 품목이 없습니다"
          description="해당 고객의 견적 품목이 없어 인쇄할 내용이 없습니다."
        />
      ) : (
        <div className="print-area mx-auto max-w-4xl rounded-2xl border border-boss-border bg-boss-surface p-8 shadow-boss-lg print:max-w-full print:rounded-none print:bg-white print:p-0 print:text-black print:shadow-none">
          {/* 인쇄용 헤더 */}
          <div className="mb-6 border-b-2 border-slate-100 pb-4 text-center print:border-black">
            <h2 className="text-2xl font-bold text-boss-text print:text-black">견 적 서</h2>
            <p className="mt-1 text-xs text-boss-text-muted print:text-black">견적일: {today}</p>
          </div>

          {/* 회사 / 고객 정보 */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1 rounded-lg border border-boss-border p-3 print:border-black print:bg-white">
              <p className="font-semibold text-boss-text print:text-black">공급받는자 (고객)</p>
              <p className="text-boss-text-secondary print:text-black">고객 ID: {customerId}</p>
              <p className="text-boss-text-muted print:text-black">상호 / 성명: </p>
              <p className="text-boss-text-muted print:text-black">주소: </p>
              <p className="text-boss-text-muted print:text-black">연락처: </p>
            </div>
            <div className="space-y-1 rounded-lg border border-boss-border p-3 print:border-black print:bg-white">
              <p className="font-semibold text-boss-text print:text-black">공급자 (회사)</p>
              <p className="text-boss-text-muted print:text-black">상호: </p>
              <p className="text-boss-text-muted print:text-black">사업자등록번호: </p>
              <p className="text-boss-text-muted print:text-black">주소: </p>
              <p className="text-boss-text-muted print:text-black">연락처 / 이메일: </p>
            </div>
          </div>

          {/* 품목 테이블 */}
          <table className="print-table mb-6 w-full border-collapse border border-boss-border text-sm print:border-black">
            <thead>
              <tr className="bg-boss-elevated/60 print:bg-white">
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  품목명
                </th>
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  규격
                </th>
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  단위
                </th>
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  수량
                </th>
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  단가
                </th>
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  공급가액
                </th>
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  세액
                </th>
                <th className="border border-boss-border px-2 py-2 text-xs font-semibold text-boss-text-secondary print:border-black print:text-black">
                  합계액
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id ?? idx}>
                  <td className="border border-boss-border px-2 py-2 text-boss-text print:border-black print:text-black">
                    {it.itemName || '-'}
                  </td>
                  <td className="border border-boss-border px-2 py-2 text-center text-boss-text-secondary print:border-black print:text-black">
                    {it.itemSpec || '-'}
                  </td>
                  <td className="border border-boss-border px-2 py-2 text-center text-boss-text-secondary print:border-black print:text-black">
                    {it.unit || '-'}
                  </td>
                  <td className="border border-boss-border px-2 py-2 text-right text-boss-text-secondary print:border-black print:text-black">
                    {(it.quantity ?? 0).toLocaleString('ko-KR')}
                  </td>
                  <td className="border border-boss-border px-2 py-2 text-right text-boss-text-secondary print:border-black print:text-black">
                    {fmtMoney(it.unitPrice)}
                  </td>
                  <td className="border border-boss-border px-2 py-2 text-right text-boss-text-secondary print:border-black print:text-black">
                    {fmtMoney(it.supplyAmount)}
                  </td>
                  <td className="border border-boss-border px-2 py-2 text-right text-boss-text-secondary print:border-black print:text-black">
                    {fmtMoney(it.vatAmount)}
                  </td>
                  <td className="border border-boss-border px-2 py-2 text-right font-semibold text-boss-primary print:border-black print:text-black">
                    {fmtMoney(it.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 합계 */}
          <div className="mb-6 ml-auto w-full max-w-sm rounded-lg border border-boss-border p-4 text-sm print:border-black print:bg-white">
            <div className="flex justify-between py-1 text-boss-text-secondary print:text-black">
              <span>공급가액 합계</span>
              <span className="font-semibold text-boss-text print:text-black">{fmtMoney(totals.supplyAmount)} 원</span>
            </div>
            <div className="flex justify-between py-1 text-boss-text-secondary print:text-black">
              <span>세액 합계</span>
              <span className="font-semibold text-boss-text print:text-black">{fmtMoney(totals.vatAmount)} 원</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-boss-border py-2 text-base font-bold text-boss-primary print:border-black print:text-black">
              <span>총 합계</span>
              <span>{fmtMoney(totals.totalAmount)} 원</span>
            </div>
          </div>

          {/* 비고 */}
          <div className="rounded-lg border border-boss-border p-4 text-sm print:border-black print:bg-white">
            <p className="mb-2 font-semibold text-boss-text print:text-black">비고</p>
            <p className="min-h-[60px] whitespace-pre-wrap text-boss-text-muted print:text-black">
              본 견적서는 견적일로부터 30일간 유효합니다.
              자세한 사항은 담당자에게 문의해 주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
