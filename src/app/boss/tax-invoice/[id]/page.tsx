'use client';

// 세금계산서 · 현금영수증 상세 — Industry 패턴
//
// 위: 상태 · 주요 버튼(미리보기 · PDF · 인쇄 / 수정 / 삭제)
// 좌: 공급받는자(세금계산서) 또는 현금영수증 정보(용도 · 식별번호) · 금액 · 품목 · 내부 메모
// 우: 전자 발급(오픈 전엔 안내 · 발급 후엔 상태 확인 · 현금영수증 취소 · 세금계산서 취소) · 기록 상태(홈택스 발행 기록) · 서식 · 홈택스 입력 도우미
// 수정세금계산서(취소분)와 그 원본은 좌측 위 연결 카드로 서로 오간다. 수정분은 음수 금액 그대로 보인다.
//
// 저장만 한 문서(REQUESTED)는 "미발급(작성 완료)"이다 — 외부 발급 요청이 아니다.
// 발행은 두 갈래다. 전자 발급이 열리면 여기서 바로 발급하고, 아니면 홈택스에서 발행한 뒤 승인번호를 남긴다.
// 전자 발급을 시도한 문서(provider 있음)는 수정 · 삭제 · 수기 상태 변경을 막고 상태 확인만 연다.
// 화면 제목 · ← 세금계산서 링크는 셸 헤더가 그린다.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, FileText, Pencil, Trash2 } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { ELECTRONIC_TAX_INVOICE_OPEN } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import { cashFieldsOf, formatCashIdentity } from '@/lib/boss/taxInvoiceCash';
import {
  amountMismatch,
  cashIssuableToday,
  cashItemNameOf,
  cashTaxationOf,
  displayState,
  docKindLabel,
  isoDateOf,
  koreanAmountText,
  kstToday,
} from '@/lib/boss/taxInvoiceDocument';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import ElectronicIssuePanel, { TestTag } from '@/components/boss/taxinvoice/ElectronicIssuePanel';
import { TaxCancelLinkPanel } from '@/components/boss/taxinvoice/TaxCancelSection';
import {
  CASH_IDENTITY_LABEL,
  CASH_USAGE_LONG_LABEL,
  PAY_TYPE_LABEL,
  STATUS_LABEL,
  isProviderManaged,
  isTaxCorrection,
  type TaxInvoice,
  type TaxInvoiceStatus,
} from '@/types/boss-taxinvoice';
import {
  AlertBanner,
  Button,
  ButtonLink,
  ConfirmDialog,
  DataTable,
  DescRow,
  EmptyState,
  Field,
  MetricBox,
  Panel,
  Skeleton,
  Tag,
  DetailActions,
} from '@/components/boss/ui';

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');
// 날짜 기본값은 서버와 같은 한국시간 오늘
const todayIso = () => kstToday();

