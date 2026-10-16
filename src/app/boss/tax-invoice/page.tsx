'use client';

// 세금계산서 · 현금영수증 관리 — Industry 패턴
//
// 위: 발급 서비스 등록 진입(오픈 전엔 오픈 예정 안내)
// 필터: 연도 · 분기 → 문서 종류 · 상태(미발급 · 발급 완료 · 확인 필요 · 취소) → 검색(고객 · 사업자번호 · 식별번호 · 승인번호)
// 좌: 조회 합계 + 표(작성일 · 종류 · 고객 · 사업자번호/식별번호 · 공급가액 · 세액 · 합계 · 상태 · 승인번호)
// 우: 기간 요약(서버 집계) · 부가세 예상 · 홈택스 바로가기
//
// 저장만 한 문서(REQUESTED)는 "미발급"이다. 전자 발급 결과를 모르는 문서는 "확인 필요"로 모아 먼저 보이게 한다.
// 정식 오픈 뒤 결과를 기다리는 문서가 있으면 보이는 동안 정해진 횟수만 목록을 다시 읽는다(서버 저장값만 — 팝빌 조회 아님).
// 운영 관리 진입은 서버가 운영자라고 답했을 때만 보인다.
// 수정세금계산서(취소분)는 음수 금액 그대로 보이고, 발급이 확정된 것만 합계에 더한다(원본과 합쳐 0원).
// 화면 제목 · "새로 작성" 버튼은 셸 헤더(nav.ts PAGE_META)가 담당한다.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BellRing, ExternalLink, FilePlus2, RefreshCw } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { LIST_KEYS, readListSnapshot, useSaveListSnapshot } from '@/lib/boss/listCache';
import AdminEntry from '@/components/boss/taxinvoice/AdminEntry';
import RegistrationEntry from '@/components/boss/taxinvoice/RegistrationEntry';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { awaitsServerUpdate } from '@/lib/boss/taxInvoiceOps';
import { useBoundedRefresh } from '@/lib/boss/useBoundedRefresh';
import { ELECTRONIC_TAX_INVOICE_OPEN } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { cashDigits, cashFieldsOf, maskCashIdentity } from '@/lib/boss/taxInvoiceCash';
import { DISPLAY_KEY_LABEL, correctionReasonText, displayState, listTotals, type DisplayKey } from '@/lib/boss/taxInvoiceDocument';
import {
  CASH_USAGE_LABEL,
  DOC_TYPE_LABEL,
  type TaxInvoice,
  type TaxInvoiceDocType,
  type TaxInvoicePeriodSummary,
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
  SearchInput,
  Segmented,
  Tag,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';

type Tab = 'all' | DisplayKey;
type DocFilter = 'all' | TaxInvoiceDocType;
type Filters = { year: number; quarter: number; tab: Tab; doc: DocFilter; query: string };
type Data = { period: TaxInvoicePeriodSummary | null; vat: VatSummary | null };

const TAB_ORDER: Tab[] = ['all', 'draft', 'attention', 'issued', 'canceled'];
/** 예전 링크(?status=REQUESTED 등)도 받는다 */
const STATUS_PARAM: Record<string, Tab> = {
  REQUESTED: 'draft',
  ISSUED: 'issued',
  CANCELED: 'canceled',
  draft: 'draft',
  issued: 'issued',
  attention: 'attention',
  canceled: 'canceled',
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

/** 검색 — 글자는 고객명 · 상호 · 품목에서, 숫자는 사업자번호 · 식별번호 · 연락처 · 승인번호에서 찾는다 */
function matches(inv: TaxInvoice, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = cashDigits(q);
  const text = [inv.buyerName, inv.buyerCeo, inv.itemSummary, inv.approvalNo, inv.providerCancelApprovalNo, inv.orgNtsConfirmNum]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (text.includes(q)) return true;
  if (digits.length >= 3 && digits.length === q.replace(/[\s-]/g, '').length) {
    const numbers = [inv.buyerBizNo, inv.cashIdentityNum, inv.buyerPhone, inv.approvalNo, inv.providerCancelApprovalNo, inv.orgNtsConfirmNum].map(
      cashDigits,
    );
    return numbers.some((n) => n.includes(digits));
  }
  return false;
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
  const statusParam = search.get('status');
  const now = useMemo(() => new Date(), []);
  // 상세를 다녀왔으면 보던 조건과 데이터를 그대로 되살린다 (저장 · 발급했으면 null 이라 다시 부른다)
  const restored = useMemo(() => readListSnapshot<Filters, Data>(LIST_KEYS.taxInvoice), []);
  const [year, setYear] = useState(restored?.filters.year ?? now.getFullYear());
  const [quarter, setQuarter] = useState<number>(restored?.filters.quarter ?? currentQuarter(now));
  const [tab, setTab] = useState<Tab>(() => (statusParam && STATUS_PARAM[statusParam]) || restored?.filters.tab || 'all');
  const [doc, setDoc] = useState<DocFilter>(restored?.filters.doc ?? 'all');
  const [query, setQuery] = useState(restored?.filters.query ?? '');
  const [period, setPeriod] = useState<TaxInvoicePeriodSummary | null>(restored?.data.period ?? null);
  const [vat, setVat] = useState<VatSummary | null>(restored?.data.vat ?? null);
  const [loading, setLoading] = useState(!restored);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(restored != null);
  const skipFirstLoad = useRef(restored != null);
  // 기간을 빠르게 바꿀 때 늦게 온 이전 기간 응답이 새 기간을 덮지 않게
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const [p, v] = await Promise.all([bossTaxInvoiceApi.period(year, quarter), bossTaxInvoiceApi.vatSummary(year, quarter)]);
      if (my !== seq.current) return;
      if (p.success !== false && p.data) {
        setPeriod({ ...p.data, invoices: Array.isArray(p.data.invoices) ? p.data.invoices : [] });
        setLoaded(true);
      } else {
        setPeriod(null);
        setError(p.message || p.error || '목록을 불러오지 못했습니다.');
      }
      setVat(v.success !== false && v.data ? v.data : null);
    } catch {
      if (my !== seq.current) return;
      setPeriod(null);
      setVat(null);
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [year, quarter]);

  useEffect(() => {
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false;
      return;
    }
    void load();
  }, [load]);

  useSaveListSnapshot<Filters, Data>(LIST_KEYS.taxInvoice, { year, quarter, tab, doc, query }, { period, vat }, loaded);

  const all = useMemo(() => period?.invoices ?? [], [period]);
  const scope = useBossScope();
  // 정식 오픈 뒤, 결과를 기다리는 문서가 보일 때만 — 같은 계정일 때만 다시 읽는다
  useBoundedRefresh({
    enabled: ELECTRONIC_TAX_INVOICE_OPEN && scope != null && all.some(awaitsServerUpdate),
    run: () => (isCurrentScope(scope) ? load() : undefined),
  });
  // 문서 종류 · 검색까지 거른 목록 — 상태 탭 건수는 여기서 센다
  const scoped = useMemo(() => all.filter((i) => (doc === 'all' || i.docType === doc) && matches(i, query)), [all, doc, query]);
  const invoices = useMemo(() => (tab === 'all' ? scoped : scoped.filter((i) => displayState(i).key === tab)), [scoped, tab]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: scoped.length, draft: 0, issued: 0, attention: 0, canceled: 0 };
    for (const i of scoped) c[displayState(i).key] += 1;
    return c;
  }, [scoped]);

  // 지금 보이는 목록의 합계 — 취소 · 시험 발급 · 발급이 확정되지 않은 수정분은 금액에서 뺀다
  const shown = useMemo(() => listTotals(invoices), [invoices]);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y, y - 1, y - 2];
  }, [now]);

  const filtered = doc !== 'all' || tab !== 'all' || query.trim() !== '';
  const resetFilters = () => {
    setDoc('all');
    setTab('all');
    setQuery('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 발급 서비스 등록 진입 — 출시 값 · 목록 조회 성패와 상관없이 늘 보인다(오픈 전이면 오픈 예정 안내 포함) */}
      <RegistrationEntry />

      {/* ── 기간 · 새로고침 ── */}
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
        <span className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : period ? `${period.from} ~ ${period.to} · ${all.length}건` : ''}
        </span>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void load()} disabled={loading}>
          새로고침
        </Button>
      </div>

      {/* ── 종류 · 상태 · 검색 ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented
          ariaLabel="문서 종류"
          value={doc}
          onChange={setDoc}
          options={[
            { key: 'all', label: '전체' },
            { key: 'TAX', label: '세금계산서' },
            { key: 'CASH', label: '현금영수증' },
          ]}
        />
        <ListTabs
          ariaLabel="상태"
          tabs={TAB_ORDER.map((t) => ({ key: t, label: t === 'all' ? '전체 상태' : DISPLAY_KEY_LABEL[t], count: counts[t] }))}
          active={tab}
          onChange={setTab}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="고객 · 사업자번호 · 휴대폰 · 승인번호"
          className="w-full sm:w-72"
          hint={false}
        />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            조건 지우기
          </Button>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {scope && <AdminEntry key={scope} scope={scope} />}
          <ButtonLink href="/boss/tax-invoice/activity" variant="secondary" size="sm" icon={BellRing}>
            알림
          </ButtonLink>
          <ButtonLink href="/boss/tax-invoice/new?docType=CASH" variant="secondary" size="sm" icon={FilePlus2}>
            현금영수증 작성
          </ButtonLink>
        </div>
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

      {counts.attention > 0 && tab !== 'attention' && (
        <AlertBanner
          tone="warn"
          action={
            <Button variant="secondary" size="sm" onClick={() => setTab('attention')}>
              확인 필요 보기
            </Button>
          }
        >
          전자 발급 · 취소 결과를 확인해야 하는 문서가 {counts.attention}건 있습니다. 다시 발급 · 취소하지 말고 상세에서 상태를 먼저 확인하세요.
        </AlertBanner>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── 목록 ── */}
        <div className="flex min-w-0 flex-col gap-3">
          {invoices.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
              <MetricBox label="조회" value={`${fmt(shown.count)}건`} />
              <MetricBox label="공급가액" value={`${fmt(shown.supply)}원`} />
              <MetricBox label="세액" value={`${fmt(shown.vat)}원`} />
              <MetricBox label="합계" value={`${fmt(shown.total)}원`} />
            </div>
          )}
          {invoices.length > 0 && (shown.excluded > 0 || shown.corrections > 0) && (
            <p className="-mt-1 text-[12px] leading-relaxed text-boss-text-muted">
              {shown.excluded > 0 &&
                `취소 · 시험 발급${shown.unsettledCorrections > 0 ? ` · 발급 확정 전 수정분(${shown.unsettledCorrections}건)` : ''} ${shown.excluded}건은 금액 합계에서 뺐습니다. `}
              {shown.corrections > 0 && `발급된 수정세금계산서(취소분) ${shown.corrections}건은 음수로 더했습니다.`}
            </p>
          )}

          {loading && !period ? (
            <div className="boss-card-content">
              <RowSkeleton rows={6} />
            </div>
          ) : invoices.length === 0 ? (
            error ? (
              <EmptyState
                title="목록을 불러오지 못했습니다"
                description="네트워크 상태를 확인한 뒤 다시 시도하세요. 서버가 아직 이 기능을 배포하지 않았다면 잠시 뒤 다시 열어 주세요."
                action={
                  <Button variant="secondary" size="sm" onClick={() => void load()}>
                    다시 시도
                  </Button>
                }
              />
            ) : filtered && all.length > 0 ? (
              <EmptyState
                title="조건에 맞는 문서가 없습니다"
                description="문서 종류 · 상태 · 검색어를 바꾸거나 기간을 바꿔 보세요."
                action={
                  <Button variant="secondary" size="sm" onClick={resetFilters}>
                    조건 지우기
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="이 기간에 작성한 문서가 없습니다"
                description="고객이 세금계산서나 현금영수증을 요청하면 여기서 작성해 두세요. 실물 서식으로 미리 보고 PDF · 인쇄로 보낼 수 있고, 분기 부가세도 미리 보입니다."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <ButtonLink href="/boss/tax-invoice/new" variant="primary" size="sm">
                      세금계산서 작성
                    </ButtonLink>
                    <ButtonLink href="/boss/tax-invoice/new?docType=CASH" variant="secondary" size="sm">
                      현금영수증 작성
                    </ButtonLink>
                  </div>
                }
              />
            )
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>작성일</th>
                  <th>종류</th>
                  <th>고객 · 공급받는자</th>
                  <th>사업자번호 · 식별번호</th>
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

        {/* ── 우측: 기간 요약 · 부가세 예상 ── */}
        <div className="flex flex-col gap-4">
          <Panel kicker={period ? `${period.year}년 ${period.quarter ? `${period.quarter}분기` : '연간'}` : '기간'} title="기간 요약">
            {period ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox label="발행 완료" value={`${period.issuedCount}건`} />
                  <MetricBox label="미발급" value={`${period.requestedCount}건`} />
                </div>
                <dl className="mt-3">
                  <DescRow label="발행 공급가액" value={`${fmt(period.issuedSupplyAmount)}원`} />
                  <DescRow label="발행 세액" value={`${fmt(period.issuedVatAmount)}원`} />
                  <DescRow label="미발급 금액" value={`${fmt(period.requestedSupplyAmount + period.requestedVatAmount)}원`} />
                </dl>
                {period.requestedCount > 0 && (
                  <p className="mt-3 text-[12.5px] leading-relaxed text-boss-pill-warn-fg">
                    미발급 {period.requestedCount}건이 있습니다. 발행한 뒤 승인번호를 기록해야 부가세 예상에 들어갑니다.
                  </p>
                )}
                <p className="mt-2 text-[11.5px] leading-relaxed text-boss-text-muted">
                  서버 집계입니다. 시험 발급 건은 빠지고, 수정세금계산서(취소분)는 각 작성일자 기준 기간에 음수로 들어갑니다.
                </p>
              </>
            ) : (
              <p className="text-[13px] text-boss-text-secondary">기간을 고르면 집계가 보입니다.</p>
            )}
          </Panel>

          <VatPanel vat={vat} />

          <Panel kicker="홈택스" title={ELECTRONIC_TAX_INVOICE_OPEN ? '전자 발급 · 홈택스' : '발행은 지금 홈택스에서'}>
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              {ELECTRONIC_TAX_INVOICE_OPEN
                ? '발급 서비스 등록을 마쳤다면 상세 화면에서 바로 발급할 수 있습니다. 시험 발급 건은 집계에서 빠집니다.'
                : '전자 발급은 정식 오픈 후 열립니다. 지금은 홈택스에서 발행하고, 상세 화면의 입력 도우미로 사업자번호 · 금액을 복사해 붙여 넣으세요.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="https://www.hometax.go.kr" target="_blank" rel="noreferrer" className="boss-btn boss-btn-sm boss-btn-secondary">
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
  const s = displayState(inv);
  const isCash = inv.docType === 'CASH';
  const cash = isCash ? cashFieldsOf(inv) : null;
  const correction = inv.correctionOfInvoiceId != null;
  return (
    <tr
      className="cursor-pointer"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      tabIndex={0}
    >
      <td>
        <ListDateCell at={inv.createdDt ?? inv.issueDate} id={inv.id} />
      </td>
      <td>
        {correction ? <Tag tone="warn">수정분</Tag> : <Tag tone={isCash ? 'neutral' : 'info'}>{DOC_TYPE_LABEL[inv.docType]}</Tag>}
      </td>
      <td className="wrap">
        <span className="font-semibold text-boss-text">{inv.buyerName || (isCash ? '(고객명 없음)' : '(상호 없음)')}</span>
        {correction ? (
          <span className="mt-0.5 block text-[12px] text-boss-text-muted">
            수정세금계산서(취소분) · {correctionReasonText(inv)} · 당초 승인번호 {inv.orgNtsConfirmNum || '확인 필요'}
          </span>
        ) : (
          inv.itemSummary && <span className="ml-2 text-[12px] text-boss-text-muted">{inv.itemSummary}</span>
        )}
      </td>
      <td className="font-boss-head tabular-nums text-boss-text-secondary">
        {cash ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[11.5px] text-boss-text-muted">{CASH_USAGE_LABEL[cash.usage]}</span>
            {maskCashIdentity(cash.identityType, cash.identityNum) || '-'}
            {cash.inferred && <Tag tone="warn">확인 필요</Tag>}
          </span>
        ) : (
          inv.buyerBizNo || '-'
        )}
      </td>
      <td className="num text-boss-text-secondary">{fmt(inv.supplyAmount)}</td>
      <td className="num text-boss-text-secondary">{fmt(inv.vatAmount)}</td>
      <td className="num font-semibold text-boss-text">{fmt(inv.totalAmount)}</td>
      <td>
        <span className="inline-flex flex-wrap items-center gap-1">
          <Tag tone={s.tone}>{s.label}</Tag>
          {s.electronic && s.key === 'issued' && !s.test && <Tag tone="info">전자</Tag>}
          {s.test && <Tag tone="warn">시험</Tag>}
        </span>
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
  const ratio = vat.salesVatAmount > 0 ? Math.min(100, (vat.purchaseVatAmount / vat.salesVatAmount) * 100) : 0;

  return (
    <Panel kicker={`부가세 · ${vat.filingLabel}`} title="예상 납부세액">
      <div className="flex items-baseline gap-2">
        <span className={`font-boss-head text-[36px] font-semibold leading-none tabular-nums ${refund ? 'text-boss-success' : 'text-boss-text'}`}>
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
        <DescRow label={`매입세액 (영수증 ${vat.purchaseWithVatCount}/${vat.purchaseCount}건)`} value={`− ${fmt(vat.purchaseVatAmount)}원`} />
      </dl>
      <div
        className={`mt-3 border px-3 py-2.5 text-[12.5px] leading-relaxed ${
          dueSoon ? 'border-boss-warning/35 bg-boss-pill-warn text-boss-pill-warn-fg' : 'border-boss-border bg-boss-bg text-boss-text-secondary'
        }`}
      >
        신고 · 납부 기한 <span className="font-boss-head font-semibold tabular-nums text-boss-text">{vat.filingDeadline}</span>
        {dLeft >= 0 ? ` (D-${dLeft})` : ' (지남)'}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-boss-text-muted">
        발행 완료로 기록한 문서와 영수증 관리에 올린 매입 영수증의 세액만 계산합니다. 카드 매출 · 간이과세 여부에 따라 실제 신고액과 다를 수
        있습니다.
      </p>
    </Panel>
  );
}
