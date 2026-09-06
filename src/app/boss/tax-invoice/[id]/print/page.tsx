'use client';

// 세금계산서 서식 출력 — 국세청 서식(별지 제14호) 조판
//
// 셸 밖에서 단독 렌더링(경로가 /print 로 끝난다). 화면에서는 패널 위 종이, 인쇄 · PDF 는 흰 종이 · 검정 글자.
//   상단: 제목 + [공급받는자 보관용] + 공급자 · 공급받는자 2열 박스(등록번호 · 상호 · 성명 · 주소 · 업태 · 종목)
//   중단: 작성일자 · 공급가액 · 세액 · 비고
//   하단: 품목표(월 · 일 · 품목 · 규격 · 수량 · 단가 · 공급가액 · 세액) → 합계금액 · 이 금액을 (영수/청구) 함
// 현금영수증은 같은 틀에 제목만 "현금영수증(거래 확인용)" 으로 바꾼다.
//
// 주의: 이 서식은 종이 · 파일로 주고받는 참고용이다. 법적 효력이 있는 전자세금계산서는 홈택스 발행분이다.

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import { toKoreanAmountLabel } from '@/lib/boss/koreanAmount';
import { PrintActions } from '@/components/boss/print/PrintActions';
import { AlertBanner, ButtonLink, EmptyState, PageHeader, Skeleton } from '@/components/boss/ui';
import type { BossCompanyData } from '@/types/boss';
import { DOC_TYPE_LABEL, PAY_TYPE_LABEL, type TaxInvoice } from '@/types/boss-taxinvoice';

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');

// 서식 셀 — 사각 · 검정 테두리(인쇄) / 토큰 테두리(화면)
const CELL = 'border border-boss-border px-2 py-1.5 print:border-black';
const HEAD = `${CELL} bg-boss-inset text-center text-[11px] font-semibold text-boss-text-secondary`;
const LABEL = `${CELL} bg-boss-inset text-center text-[11.5px] text-boss-text-secondary`;
const VAL = `${CELL} text-[12.5px] text-boss-text`;

/** 숫자를 자릿수 칸으로 — 서식의 공급가액 · 세액 칸은 자릿수마다 세로줄이 있다 */
function DigitBoxes({ value, width }: { value: number; width: number }) {
  // 칸 수를 넘는 금액은 상위 자리를 자른다 — 서식 칸이 넘쳐 표가 깨지는 것보다 낫다(합계 칸에 전체 금액이 있다)
  const digits = String(Math.abs(Math.round(value)));
  const s = digits.length > width ? digits.slice(-width) : digits.padStart(width, ' ');
  return (
    <div className="flex justify-end">
      {s.split('').map((ch, i) => (
        <span
          key={i}
          className="inline-flex h-7 w-[18px] items-center justify-center border-l border-boss-border font-boss-head text-[13px] tabular-nums text-boss-text first:border-l-0 print:border-black"
        >
          {ch.trim()}
        </span>
      ))}
    </div>
  );
}

