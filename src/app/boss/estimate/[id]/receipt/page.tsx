'use client';

// 거래 명세서(영수증) 인쇄 — Industry 패턴의 인쇄 화면
// - URL [id] 는 customerId
// - GET /estimateitems/{customerId} 로 품목을 불러와 거래 명세서로 표시
// - 셸(레일 · 헤더) 없이 단독 렌더링된다(BossChrome 이 /receipt 경로를 제외한다). 그래서 PageHeader 를 여기서 그린다.
// - 화면에서는 패널 위 종이, 인쇄에서는 흰 종이 · 검정 글자 · 사각 테두리.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import { PageHeader, ButtonLink, EmptyState, AlertBanner, Skeleton } from '@/components/boss/ui';
import { PrintActions } from '@/components/boss/print/PrintActions';
import type { BossEstimateItem, BossEstimateTotals } from '@/types/boss-estimate';
import type { BossCustomerData } from '@/types/boss-customer';
import type { BossCompanyData } from '@/types/boss';

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

// 인쇄 표 셀 — 사각 · 검정 테두리(인쇄) / 토큰 테두리(화면)
const TH = 'border border-boss-border px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-boss-text-secondary print:border-black';
const TD = 'border border-boss-border px-2 py-2 print:border-black';
const NUM = 'font-boss-head tabular-nums text-right';
const BOX = 'border border-boss-border p-4 print:border-black';

