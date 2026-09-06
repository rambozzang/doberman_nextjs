'use client';

// 세금계산서 · 현금영수증 발행 관리 — Industry 패턴
//
// 좌: 연도 · 분기 선택 + 상태 탭 + 표(작성일 · 유형 · 공급받는자 · 사업자번호 · 공급가액 · 세액 · 합계 · 상태 · 승인번호)
// 우: 분기 요약(발행 완료 합계 · 요청 대기) + 부가세 예상(매출세액 − 매입세액) + 신고 기한 + 홈택스 바로가기
//
// 실제 발행은 홈택스에서 한다. 이 화면은 "누구에게 언제 얼마를 끊었는지"와 "이번 분기 부가세가 얼마 나올지"를 답한다.
// 화면 제목 · "발행 등록" 버튼은 셸 헤더(nav.ts PAGE_META)가 담당한다.

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import {
  DOC_TYPE_LABEL,
  STATUS_LABEL,
  type TaxInvoice,
  type TaxInvoicePeriodSummary,
  type TaxInvoiceStatus,
  type VatSummary,
} from '@/types/boss-taxinvoice';
import {
  AlertBanner,
  Bar,
  Button,
  ButtonLink,
  DataTable,
  DescRow,
  EmptyState,
  ListTabs,
  MetricBox,
  Panel,
  RowSkeleton,
  Segmented,
  Tag,
  type StatusTone,
} from '@/components/boss/ui';

type Tab = 'all' | TaxInvoiceStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'REQUESTED', label: '발행 요청' },
  { key: 'ISSUED', label: '발행 완료' },
  { key: 'CANCELED', label: '취소' },
];

const STATUS_TONE: Record<TaxInvoiceStatus, StatusTone> = {
  REQUESTED: 'warn',
  ISSUED: 'ok',
  CANCELED: 'neutral',
};

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');

function currentQuarter(d = new Date()) {
  return Math.floor(d.getMonth() / 3) + 1;
}

