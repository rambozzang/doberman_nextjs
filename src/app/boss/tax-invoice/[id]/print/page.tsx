'use client';

// 세금계산서 · 현금영수증 미리보기 · PDF · 인쇄
//
// 문서는 GET /taxinvoices/{id}/document 한 번으로 읽는다(외부 호출 없음). 공급자는 서버가 고른 값만 쓴다 —
// 발급을 시도한 문서는 발급 당시 스냅샷, 미발급은 지금 회사 정보. 없으면 종이에 "공급자 정보 없음"을 찍고 다른 값으로 채우지 않는다.
// 서버가 아직 이 경로를 배포하지 않았을 때만 예전 방식(문서 + 회사 정보 · 발급 스냅샷)으로 모으고 화면에 알린다.
//
// 세금계산서는 A4 국세청 출력 서식, 현금영수증은 별도 영수증 서식(TaxInvoicePdf · CashReceiptPdf).
// 화면 미리보기 · PDF 저장 · 이미지 · 인쇄가 모두 같은 PDF 에서 나온다. 미발급 · 시험 · 결과 불명 · 취소 표시는 종이 안에 찍힌다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import { supplierFromCompany } from '@/lib/boss/taxInvoiceRegistration';
import {
  amountMismatch,
  approvalText,
  cashIdentityLine,
  cashItemNameOf,
  displayState,
  documentFileName,
  documentShareText,
  paperItems,
  paperState,
  tradeDateText,
} from '@/lib/boss/taxInvoiceDocument';
import { planPdfFont } from '@/components/boss/taxinvoice/pdf/fontPlan';
import type { PaperModel } from '@/components/boss/taxinvoice/pdf/paper';
import DocumentPreview from '@/components/boss/taxinvoice/DocumentPreview';
import { PrintActions } from '@/components/boss/print/PrintActions';
import { AlertBanner, Button, ButtonLink, DetailActions, EmptyState, Skeleton, Tag } from '@/components/boss/ui';
import { DOC_TYPE_LABEL, isProviderManaged, type TaxInvoice, type TaxInvoiceSupplier } from '@/types/boss-taxinvoice';

type Loaded = {
  invoice: TaxInvoice;
  supplier: TaxInvoiceSupplier | null;
  supplierNote: string | null;
  /** document = 서버 서식 API, fallback = 서버 미반영이라 화면이 모음 */
  source: 'document' | 'fallback';
};

const SUPPLIER_MISSING = '공급자 정보 없음 — 서버에서 받지 못했습니다. 다른 회사 정보로 채우지 않았습니다.';

function nowText() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 종이에 찍힐 글자 전부 — 글꼴 고르기용 */
function paperTexts(l: Loaded): string[] {
  const inv = l.invoice;
  const s = l.supplier;
  const st = paperState(inv);
  const texts = [
    inv.buyerName, inv.buyerBizNo, inv.buyerCeo, inv.buyerAddress, inv.buyerBizType, inv.buyerBizKind, inv.buyerEmail,
    inv.itemSummary, approvalText(inv), st.banner, st.note, st.watermark, l.supplierNote,
    s?.name, s?.ceo, s?.address, s?.bizType, s?.bizKind, s?.email, s?.phone, s?.bizNo,
    ...paperItems(inv).flatMap((it) => [it.name, it.spec]),
  ];
  if (inv.docType === 'CASH') {
    const c = cashIdentityLine(inv);
    texts.push(c.usage, c.kind, c.masked, tradeDateText(inv), inv.providerCancelApprovalNo, cashItemNameOf(inv).name);
  }
  return texts.filter((t): t is string => typeof t === 'string' && t.length > 0);
}