export default function BossEstimateReceiptPage() {
  const params = useParams<{ id: string }>();
  const customerId = decodeURIComponent(params?.id ?? '');

  const [items, setItems] = useState<BossEstimateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 종이 위 공급받는자 · 공급자 정보. 못 읽으면 칸을 비워 둔다(지어내지 않는다).
  const [customer, setCustomer] = useState<BossCustomerData | null>(null);
  const [company, setCompany] = useState<BossCompanyData | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (customerId) {
      bossCustomersApi
        .get(customerId)
        .then((res) => {
          if (!cancelled && res.success !== false && res.data) setCustomer(res.data);
        })
        .catch(() => {});
    }
    const companyId = BossAuthManager.getUserInfo()?.companyId;
    if (companyId) {
      bossCompanyApi
        .get(companyId)
        .then((res) => {
          if (!cancelled && res.success !== false && res.data) setCompany(res.data);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [customerId]);

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

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const customerAddress = [customer?.address1, customer?.address2].filter(Boolean).join(' ');
  const companyAddress = [company?.address1, company?.address2].filter(Boolean).join(' ');
  const customerLabel = customer?.name ? `${customer.name}님` : `고객 ${customerId}`;
  const fileName = `거래명세서_${customer?.name ?? customerId}_${new Date().toISOString().slice(0, 10)}`;
  // 공유 · 문자에 들어가는 요약 — 파일이 못 붙는 문자에서도 핵심이 전달되게
  const shareText = `[${company?.name ?? '도배르만'}] ${customerLabel} 거래 명세서입니다. 총 합계 ${fmtMoney(
    totals.totalAmount
  )}원 · ${today}`;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-6 print:max-w-full print:p-0 sm:px-7">
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
            background: transparent !important;
          }
          /* 표 머리글 · 라벨 칸은 옅은 회색을 남겨 본문 칸과 구분되게 */
          .print-area .bg-boss-inset {
            background: #eeeeee !important;
          }
          .print-table,
          .print-table th,
          .print-table td {
            border-color: #000000 !important;
          }
        }
      `}</style>

      <div className="no-print">
        <PageHeader
          eyebrow="거래 명세서"
          title="영수증 출력"
          description={`고객 ID ${customerId || '-'} · 거래일 ${today}`}
          breadcrumbs={[{ label: '견적서', href: '/boss/estimate' }, { label: '영수증' }]}
          actions={
            <PrintActions
              targetRef={paperRef}
              fileName={fileName}
              shareTitle={`${customerLabel} 거래 명세서`}
              shareText={shareText}
              smsPhone={customer?.phone}
              disabled={items.length === 0}
            >
              <ButtonLink href="/boss/estimate" variant="secondary">
                목록으로
              </ButtonLink>
              <ButtonLink href={`/boss/estimate/${encodeURIComponent(customerId)}/print`} variant="secondary">
                견적서
              </ButtonLink>
              <ButtonLink href={`/boss/tax-invoice/new?customerId=${encodeURIComponent(customerId)}`} variant="secondary">
                세금계산서
              </ButtonLink>
            </PrintActions>
          }
        />
      </div>

      {error && (
        <div className="no-print">
          <AlertBanner tone="bad">{error}</AlertBanner>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="no-print flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="no-print">
          <EmptyState
            title={error ? '품목을 불러오지 못했습니다' : '등록된 품목이 없습니다'}
            description={
              error
                ? '네트워크 상태를 확인하고 새로고침하세요.'
                : '이 고객의 견적 품목이 없어 인쇄할 내용이 없습니다. 앱에서 품목을 추가한 뒤 다시 열어 주세요.'
            }
            action={
              <ButtonLink href="/boss/estimate" variant="secondary" size="sm">
                견적서 목록
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div ref={paperRef} className="print-area boss-card p-8 print:p-0">
          {/* 인쇄용 헤더 */}
          <div className="mb-6 border-b-2 border-boss-text pb-4 text-center print:border-black">
            <h2 className="font-boss-head text-[28px] font-bold tracking-[0.3em] text-boss-text">
              거래 명세서
            </h2>
            <p className="mt-1 text-[12px] text-boss-text-secondary">(영수증) · 거래일: {today}</p>
          </div>

          {/* 회사 / 고객 정보 */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-[13px]">
            <div className={`${BOX} flex flex-col gap-1`}>
              <p className="font-semibold text-boss-text">공급받는자 (고객)</p>
              <p className="text-boss-text-secondary">
                고객 ID: <span className="font-boss-head tabular-nums">{customerId}</span>
              </p>
              <p className="text-boss-text-secondary">
                상호 / 성명: <span className="text-boss-text">{customer?.name ?? ''}</span>
              </p>
              <p className="text-boss-text-secondary">
                주소: <span className="text-boss-text">{customerAddress}</span>
              </p>
              <p className="text-boss-text-secondary">
                연락처: <span className="font-boss-head tabular-nums text-boss-text">{customer?.phone ?? ''}</span>
              </p>
            </div>
            <div className={`${BOX} flex flex-col gap-1`}>
              <p className="font-semibold text-boss-text">공급자 (회사)</p>
              <p className="text-boss-text-secondary">
                상호: <span className="text-boss-text">{company?.name ?? ''}</span>
                {company?.owner ? <span className="text-boss-text"> (대표 {company.owner})</span> : null}
              </p>
              <p className="text-boss-text-secondary">
                사업자등록번호:{' '}
                <span className="font-boss-head tabular-nums text-boss-text">{company?.bizno ?? ''}</span>
              </p>
              <p className="text-boss-text-secondary">
                주소: <span className="text-boss-text">{companyAddress}</span>
              </p>
              <p className="text-boss-text-secondary">
                연락처 / 이메일:{' '}
                <span className="font-boss-head tabular-nums text-boss-text">
                  {[company?.phone, company?.email].filter(Boolean).join(' / ')}
                </span>
              </p>
            </div>
          </div>

          {/* 품목 테이블 */}
          <table className="print-table mb-6 w-full border-collapse border border-boss-border text-[13px] print:border-black">
            <thead>
              <tr className="bg-boss-inset">
                <th className={TH}>품목명</th>
                <th className={TH}>규격</th>
                <th className={TH}>단위</th>
                <th className={`${TH} text-right`}>수량</th>
                <th className={`${TH} text-right`}>단가</th>
                <th className={`${TH} text-right`}>공급가액</th>
                <th className={`${TH} text-right`}>세액</th>
                <th className={`${TH} text-right`}>합계액</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id ?? idx}>
                  <td className={`${TD} text-boss-text`}>{it.itemName || '-'}</td>
                  <td className={`${TD} text-center text-boss-text-secondary`}>{it.itemSpec || '-'}</td>
                  <td className={`${TD} text-center text-boss-text-secondary`}>{it.unit || '-'}</td>
                  <td className={`${TD} ${NUM} text-boss-text-secondary`}>
                    {(it.quantity ?? 0).toLocaleString('ko-KR')}
                  </td>
                  <td className={`${TD} ${NUM} text-boss-text-secondary`}>{fmtMoney(it.unitPrice)}</td>
                  <td className={`${TD} ${NUM} text-boss-text-secondary`}>{fmtMoney(it.supplyAmount)}</td>
                  <td className={`${TD} ${NUM} text-boss-text-secondary`}>{fmtMoney(it.vatAmount)}</td>
                  <td className={`${TD} ${NUM} font-semibold text-boss-text`}>{fmtMoney(it.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 합계 */}
          <div className={`${BOX} mb-6 ml-auto w-full max-w-sm text-[13px]`}>
            <div className="flex justify-between py-1 text-boss-text-secondary">
              <span>공급가액 합계</span>
              <span className="font-boss-head font-semibold tabular-nums text-boss-text">
                {fmtMoney(totals.supplyAmount)} 원
              </span>
            </div>
            <div className="flex justify-between py-1 text-boss-text-secondary">
              <span>세액 합계</span>
              <span className="font-boss-head font-semibold tabular-nums text-boss-text">
                {fmtMoney(totals.vatAmount)} 원
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-boss-border py-2 text-[15px] font-bold text-boss-text print:border-black">
              <span>총 합계</span>
              <span className="font-boss-head text-[18px] tabular-nums">{fmtMoney(totals.totalAmount)} 원</span>
            </div>
          </div>

          {/* 서명 / 도장 영역 */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-[13px]">
            <div className={BOX}>
              <p className="mb-8 font-semibold text-boss-text">공급받는자 서명 / 도장</p>
              <div className="mt-12 border-t border-boss-border pt-2 text-boss-text-secondary print:border-black">
                서명: _____________________
              </div>
            </div>
            <div className={BOX}>
              <p className="mb-8 font-semibold text-boss-text">공급자 서명 / 도장</p>
              <div className="mt-12 border-t border-boss-border pt-2 text-boss-text-secondary print:border-black">
                서명: _____________________
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className={`${BOX} text-[13px]`}>
            <p className="mb-2 font-semibold text-boss-text">비고</p>
            <p className="min-h-[60px] whitespace-pre-wrap leading-relaxed text-boss-text-secondary">
              위 금액을 영수(청구)하였습니다.
              본 거래 명세서는 견적 품목을 기준으로 작성되었습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
