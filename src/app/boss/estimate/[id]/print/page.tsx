'use client';

// 견적서 인쇄 — Industry 패턴의 인쇄 화면
// - URL [id] 는 customerId
// - GET /estimateitems/{customerId} 로 품목을 불러와 인쇄용 견적서로 표시
// - 화면에서는 셸(레일 · 헤더)이 그대로 있고, 인쇄할 때만 CSS 로 셸을 숨긴다.
// - 화면에서는 패널 위 종이, 인쇄에서는 흰 종이 · 검정 글자 · 사각 테두리.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import { ButtonLink, EmptyState, AlertBanner, Skeleton, DetailActions } from '@/components/boss/ui';
import { PrintActions } from '@/components/boss/print/PrintActions';
import EstimateDoc from '@/components/boss/print/EstimateDoc';
import DocStylePicker from '@/components/boss/print/DocStylePicker';
import { ESTIMATE_STYLES } from '@/components/boss/print/docTypes';
import { buildDocMeta } from '@/lib/boss/docMeta';
import { toKoreanAmountApp } from '@/lib/boss/koreanAmount';
import { loadDocStyle, saveDocStyle } from '@/lib/boss/docStyle';
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


export default function BossEstimatePrintPage() {
  const params = useParams<{ id: string }>();
  const customerId = decodeURIComponent(params?.id ?? '');

  const [items, setItems] = useState<BossEstimateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 종이 위 공급받는자 · 공급자 정보. 못 읽으면 칸을 비워 둔다(지어내지 않는다).
  const [customer, setCustomer] = useState<BossCustomerData | null>(null);
  const [company, setCompany] = useState<BossCompanyData | null>(null);
  // 앱과 같은 5종 양식 — 고른 값을 기억한다
  const [styleKey, setStyleKey] = useState<string>(ESTIMATE_STYLES[0].key);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStyleKey(loadDocStyle('estimate', ESTIMATE_STYLES[0].key));
  }, []);

  const changeStyle = (key: string) => {
    setStyleKey(key);
    saveDocStyle('estimate', key);
  };

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

  const style = ESTIMATE_STYLES.find((s) => s.key === styleKey) ?? ESTIMATE_STYLES[0];
  const docMeta = useMemo(() => buildDocMeta(), []);
  const docData = useMemo(
    () => ({
      company,
      customer,
      user: BossAuthManager.getUserInfo(),
      items,
      totals,
      meta: docMeta,
      hasTaxFree: items.some((it) => it.isTaxFree === 'Y'),
      totalAmountKor: toKoreanAmountApp(totals.totalAmount),
    }),
    [company, customer, items, totals, docMeta]
  );

  const customerLabel = customer?.name ? `${customer.name}님` : `고객 ${customerId}`;
  const fileName = `견적서_${customer?.name ?? customerId}_${new Date().toISOString().slice(0, 10)}`;
  // 공유 · 문자에 들어가는 요약 — 파일이 못 붙는 문자에서도 핵심이 전달되게
  const shareText = `[${company?.name ?? '도배르만'}] ${customerLabel} 견적서입니다. 총 합계 ${fmtMoney(
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
          /* 화면에서는 레일 · 헤더를 두되, 종이에는 문서만 나가게 한다 */
          .boss-shell > aside,
          .boss-shell-main > header,
          .boss-shell nav[aria-label='주요 메뉴'] {
            display: none !important;
          }
          .boss-shell {
            display: block !important;
          }
          .boss-shell-main {
            padding: 0 !important;
          }
          .boss-shell-main > div {
            max-width: none !important;
            padding: 0 !important;
          }
          .print-area {
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* 문서 색(양식별 강조색 · 표 머리)은 그대로 인쇄한다 — 앱 PDF 와 같은 인상 */
          .print-area,
          .print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* 셸 헤더가 화면 제목을 그린다 — 여기서는 문서 이름과 내보내기 버튼만 */}
      <DetailActions
        note={
          <>
            <span className="font-boss-head text-[14px] font-semibold text-boss-text">견적서 출력</span>
            <span>{customerLabel} · {today}</span>
          </>
        }
      >
        <PrintActions
          targetRef={paperRef}
          fileName={fileName}
          shareTitle={`${customerLabel} 견적서`}
          shareText={shareText}
          smsPhone={customer?.phone}
          disabled={items.length === 0}
          pdfDocFactory={
            items.length
              ? async () => {
                  // 무거운 PDF 라이브러리는 버튼을 누를 때만 불러온다
                  const mod = await import('@/components/boss/print/pdf/EstimatePdf');
                  mod.registerPdfFont();
                  const Doc = mod.default;
                  return <Doc data={docData} p={style.palette} styleKey={styleKey} />;
                }
              : null
          }
        >
          <ButtonLink href="/boss/estimate" variant="secondary">
            목록으로
          </ButtonLink>
          <ButtonLink href={`/boss/estimate/${encodeURIComponent(customerId)}/receipt`} variant="secondary">
            영수증
          </ButtonLink>
          <ButtonLink href={`/boss/tax-invoice/new?customerId=${encodeURIComponent(customerId)}`} variant="secondary">
            세금계산서
          </ButtonLink>
        </PrintActions>
      </DetailActions>

      <DocStylePicker styles={ESTIMATE_STYLES} value={styleKey} onChange={changeStyle} label="견적서 양식" />

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
        <div ref={paperRef} className="print-area boss-card p-8 print:border-0 print:p-0 print:shadow-none">
          <EstimateDoc styleKey={styleKey} data={docData} palette={style.palette} />
        </div>
      )}
    </div>
  );
}