function daysLeft(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export default function BossTaxInvoicePage() {
  return (
    <Suspense fallback={<RowSkeleton rows={6} />}>
      <TaxInvoiceList />
    </Suspense>
  );
}

function TaxInvoiceList() {
  const router = useRouter();
  const search = useSearchParams();
  const initialTab = search.get('status');
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState<number>(currentQuarter(now));
  const [tab, setTab] = useState<Tab>(
    initialTab === 'REQUESTED' || initialTab === 'ISSUED' || initialTab === 'CANCELED' ? initialTab : 'all'
  );
  const [period, setPeriod] = useState<TaxInvoicePeriodSummary | null>(null);
  const [vat, setVat] = useState<VatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, v] = await Promise.all([
        bossTaxInvoiceApi.period(year, quarter),
        bossTaxInvoiceApi.vatSummary(year, quarter),
      ]);
      if (p.success !== false && p.data) {
        setPeriod(p.data);
      } else {
        setPeriod(null);
        setError(p.message || p.error || '세금계산서 목록을 불러오지 못했습니다.');
      }
      setVat(v.success !== false && v.data ? v.data : null);
    } catch {
      setPeriod(null);
      setVat(null);
      setError('네트워크 오류로 세금계산서 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [year, quarter]);

  useEffect(() => {
    void load();
  }, [load]);

  const invoices = useMemo(() => {
    const list = period?.invoices ?? [];
    return tab === 'all' ? list : list.filter((i) => i.status === tab);
  }, [period, tab]);

  const counts = useMemo(() => {
    const list = period?.invoices ?? [];
    return {
      all: list.length,
      REQUESTED: list.filter((i) => i.status === 'REQUESTED').length,
      ISSUED: list.filter((i) => i.status === 'ISSUED').length,
      CANCELED: list.filter((i) => i.status === 'CANCELED').length,
    };
  }, [period]);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y, y - 1, y - 2];
  }, [now]);

  return (
    <div className="flex flex-col gap-4">
      {/* ── 필터 한 줄: 연도 · 분기 · 상태 · 새로고침 ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented
          ariaLabel="연도"
          value={String(year)}
          onChange={(v) => setYear(Number(v))}
          options={years.map((y) => ({ key: String(y), label: `${y}년` }))}
        />
        <Segmented
          ariaLabel="분기"
          value={String(quarter)}
          onChange={(v) => setQuarter(Number(v))}
          options={[
            { key: '1', label: '1분기' },
            { key: '2', label: '2분기' },
            { key: '3', label: '3분기' },
            { key: '4', label: '4분기' },
            { key: '0', label: '연간' },
          ]}
        />
        <ListTabs
          ariaLabel="상태"
          tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] }))}
          active={tab}
          onChange={setTab}
        />
        <span className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : period ? `${period.from} ~ ${period.to} · ${counts.all}건` : ''}
        </span>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void load()} disabled={loading}>
          새로고침
        </Button>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void load()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── 목록 ── */}
        <div className="min-w-0">
          {loading && !period ? (
            <div className="boss-card-content">
              <RowSkeleton rows={6} />
            </div>
          ) : invoices.length === 0 ? (
            error ? (
              <EmptyState
                title="세금계산서 목록을 불러오지 못했습니다"
                description="네트워크 상태를 확인한 뒤 다시 시도하세요. 서버가 아직 이 기능을 배포하지 않았다면 잠시 뒤 다시 열어 주세요."
                action={
                  <Button variant="secondary" size="sm" onClick={() => void load()}>
                    다시 시도
                  </Button>
                }
              />
            ) : tab !== 'all' ? (
              <EmptyState
                title={`${STATUS_LABEL[tab]} 상태인 건이 없습니다`}
                description="다른 상태 탭을 보거나 분기를 바꿔 보세요."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setTab('all')}>
                    전체 보기
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="이 기간에 등록한 세금계산서가 없습니다"
                description="고객이 세금계산서나 현금영수증을 요청하면 여기에 등록해 두세요. 사업자번호 · 금액을 정리해 두면 홈택스 발행이 빨라지고, 분기 부가세도 미리 보입니다."
                action={
                  <ButtonLink href="/boss/tax-invoice/new" variant="primary" size="sm">
                    발행 등록
                  </ButtonLink>
                }
              />
            )
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>작성일</th>
                  <th>유형</th>
                  <th>공급받는자</th>
                  <th>사업자번호</th>
                  <th className="num">공급가액</th>
                  <th className="num">세액</th>
                  <th className="num">합계</th>
                  <th>상태</th>
                  <th>승인번호</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <InvoiceRow key={inv.id} inv={inv} onOpen={() => router.push(`/boss/tax-invoice/${inv.id}`)} />
                ))}
              </tbody>
            </DataTable>
          )}
        </div>

        {/* ── 우측: 분기 요약 · 부가세 예상 ── */}
        <div className="flex flex-col gap-4">
          <Panel kicker={period ? `${period.year}년 ${period.quarter ? `${period.quarter}분기` : '연간'}` : '기간'} title="발행 요약">
            {period ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox label="발행 완료" value={`${period.issuedCount}건`} />
                  <MetricBox label="발행 요청" value={`${period.requestedCount}건`} />
                </div>
                <dl className="mt-3">
                  <DescRow label="발행 공급가액" value={`${fmt(period.issuedSupplyAmount)}원`} />
                  <DescRow label="발행 세액" value={`${fmt(period.issuedVatAmount)}원`} />
                  <DescRow label="요청 대기 금액" value={`${fmt(period.requestedSupplyAmount + period.requestedVatAmount)}원`} />
                </dl>
                {period.requestedCount > 0 && (
                  <p className="mt-3 text-[12.5px] leading-relaxed text-boss-pill-warn-fg">
                    요청 {period.requestedCount}건이 아직 홈택스에서 발행되지 않았습니다. 발행 후 승인번호를 남겨 두세요.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] text-boss-text-secondary">기간을 고르면 집계가 보입니다.</p>
            )}
          </Panel>

          <VatPanel vat={vat} />

          <Panel kicker="홈택스" title="발행은 홈택스에서">
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              전자세금계산서 · 현금영수증은 홈택스에서 발급합니다. 여기서 정리한 사업자번호 · 금액 · 품목을 상세 화면의
              입력 도우미로 복사해 붙여 넣으세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://www.hometax.go.kr"
                target="_blank"
                rel="noreferrer"
                className="boss-btn boss-btn-sm boss-btn-secondary"
              >
                <ExternalLink size={13} strokeWidth={1.75} /> 홈택스 열기
              </a>
              <Link href="/boss/receipt" className="boss-btn boss-btn-sm boss-btn-ghost">
                매입 영수증 관리
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InvoiceRow({ inv, onOpen }: { inv: TaxInvoice; onOpen: () => void }) {
  return (
    <tr className="cursor-pointer" onClick={onOpen}>
      <td className="font-boss-head tabular-nums text-boss-text-secondary">{inv.issueDate ?? '미정'}</td>
      <td>
        <Tag tone={inv.docType === 'TAX' ? 'info' : 'neutral'}>{DOC_TYPE_LABEL[inv.docType]}</Tag>
      </td>
      <td>
        <span className="font-semibold text-boss-text">{inv.buyerName || '(상호 없음)'}</span>
        {inv.itemSummary && (
          <span className="ml-2 text-[12px] text-boss-text-muted">{inv.itemSummary}</span>
        )}
      </td>
      <td className="font-boss-head tabular-nums text-boss-text-secondary">
        {inv.docType === 'CASH' ? inv.buyerPhone || '-' : inv.buyerBizNo || '-'}
      </td>
      <td className="num text-boss-text-secondary">{fmt(inv.supplyAmount)}</td>
      <td className="num text-boss-text-secondary">{fmt(inv.vatAmount)}</td>
      <td className="num font-semibold text-boss-text">{fmt(inv.totalAmount)}</td>
      <td>
        <Tag tone={STATUS_TONE[inv.status]}>{STATUS_LABEL[inv.status]}</Tag>
      </td>
      <td className="font-boss-head tabular-nums text-boss-text-muted">{inv.approvalNo || '-'}</td>
    </tr>
  );
}