export default function BossTaxInvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printedAt, setPrintedAt] = useState(nowText);
  const [pageCount, setPageCount] = useState(0);
  const paperRef = useRef<HTMLDivElement>(null);
  // 늦게 도착한 이전 응답이 새 응답을 덮지 않게
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!id) return;
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await bossTaxInvoiceApi.document(id);
      if (my !== seq.current) return;
      if (res.ok) {
        const { invoice, supplier, issues } = res.document;
        setLoaded({ invoice, supplier, supplierNote: supplier ? null : issues[0] ? `공급자 정보 없음 — ${issues[0]}` : SUPPLIER_MISSING, source: 'document' });
        setPrintedAt(nowText());
        return;
      }
      if (res.failure !== 'not-deployed') {
        setError(res.message);
        return;
      }
      // 서버 미반영 — 예전 방식으로 모은다. 전자 발급 문서는 발급 당시 스냅샷만, 나머지는 지금 회사 정보
      const got = await bossTaxInvoiceApi.get(id);
      if (my !== seq.current) return;
      if (got.success === false || !got.data) {
        setError(got.message || got.error || '문서를 불러오지 못했습니다.');
        return;
      }
      const invoice = { ...got.data, items: Array.isArray(got.data.items) ? got.data.items : [] };
      let supplier: TaxInvoiceSupplier | null = null;
      if (isProviderManaged(invoice)) {
        const pv = await bossTaxInvoiceApi.electronicPreview(id);
        supplier = pv.success !== false && pv.data?.supplier ? pv.data.supplier : null;
      } else {
        const companyId = BossAuthManager.getUserInfo()?.companyId;
        const company = companyId ? await bossCompanyApi.get(companyId) : null;
        supplier = company && company.success !== false && company.data ? supplierFromCompany(company.data) : null;
      }
      if (my !== seq.current) return;
      setLoaded({ invoice, supplier, supplierNote: supplier ? null : SUPPLIER_MISSING, source: 'fallback' });
      setPrintedAt(nowText());
    } catch {
      if (my === seq.current) setError('네트워크 오류로 문서를 불러오지 못했습니다.');
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const plan = useMemo(() => (loaded ? planPdfFont(paperTexts(loaded)) : null), [loaded]);
  const model: PaperModel | null = useMemo(
    () =>
      loaded && plan
        ? {
            invoice: loaded.invoice,
            supplier: loaded.supplier,
            supplierNote: loaded.supplierNote,
            state: paperState(loaded.invoice),
            fontFamily: plan.family,
            printedAt,
          }
        : null,
    [loaded, plan, printedAt],
  );
  const renderKey = useMemo(() => (model ? JSON.stringify(model) : ''), [model]);

  // PDF 는 그릴 때만 불러온다(정적 import 금지 — 화면이 죽는다). 미리보기 · 저장 · 공유가 같은 함수를 쓴다.
  const makePdf = useCallback(async () => {
    if (!model) throw new Error('document not loaded');
    const [paper, mod] = await Promise.all([
      import('@/components/boss/taxinvoice/pdf/paper'),
      model.invoice.docType === 'CASH'
        ? import('@/components/boss/taxinvoice/pdf/CashReceiptPdf')
        : import('@/components/boss/taxinvoice/pdf/TaxInvoicePdf'),
    ]);
    paper.registerTaxPdfFonts();
    const Doc = mod.default;
    return <Doc model={model} />;
  }, [model]);

  const inv = loaded?.invoice ?? null;
  const ds = inv ? displayState(inv) : null;
  const docLabel = inv ? DOC_TYPE_LABEL[inv.docType] : '세금계산서';
  const mismatch = inv ? amountMismatch(inv) : null;
  const legacyCash = inv?.docType === 'CASH' && cashIdentityLine(inv).inferred;
  const editable = inv ? !isProviderManaged(inv) : false;

  return (
    <div className="flex flex-col gap-4">
      {/* 인쇄 — 종이 그림만 A4 한 쪽에 한 장씩. PDF 와 같은 쪽 수, 빈 쪽 0, 화면 UI 글자 0.
       *  모바일 폭에서는 셸의 상단 바(sticky) · 화면 머리글이 종이 앞에 자리를 차지해 첫 그림(297mm)이 다음 쪽으로 밀리고
       *  빈 첫 쪽이 생겼다. 하단 탭(position: fixed)은 쪽마다 찍혔다. 그래서 종이로 가는 길 밖의 요소는 모두 숨기고,
       *  종이를 감싼 상자들의 여백 · 최소 높이 · 간격 · 고정 위치를 없앤다. 이 스타일은 이 화면에 있을 때만 붙는다. */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            background: #ffffff !important;
          }
          /* 종이(.print-area)를 품지 않은 요소는 모두 숨긴다 — 레일 · 모바일 상단 바 · 서랍 · 하단 탭 · 화면 머리글 · 알림 · 광고 */
          body *:not(:has(.print-area)):not(.print-area):not(.print-area *) {
            display: none !important;
          }
          /* :has 를 모르는 브라우저용 — 셸 조각을 직접 숨긴다 */
          .boss-shell > :not(.boss-shell-main),
          .boss-shell-main > header,
          [data-rht-toaster],
          .no-print {
            display: none !important;
          }
          /* 종이를 감싼 상자 — 여백 · 최소 높이 · 간격 · sticky/fixed · 그림자 · 넘침 제거 */
          body *:has(.print-area),
          .boss-shell,
          .boss-shell-main,
          .boss-shell-main > div,
          .print-area,
          .tax-paper-preview,
          .tax-paper-scroll,
          .tax-paper-stack {
            display: block !important;
            position: static !important;
            min-height: 0 !important;
            height: auto !important;
            width: auto !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: transparent !important;
          }
          /* 쪽 그림 = A4 한 장. 높이를 297mm 에서 조금 줄여 반올림으로 다음 쪽(빈 쪽)이 생기지 않게 한다 */
          .tax-paper-page {
            display: block !important;
            position: relative !important;
            width: 210mm !important;
            height: 296.5mm !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            background: #ffffff !important;
            break-inside: avoid;
            page-break-inside: avoid;
            break-after: page;
            page-break-after: always;
          }
          .tax-paper-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          .tax-paper-page img {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: contain;
          }
        }
      `}</style>

      <DetailActions
        note={
          inv && ds ? (
            <>
              <span className="font-boss-head text-[14px] font-semibold text-boss-text">{docLabel} 미리보기</span>
              <Tag tone={ds.tone}>{ds.label}</Tag>
              {ds.test && <Tag tone="warn">시험 · 효력 없음</Tag>}
            </>
          ) : (
            <span className="font-boss-head text-[14px] font-semibold text-boss-text">문서 미리보기</span>
          )
        }
      >
        <PrintActions
          targetRef={paperRef}
          fileName={inv ? documentFileName(inv, id) : `세금계산서_${id}`}
          shareTitle={inv ? `${docLabel}${inv.buyerName ? ` · ${inv.buyerName}` : ''}` : docLabel}
          shareText={inv ? documentShareText(inv, loaded?.supplier?.name) : ''}
          smsPhone={inv?.buyerPhone}
          disabled={!model || pageCount === 0}
          pdfDocFactory={model ? makePdf : null}
        >
          <ButtonLink href={`/boss/tax-invoice/${id}`} variant="secondary">
            상세로
          </ButtonLink>
          {editable && (
            <ButtonLink href={`/boss/tax-invoice/new?id=${id}`} variant="secondary" icon={Pencil}>
              수정
            </ButtonLink>
          )}
        </PrintActions>
      </DetailActions>

      {error && (
        <div className="no-print">
          <AlertBanner
            tone="bad"
            action={
              <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
                다시 시도
              </Button>
            }
          >
            {error}
          </AlertBanner>
        </div>
      )}

      {loaded && (
        <div className="no-print flex flex-col gap-2">
          {loaded.source === 'fallback' && (
            <AlertBanner tone="info">
              서버에 문서 서식 기능이 아직 반영되지 않아 화면에서 문서와 {isProviderManaged(loaded.invoice) ? '발급 당시 공급자 정보' : '지금 회사 정보'}를 모아
              그렸습니다. 서버 반영 후에는 서버가 고른 공급자 값으로 표시됩니다.
            </AlertBanner>
          )}
          {!loaded.supplier && (
            <AlertBanner
              tone="warn"
              action={
                <ButtonLink href="/boss/tax-invoice/registration" variant="secondary" size="sm">
                  발급 서비스 등록
                </ButtonLink>
              }
            >
              공급자(우리 회사) 정보를 받지 못해 종이에 &lsquo;공급자 정보 없음&rsquo;으로 표시했습니다. 다른 회사 정보로 채우지 않습니다. 회사 정보와 발급
              서비스 등록 상태를 확인하세요.
            </AlertBanner>
          )}
          {mismatch && <AlertBanner tone="warn">{mismatch}</AlertBanner>}
          {legacyCash && (
            <AlertBanner
              tone="warn"
              action={
                editable ? (
                  <ButtonLink href={`/boss/tax-invoice/new?id=${id}`} variant="secondary" size="sm">
                    확인 · 수정
                  </ButtonLink>
                ) : undefined
              }
            >
              예전 현금영수증 기록이라 용도 · 식별번호 · 과세 구분 중 비어 있는 값이 있습니다. 종이에는 추정값과 &lsquo;미지정 · 확인 필요&rsquo;로 표시했으니 수정 화면에서 확인한 뒤 저장하세요.
            </AlertBanner>
          )}
          {plan && plan.unsupported.length > 0 && (
            <AlertBanner tone="warn">
              다음 글자는 PDF 글꼴에 없어 종이에 빈칸으로 나옵니다: {plan.unsupported.join(' ')} — 상호 · 품목 표기를 바꾸거나 홈택스 원본을 쓰세요.
            </AlertBanner>
          )}
          {pageCount > 1 && (
            <p className="text-[12px] leading-relaxed text-boss-text-muted">
              {pageCount}쪽 문서입니다. 이미지 저장 · 공유는 첫 쪽만 담기므로 전체는 PDF 저장이나 인쇄를 쓰세요.
            </p>
          )}
        </div>
      )}

      {loading && !loaded ? (
        <Skeleton className="no-print mx-auto aspect-[210/297] w-full max-w-[794px]" />
      ) : !model ? (
        <div className="no-print">
          <EmptyState
            title="문서를 열지 못했습니다"
            description="삭제됐거나 네트워크가 불안정할 수 있습니다. 다시 시도하거나 목록에서 다시 골라 주세요."
            action={
              <ButtonLink href="/boss/tax-invoice" variant="secondary" size="sm">
                목록으로
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div ref={paperRef} className="print-area">
          <DocumentPreview
            docFactory={makePdf}
            renderKey={renderKey}
            alt={`${docLabel} 미리보기`}
            onPages={setPageCount}
          />
        </div>
      )}
    </div>
  );
}