export default function BossTaxInvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [data, setData] = useState<TaxInvoice | null>(null);
  const [company, setCompany] = useState<BossCompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await bossTaxInvoiceApi.get(id);
        if (cancelled) return;
        if (res.success !== false && res.data) {
          setData(res.data);
        } else {
          setError(res.message || res.error || '세금계산서를 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 세금계산서를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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
  }, [id]);

  const isTax = data?.docType === 'TAX';
  const title = isTax ? '세 금 계 산 서' : '현 금 영 수 증';
  const issue = data?.issueDate ?? '';
  const [iy, im, idd] = issue ? issue.split('-') : ['', '', ''];
  const buyerLabel = data?.buyerName ? `${data.buyerName}` : `고객`;
  const fileName = `${data ? DOC_TYPE_LABEL[data.docType] : '세금계산서'}_${data?.buyerName ?? id}_${issue || new Date().toISOString().slice(0, 10)}`;
  const shareText = data
    ? `[${company?.name ?? '도배르만'}] ${buyerLabel} ${DOC_TYPE_LABEL[data.docType]}입니다. 공급가액 ${fmt(
        data.supplyAmount
      )}원 · 세액 ${fmt(data.vatAmount)}원 · 합계 ${fmt(data.totalAmount)}원${issue ? ` (${issue})` : ''}`
    : '';

  // 품목표는 최소 4행(서식 관례)
  const rows = data ? [...data.items] : [];
  while (rows.length < 4) rows.push({});

  const companyAddress = [company?.address1, company?.address2].filter(Boolean).join(' ');

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
        }
      `}</style>

      <div className="no-print">
        <PageHeader
          eyebrow={data ? DOC_TYPE_LABEL[data.docType] : '세금계산서'}
          title="서식 출력"
          description={data ? `${buyerLabel} · ${issue || '작성일 미정'}` : ''}
          breadcrumbs={[
            { label: '세금계산서', href: '/boss/tax-invoice' },
            { label: '상세', href: `/boss/tax-invoice/${id}` },
            { label: '서식' },
          ]}
          actions={
            <PrintActions
              targetRef={paperRef}
              fileName={fileName}
              shareTitle={`${buyerLabel} ${data ? DOC_TYPE_LABEL[data.docType] : ''}`}
              shareText={shareText}
              smsPhone={data?.buyerPhone}
              disabled={!data}
            >
              <ButtonLink href={`/boss/tax-invoice/${id}`} variant="secondary">
                상세로
              </ButtonLink>
            </PrintActions>
          }
        />
        <p className="mt-2 text-[12px] leading-relaxed text-boss-text-muted">
          이 서식은 고객과 주고받는 참고용 문서입니다. 세액공제에 쓰이는 전자세금계산서는 홈택스에서 발행한 것이 원본입니다.
        </p>
      </div>

      {error && (
        <div className="no-print">
          <AlertBanner tone="bad">{error}</AlertBanner>
        </div>
      )}

      {loading && !data ? (
        <Skeleton className="no-print h-96" />
      ) : !data ? (
        <div className="no-print">
          <EmptyState
            title="세금계산서를 열지 못했습니다"
            description="삭제됐거나 네트워크가 불안정할 수 있습니다."
            action={
              <ButtonLink href="/boss/tax-invoice" variant="secondary" size="sm">
                목록으로
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div ref={paperRef} className="print-area boss-card p-8 print:p-0">
          {/* 제목 */}
          <div className="mb-4 flex items-end justify-between border-b-2 border-boss-text pb-3 print:border-black">
            <div className="text-[11px] text-boss-text-secondary">
              {data.status === 'ISSUED' && data.approvalNo ? `승인번호 ${data.approvalNo}` : ''}
            </div>
            <h2 className="font-boss-head text-[30px] font-bold tracking-[0.35em] text-boss-text">{title}</h2>
            <div className="text-[11px] text-boss-text-secondary">(공급받는자 보관용)</div>
          </div>

          {/* 공급자 · 공급받는자 */}
          <table className="mb-4 w-full border-collapse text-[12.5px]">
            <tbody>
              <tr>
                <td rowSpan={4} className={`${LABEL} w-7 [writing-mode:vertical-rl] tracking-[0.3em]`}>
                  공급자
                </td>
                <td className={`${LABEL} w-24`}>등록번호</td>
                <td colSpan={3} className={`${VAL} font-boss-head tabular-nums`}>
                  {company?.bizno ?? ''}
                </td>
                <td rowSpan={4} className={`${LABEL} w-7 [writing-mode:vertical-rl] tracking-[0.15em]`}>
                  공급받는자
                </td>
                <td className={`${LABEL} w-24`}>등록번호</td>
                <td colSpan={3} className={`${VAL} font-boss-head tabular-nums`}>
                  {isTax ? data.buyerBizNo ?? '' : data.buyerBizNo || data.buyerPhone || ''}
                </td>
              </tr>
              <tr>
                <td className={LABEL}>상호(법인명)</td>
                <td className={VAL}>{company?.name ?? ''}</td>
                <td className={`${LABEL} w-16`}>성명</td>
                <td className={`${VAL} w-24`}>{company?.owner ?? ''}</td>
                <td className={LABEL}>상호(법인명)</td>
                <td className={VAL}>{data.buyerName ?? ''}</td>
                <td className={`${LABEL} w-16`}>성명</td>
                <td className={`${VAL} w-24`}>{data.buyerCeo ?? ''}</td>
              </tr>
              <tr>
                <td className={LABEL}>사업장 주소</td>
                <td colSpan={3} className={VAL}>
                  {companyAddress}
                </td>
                <td className={LABEL}>사업장 주소</td>
                <td colSpan={3} className={VAL}>
                  {data.buyerAddress ?? ''}
                </td>
              </tr>
              <tr>
                <td className={LABEL}>업태</td>
                <td className={VAL}>{company?.type ?? ''}</td>
                <td className={LABEL}>종목</td>
                <td className={VAL}>{company?.kind ?? ''}</td>
                <td className={LABEL}>업태</td>
                <td className={VAL}>{data.buyerBizType ?? ''}</td>
                <td className={LABEL}>종목</td>
                <td className={VAL}>{data.buyerBizKind ?? ''}</td>
              </tr>
            </tbody>
          </table>

          {/* 작성일자 · 공급가액 · 세액 · 비고 */}
          <table className="mb-4 w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th colSpan={3} className={HEAD}>
                  작성
                </th>
                <th className={HEAD}>공급가액</th>
                <th className={HEAD}>세액</th>
                <th className={`${HEAD} w-40`}>비고</th>
              </tr>
              <tr>
                <th className={`${HEAD} w-14`}>년</th>
                <th className={`${HEAD} w-10`}>월</th>
                <th className={`${HEAD} w-10`}>일</th>
                <th className={`${HEAD} text-[10px] font-normal`}>천 백 십 억 천 백 십 만 천 백 십 일</th>
                <th className={`${HEAD} text-[10px] font-normal`}>십 억 천 백 십 만 천 백 십 일</th>
                <th className={HEAD} />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${VAL} text-center font-boss-head tabular-nums`}>{iy}</td>
                <td className={`${VAL} text-center font-boss-head tabular-nums`}>{im}</td>
                <td className={`${VAL} text-center font-boss-head tabular-nums`}>{idd}</td>
                <td className={`${CELL} p-0`}>
                  <DigitBoxes value={data.supplyAmount} width={12} />
                </td>
                <td className={`${CELL} p-0`}>
                  <DigitBoxes value={data.vatAmount} width={10} />
                </td>
                <td className={`${VAL} text-[11.5px]`}>{data.memo ?? ''}</td>
              </tr>
            </tbody>
          </table>

          {/* 품목 */}
          <table className="mb-4 w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={`${HEAD} w-10`}>월</th>
                <th className={`${HEAD} w-10`}>일</th>
                <th className={HEAD}>품목</th>
                <th className={`${HEAD} w-24`}>규격</th>
                <th className={`${HEAD} w-14`}>수량</th>
                <th className={`${HEAD} w-24`}>단가</th>
                <th className={`${HEAD} w-28`}>공급가액</th>
                <th className={`${HEAD} w-24`}>세액</th>
                <th className={`${HEAD} w-16`}>비고</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it, i) => {
                const d = (it.date ?? '').split('-');
                const has = Boolean(it.name || it.supplyAmount);
                return (
                  <tr key={i} className="h-8">
                    <td className={`${VAL} text-center font-boss-head tabular-nums`}>{has ? d[1] ?? '' : ''}</td>
                    <td className={`${VAL} text-center font-boss-head tabular-nums`}>{has ? d[2] ?? '' : ''}</td>
                    <td className={VAL}>{it.name ?? ''}</td>
                    <td className={`${VAL} text-center`}>{it.spec ?? ''}</td>
                    <td className={`${VAL} text-right font-boss-head tabular-nums`}>{has ? fmt(it.qty) : ''}</td>
                    <td className={`${VAL} text-right font-boss-head tabular-nums`}>{has ? fmt(it.unitPrice) : ''}</td>
                    <td className={`${VAL} text-right font-boss-head tabular-nums`}>{has ? fmt(it.supplyAmount) : ''}</td>
                    <td className={`${VAL} text-right font-boss-head tabular-nums`}>{has ? fmt(it.vatAmount) : ''}</td>
                    <td className={VAL} />
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 합계 · 영수/청구 */}
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={HEAD}>합계금액</th>
                <th className={HEAD}>현금</th>
                <th className={HEAD}>수표</th>
                <th className={HEAD}>어음</th>
                <th className={HEAD}>외상미수금</th>
                <th className={`${HEAD} w-40`}>이 금액을</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${VAL} text-right font-boss-head text-[14px] font-semibold tabular-nums`}>
                  {fmt(data.totalAmount)}
                </td>
                <td className={`${VAL} text-right font-boss-head tabular-nums`}>
                  {data.payType === 'RECEIPT' ? fmt(data.totalAmount) : ''}
                </td>
                <td className={VAL} />
                <td className={VAL} />
                <td className={`${VAL} text-right font-boss-head tabular-nums`}>
                  {data.payType === 'CLAIM' ? fmt(data.totalAmount) : ''}
                </td>
                <td className={`${VAL} text-center font-semibold`}>
                  <span className={data.payType === 'RECEIPT' ? 'text-boss-text' : 'text-boss-text-faint'}>영수</span>
                  {' / '}
                  <span className={data.payType === 'CLAIM' ? 'text-boss-text' : 'text-boss-text-faint'}>청구</span> 함
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-between text-[12px] text-boss-text-secondary">
            <span className="font-boss-head">{toKoreanAmountLabel(data.totalAmount)}</span>
            <span>
              {PAY_TYPE_LABEL[data.payType]} · {company?.name ?? ''}
              {company?.phone ? ` · ${company.phone}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