// 부가세 예상 — 매출세액(발행 완료) − 매입세액(영수증). 없는 값은 지어내지 않는다.
function VatPanel({ vat }: { vat: VatSummary | null }) {
  if (!vat) {
    return (
      <Panel kicker="부가세" title="예상 납부세액">
        <p className="text-[13px] text-boss-text-secondary">집계를 불러오지 못했습니다.</p>
      </Panel>
    );
  }
  const refund = vat.estimatedVatAmount < 0;
  const dLeft = daysLeft(vat.filingDeadline);
  const dueSoon = dLeft >= 0 && dLeft <= 14;
  const ratio =
    vat.salesVatAmount > 0 ? Math.min(100, (vat.purchaseVatAmount / vat.salesVatAmount) * 100) : 0;

  return (
    <Panel kicker={`부가세 · ${vat.filingLabel}`} title="예상 납부세액">
      <div className="flex items-baseline gap-2">
        <span
          className={`font-boss-head text-[36px] font-semibold leading-none tabular-nums ${
            refund ? 'text-boss-success' : 'text-boss-text'
          }`}
        >
          {fmt(Math.abs(vat.estimatedVatAmount))}
        </span>
        <span className="text-[13px] text-boss-text-secondary">원 {refund ? '환급 예상' : '납부 예상'}</span>
      </div>
      <div className="mt-3">
        <Bar pct={ratio} height={6} tone="ok" />
        <p className="mt-1 text-[11.5px] text-boss-text-muted">매출세액 대비 매입세액 {Math.round(ratio)}%</p>
      </div>
      <dl className="mt-3">
        <DescRow label={`매출세액 (발행 ${vat.salesCount}건)`} value={`${fmt(vat.salesVatAmount)}원`} />
        <DescRow
          label={`매입세액 (영수증 ${vat.purchaseWithVatCount}/${vat.purchaseCount}건)`}
          value={`− ${fmt(vat.purchaseVatAmount)}원`}
        />
      </dl>
      <div
        className={`mt-3 border px-3 py-2.5 text-[12.5px] leading-relaxed ${
          dueSoon
            ? 'border-boss-warning/35 bg-boss-pill-warn text-boss-pill-warn-fg'
            : 'border-boss-border bg-boss-bg text-boss-text-secondary'
        }`}
      >
        신고 · 납부 기한{' '}
        <span className="font-boss-head font-semibold tabular-nums text-boss-text">{vat.filingDeadline}</span>
        {dLeft >= 0 ? ` (D-${dLeft})` : ' (지남)'}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-boss-text-muted">
        발행 완료로 표시한 세금계산서와 영수증 관리에 올린 매입 영수증의 세액만 계산합니다. 카드 매출 · 간이과세 여부에 따라
        실제 신고액과 다를 수 있습니다.
      </p>
    </Panel>
  );
}