export default function BossTaxInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { company } = useBossPortal();

  const [data, setData] = useState<TaxInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [issueOpen, setIssueOpen] = useState(false);
  const [approvalNo, setApprovalNo] = useState('');
  const [issueDate, setIssueDate] = useState(todayIso());
  const [changing, setChanging] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // 늦게 도착한 이전 조회가 새 조회 결과를 덮지 않게
  const seq = useRef(0);
  const busy = useRef(false);

  const applyData = useCallback((d: TaxInvoice) => {
    setData({ ...d, items: Array.isArray(d.items) ? d.items : [] });
    setApprovalNo(d.approvalNo ?? '');
    setIssueDate(d.issueDate ?? todayIso());
  }, []);

  // 읽은 문서를 돌려준다 — 전자 발급 패널이 발급 · 취소 시도 뒤 결과를 확인하는 데 쓴다. 못 읽으면 null
  const load = useCallback(async (): Promise<TaxInvoice | null> => {
    if (!id) return null;
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await bossTaxInvoiceApi.get(id);
      if (my !== seq.current) return null;
      if (res.success !== false && res.data) {
        applyData(res.data);
        return res.data;
      }
      setError(res.message || res.error || '문서를 불러오지 못했습니다.');
      return null;
    } catch {
      if (my === seq.current) setError('네트워크 오류로 문서를 불러오지 못했습니다.');
      return null;
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [id, applyData]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (status: TaxInvoiceStatus) => {
    if (!data?.id || busy.current || isProviderManaged(data)) return;
    busy.current = true;
    setChanging(true);
    try {
      const res = await bossTaxInvoiceApi.changeStatus(data.id, {
        status,
        approvalNo: status === 'ISSUED' ? approvalNo.trim() || null : null,
        issueDate: status === 'ISSUED' ? issueDate : null,
      });
      if (res.success !== false && res.data) {
        applyData(res.data);
        setIssueOpen(false);
        toast.success(
          status === 'ISSUED'
            ? '홈택스 발행 완료로 기록했습니다. 분기 부가세 예상에 반영됩니다.'
            : status === 'REQUESTED'
              ? '미발급(작성 완료)으로 되돌렸습니다.'
              : '취소로 기록했습니다.',
        );
        markListDirty(LIST_KEYS.taxInvoice);
      } else {
        toast.error(res.message || res.error || '상태를 바꾸지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 상태를 바꾸지 못했습니다.');
    } finally {
      busy.current = false;
      setChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!data?.id || isProviderManaged(data) || busy.current) return;
    busy.current = true;
    setDeleting(true);
    try {
      const res = await bossTaxInvoiceApi.remove(data.id);
      if (res.success !== false) {
        toast.success('삭제했습니다.');
        markListDirty(LIST_KEYS.taxInvoice);
        setConfirmDelete(false);
        router.replace('/boss/tax-invoice');
      } else {
        // 실패하면 다이얼로그를 열어 둔다 — 다시 시도할 수 있게
        toast.error(res.message || res.error || '삭제하지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제하지 못했습니다.');
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        {error && (
          <AlertBanner
            tone="bad"
            action={
              <Button variant="secondary" size="sm" onClick={() => void load()}>
                다시 시도
              </Button>
            }
          >
            {error}
          </AlertBanner>
        )}
        <EmptyState
          title="문서를 열지 못했습니다"
          description="삭제됐거나 네트워크가 불안정할 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <ButtonLink href="/boss/tax-invoice" variant="secondary" size="sm">
              목록으로
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const isTax = data.docType === 'TAX';
  const correction = isTaxCorrection(data);
  const docLabel = docKindLabel(data);
  // 전자 발급 문서는 수정 · 삭제 · 수기 상태 변경 불가
  const managed = isProviderManaged(data);
  const ds = displayState(data);
  const printHref = `/boss/tax-invoice/${data.id}/print`;
  const cash = !isTax ? cashFieldsOf(data) : null;
  const mismatch = amountMismatch(data);

  // 홈택스 입력 순서대로 — 공급받는자 → 작성일자 → 품목 → 금액
  const hometaxRows: { label: string; value: string }[] = isTax
    ? [
        { label: '등록번호', value: data.buyerBizNo ?? '' },
        { label: '상호(법인명)', value: data.buyerName ?? '' },
        { label: '성명(대표자)', value: data.buyerCeo ?? '' },
        { label: '사업장 주소', value: data.buyerAddress ?? '' },
        { label: '업태', value: data.buyerBizType ?? '' },
        { label: '종목', value: data.buyerBizKind ?? '' },
        { label: '이메일', value: data.buyerEmail ?? '' },
        { label: '작성일자', value: data.issueDate ?? '' },
        { label: '품목', value: data.itemSummary ?? data.items[0]?.name ?? '' },
        { label: '공급가액', value: String(data.supplyAmount) },
        { label: '세액', value: String(data.vatAmount) },
        { label: '합계금액', value: String(data.totalAmount) },
        { label: '영수/청구', value: PAY_TYPE_LABEL[data.payType] },
      ]
    : [
        { label: '거래 구분', value: cash?.usage === 'EXPENSE' ? '지출증빙용' : '소득공제용' },
        {
          label: cash ? CASH_IDENTITY_LABEL[cash.identityType] : '식별번호',
          value: cash?.identityNum ?? '',
        },
        { label: '거래일자', value: data.issueDate ?? '' },
        { label: '공급가액', value: String(data.supplyAmount) },
        { label: '부가세', value: String(data.vatAmount) },
        { label: '봉사료', value: '0' },
        { label: '총 금액', value: String(data.totalAmount) },
      ];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* 주요 행동은 화면 맨 위에 — 스크롤하지 않고 바로 누른다 */}
      <div className="lg:col-span-2">
        <DetailActions
          note={
            <>
              <Tag tone={isTax ? 'info' : 'neutral'}>{docLabel}</Tag>
              <Tag tone={ds.tone}>{ds.label}</Tag>
              <TestTag isTest={data.providerIsTest} />
            </>
          }
        >
          {!managed && data.status !== 'ISSUED' && (
            <Button variant="secondary" size="sm" onClick={() => setIssueOpen(true)} disabled={changing}>
              홈택스 발행 기록
            </Button>
          )}
          <ButtonLink href={printHref} variant="primary" size="sm" icon={FileText}>
            미리보기 · PDF · 인쇄
          </ButtonLink>
          {!managed && (
            <>
              <ButtonLink href={`/boss/tax-invoice/new?id=${data.id}`} variant="secondary" size="sm" icon={Pencil}>
                수정
              </ButtonLink>
              <Button variant="secondary" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)} className="!text-boss-error">
                삭제
              </Button>
            </>
          )}
        </DetailActions>
      </div>
      {/* ── 좌 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {error && (
          <AlertBanner
            tone="bad"
            action={
              <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
                다시 시도
              </Button>
            }
          >
            {error} 아래는 마지막으로 불러온 내용입니다.
          </AlertBanner>
        )}

        {data.providerIsTest && (
          <AlertBanner tone="warn">시험 환경에서 발급한 문서입니다. 효력이 없고 발행 · 부가세 집계에서 빠집니다.</AlertBanner>
        )}

        {!managed && data.status === 'REQUESTED' && (
          <AlertBanner
            tone="info"
            action={
              <ButtonLink href={printHref} variant="secondary" size="sm">
                미리보기
              </ButtonLink>
            }
          >
            작성 완료 · 아직 발급하지 않은 {docLabel}입니다.{' '}
            {ELECTRONIC_TAX_INVOICE_OPEN
              ? '오른쪽 전자 발급에서 바로 발급하거나, 홈택스에서 발행한 뒤 승인번호를 기록하세요.'
              : '전자 발급은 정식 오픈 후 열립니다. 지금은 홈택스에서 발행한 뒤 승인번호를 기록하면 부가세 예상에 반영됩니다.'}
          </AlertBanner>
        )}

        {cash?.inferred && !managed && (
          <AlertBanner
            tone="warn"
            action={
              <ButtonLink href={`/boss/tax-invoice/new?id=${data.id}`} variant="secondary" size="sm">
                확인 · 수정
              </ButtonLink>
            }
          >
            예전에 저장한 현금영수증이라 용도 · 식별번호 · 과세 구분 중 비어 있는 값이 있습니다. 조회는 되지만 발급 전에 수정 화면에서 확인하고 저장해야 합니다.
          </AlertBanner>
        )}

        {mismatch && <AlertBanner tone="warn">{mismatch}</AlertBanner>}

        {/* 원본 ↔ 수정세금계산서(취소분) — 서로 오가는 링크 */}
        <TaxCancelLinkPanel invoice={data} />

        {!isTax && !managed && data.status === 'REQUESTED' && !cashIssuableToday(data) && (
          <AlertBanner tone="info">
            거래일자({data.issueDate || '미정'})가 오늘(한국시간 {kstToday()})이 아니라 전자 발급할 수 없습니다. 이 문서는 기록으로 보관됩니다. 오늘
            받은 대금이라면 수정 화면에서 거래일자를 오늘로 바꾸세요.
          </AlertBanner>
        )}

        {isTax ? (
          <Panel kicker={docLabel} title={data.buyerName || '(상호 없음)'} right={<Tag tone={ds.tone}>{ds.label}</Tag>}>
            <dl>
              <DescRow label="사업자등록번호" value={data.buyerBizNo || '-'} />
              <DescRow label="대표자" value={data.buyerCeo || '-'} />
              <DescRow label="사업장 주소" value={data.buyerAddress || '-'} />
              <DescRow label="업태 / 종목" value={[data.buyerBizType, data.buyerBizKind].filter(Boolean).join(' / ') || '-'} />
              <DescRow label="수신 이메일" value={data.buyerEmail || '-'} />
              <DescRow label="작성일자" value={data.issueDate || '미정'} />
              <DescRow label="영수 / 청구" value={PAY_TYPE_LABEL[data.payType]} />
              {data.customerId && <CustomerRow customerId={data.customerId} />}
            </dl>
          </Panel>
        ) : (
          <Panel
            kicker={docLabel}
            title={cash ? CASH_USAGE_LONG_LABEL[cash.usage] : docLabel}
            right={<Tag tone={ds.tone}>{ds.label}</Tag>}
          >
            <dl>
              <DescRow
                label={`식별번호 · ${cash ? CASH_IDENTITY_LABEL[cash.identityType] : ''}`}
                value={cash ? formatCashIdentity(cash.identityType, cash.identityNum) || '미입력' : '-'}
              />
              <DescRow label="고객명" value={data.buyerName || '-'} />
              <DescRow label="고객 연락처" value={data.buyerPhone || '-'} />
              <DescRow label="과세 구분" value={cashTaxationOf(data)} />
              <DescRow
                label="전송 품목명"
                value={`${cashItemNameOf(data).name}${cashItemNameOf(data).estimated && managed ? ' (서버 값 없음 · 예상)' : ''}`}
              />
              <DescRow label="거래일자(작성 기준)" value={data.issueDate || '미정'} />
              {data.providerTradeDate && <DescRow label="승인 거래일자" value={isoDateOf(data.providerTradeDate)} />}
              <DescRow label="대금" value={data.payType === 'RECEIPT' ? '받음(영수)' : '아직 안 받음 — 발급 불가'} />
              {data.customerId && <CustomerRow customerId={data.customerId} />}
            </dl>
          </Panel>
        )}

        <Panel kicker="금액" title={isTax ? '공급가액 · 세액' : '공급가액 · 부가세'}>
          <div className="grid grid-cols-3 gap-2">
            <MetricBox label="공급가액" value={`${fmt(data.supplyAmount)}원`} />
            <MetricBox label={isTax ? '세액' : '부가세'} value={`${fmt(data.vatAmount)}원`} />
            <MetricBox label="합계" value={`${fmt(data.totalAmount)}원`} />
          </div>
          <p className="mt-2 font-boss-head text-[13px] text-boss-text-secondary">{koreanAmountText(data.totalAmount)}</p>
          {correction && (
            <p className="mt-1 text-[12px] leading-relaxed text-boss-text-muted">
              원본 금액 전액을 차감하는 음수(-) 금액입니다. 발급이 확정되면 원본과 함께 집계되어 합계가 0원이 됩니다.
            </p>
          )}
        </Panel>

        {data.items.length > 0 && (
          <DataTable>
            <thead>
              <tr>
                <th>일자</th>
                <th>품목</th>
                <th>규격</th>
                <th className="num">수량</th>
                <th className="num">단가</th>
                <th className="num">공급가액</th>
                <th className="num">세액</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => (
                <tr key={i}>
                  <td className="font-boss-head tabular-nums text-boss-text-secondary">{it.date ?? '-'}</td>
                  <td className="wrap font-semibold text-boss-text">{it.name || '-'}</td>
                  <td className="text-boss-text-secondary">{it.spec || '-'}</td>
                  <td className="num">{fmt(it.qty)}</td>
                  <td className="num">{fmt(it.unitPrice)}</td>
                  <td className="num">{fmt(it.supplyAmount)}</td>
                  <td className="num text-boss-text-secondary">{fmt(it.vatAmount)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}

        {data.memo && (
          <Panel kicker="내부 메모" title="메모 (서식에 나가지 않음)">
            <p className="whitespace-pre-wrap text-[13.5px] leading-[1.7] text-boss-text">{data.memo}</p>
          </Panel>
        )}
      </div>

      {/* ── 우 ── */}
      <div className="flex flex-col gap-4">
        <ElectronicIssuePanel invoice={data} onUpdated={applyData} reload={load} />

        {!managed && (
          <Panel kicker="기록 상태" title={data.status === 'REQUESTED' ? '미발급 (작성 완료)' : STATUS_LABEL[data.status]}>
            <p className="mb-3 text-[12px] leading-relaxed text-boss-text-secondary">
              홈택스 등 도배르만 밖에서 발행했다면 승인번호를 기록해 두세요. 기록만 바뀌며 국세청 문서는 바뀌지 않습니다.
            </p>
            {data.status === 'ISSUED' && (
              <dl className="mb-3">
                <DescRow label="승인번호" value={data.approvalNo || '미입력'} />
                <DescRow label="기록 시각" value={(data.issuedAt ?? '').slice(0, 16).replace('T', ' ') || '-'} />
              </dl>
            )}

            {issueOpen ? (
              <div className="flex flex-col gap-3 border border-boss-border bg-boss-bg p-3">
                <Field
                  id="approvalNo"
                  label={isTax ? '홈택스 승인번호' : '현금영수증 승인번호'}
                  value={approvalNo}
                  onChange={(e) => setApprovalNo(e.target.value)}
                  placeholder={isTax ? '20260906-41000000-12345678' : '승인번호 9자리'}
                  hint={isTax ? '홈택스 발급 완료 화면의 승인번호(24자리)입니다.' : '홈택스 현금영수증 발급 화면의 승인번호입니다.'}
                  maxLength={50}
                />
                <Field
                  id="issueDate"
                  label={isTax ? '작성일자' : '거래일자'}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIssueOpen(false)} disabled={changing}>
                    닫기
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => void changeStatus('ISSUED')} disabled={changing}>
                    {changing ? '처리 중…' : '홈택스 발행 완료로 기록'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.status !== 'ISSUED' && (
                  <Button variant="secondary" onClick={() => setIssueOpen(true)} disabled={changing}>
                    홈택스 발행 기록
                  </Button>
                )}
                {data.status === 'ISSUED' && (
                  <Button variant="secondary" size="sm" onClick={() => setIssueOpen(true)} disabled={changing}>
                    승인번호 · 날짜 고치기
                  </Button>
                )}
                {data.status !== 'CANCELED' && (
                  <Button variant="secondary" size="sm" onClick={() => void changeStatus('CANCELED')} disabled={changing}>
                    취소로 기록 (기록만 변경)
                  </Button>
                )}
                {data.status === 'CANCELED' && (
                  <Button variant="secondary" size="sm" onClick={() => void changeStatus('REQUESTED')} disabled={changing}>
                    미발급으로 되돌리기
                  </Button>
                )}
              </div>
            )}
          </Panel>
        )}

        <Panel kicker="문서" title="미리보기 · PDF · 인쇄">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            {isTax ? 'A4 세금계산서 서식' : '현금영수증 서식'}으로 미리 보고 PDF로 저장하거나 인쇄합니다. 미발급 · 시험 · 결과 확인 필요 · 취소
            표시는 종이에도 함께 찍힙니다.
          </p>
          <div className="mt-3">
            <ButtonLink href={printHref} variant="primary" size="sm" icon={FileText}>
              미리보기 · PDF · 인쇄
            </ButtonLink>
          </div>
        </Panel>

        {!managed && (
          <Panel
            kicker="홈택스"
            title="입력 도우미"
            right={
              <a href="https://www.hometax.go.kr" target="_blank" rel="noreferrer" className="boss-btn boss-btn-sm boss-btn-secondary">
                <ExternalLink size={13} strokeWidth={1.75} /> 홈택스 열기
              </a>
            }
          >
            <p className="mb-2 text-[12px] leading-relaxed text-boss-text-secondary">
              {isTax
                ? '홈택스 → 전자(세금)계산서 → 건별 발급. 아래 순서대로 복사해 붙여 넣으세요.'
                : cash?.identityType === 'SELF'
                  ? '홈택스 → 현금영수증 → 자진발급. 아래 금액을 입력하세요.'
                  : '홈택스 → 현금영수증 → 발급. 아래 값을 그대로 입력하세요.'}
            </p>
            <dl className="flex flex-col">
              {hometaxRows.map((r) => (
                <CopyRow key={r.label} label={r.label} value={r.value} />
              ))}
            </dl>
            {company && (
              <p className="mt-3 text-[11.5px] leading-relaxed text-boss-text-muted">
                공급자(우리 회사) 정보는 홈택스 로그인 계정에서 자동으로 채워집니다: {company.name}
                {company.bizno ? ` · ${company.bizno}` : ''}
              </p>
            )}
          </Panel>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`이 ${docLabel} 기록을 삭제할까요?`}
        description="홈택스에서 이미 발행한 문서는 취소되지 않습니다. 여기 기록만 지워지며 부가세 예상에서 빠집니다."
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

function CustomerRow({ customerId }: { customerId: number }) {
  return (
    <DescRow
      label="연결 고객"
      value={
        <Link href={`/boss/customers/${customerId}`} className="hover:underline">
          고객 #{customerId}
        </Link>
      }
    />
  );
}

// 항목 한 줄 — 값 클릭 · 복사 버튼으로 클립보드에
function CopyRow({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} 복사`);
    } catch {
      toast.error('복사하지 못했습니다. 값을 길게 눌러 복사하세요.');
    }
  };
  const content: ReactNode = value ? (
    <span className="font-boss-head tabular-nums text-boss-text">{value}</span>
  ) : (
    <span className="text-boss-text-muted">-</span>
  );
  return (
    <div className="flex items-center gap-2 border-b border-boss-border-row py-1.5 text-[13px] last:border-b-0">
      <dt className="w-[92px] shrink-0 text-boss-text-secondary">{label}</dt>
      <dd className="min-w-0 flex-1 truncate">{content}</dd>
      <button
        type="button"
        onClick={() => void copy()}
        disabled={!value}
        aria-label={`${label} 복사`}
        className="boss-btn boss-btn-sm boss-btn-ghost -mr-2 px-1.5 disabled:opacity-30"
      >
        <Copy size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}
