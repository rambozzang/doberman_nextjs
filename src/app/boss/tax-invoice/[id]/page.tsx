'use client';

// 세금계산서 · 현금영수증 상세 — Industry 패턴
//
// 좌: 공급받는자 정보 · 금액 · 품목 · 메모
// 우: 상태(발행 요청 → 발행 완료 처리: 승인번호 · 발행일) · 서식 보기/보내기 · 홈택스 입력 도우미(항목별 복사)
//
// 실제 발행은 홈택스에서 한다. 이 화면은 홈택스 입력을 최대한 줄이고, 발행 결과(승인번호)를 남기는 곳이다.
// 화면 제목 · ← 세금계산서 링크는 셸 헤더가 그린다.

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, FileText, Pencil, Trash2 } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { toKoreanAmountLabel } from '@/lib/boss/koreanAmount';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import {
  DOC_TYPE_LABEL,
  PAY_TYPE_LABEL,
  STATUS_LABEL,
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
  type StatusTone,
  DetailActions,
} from '@/components/boss/ui';

const STATUS_TONE: Record<TaxInvoiceStatus, StatusTone> = {
  REQUESTED: 'warn',
  ISSUED: 'ok',
  CANCELED: 'neutral',
};

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');
const todayIso = () => new Date().toISOString().slice(0, 10);

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

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossTaxInvoiceApi.get(id);
      if (res.success !== false && res.data) {
        setData(res.data);
        setApprovalNo(res.data.approvalNo ?? '');
        setIssueDate(res.data.issueDate ?? todayIso());
      } else {
        setData(null);
        setError(res.message || res.error || '세금계산서를 불러오지 못했습니다.');
      }
    } catch {
      setData(null);
      setError('네트워크 오류로 세금계산서를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (status: TaxInvoiceStatus) => {
    if (!data?.id || changing) return;
    setChanging(true);
    try {
      const res = await bossTaxInvoiceApi.changeStatus(data.id, {
        status,
        approvalNo: status === 'ISSUED' ? approvalNo.trim() || null : null,
        issueDate: status === 'ISSUED' ? issueDate : null,
      });
      if (res.success !== false && res.data) {
        setData(res.data);
        setIssueOpen(false);
        toast.success(
          status === 'ISSUED' ? '발행 완료로 표시했습니다. 분기 부가세 예상에 반영됩니다.' : '상태를 바꿨습니다.'
        );
      } else {
        toast.error(res.message || res.error || '상태를 바꾸지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 상태를 바꾸지 못했습니다.');
    } finally {
      setChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!data?.id) return;
    setDeleting(true);
    try {
      const res = await bossTaxInvoiceApi.remove(data.id);
      if (res.success !== false) {
        toast.success('삭제했습니다.');
        setConfirmDelete(false);
        router.replace('/boss/tax-invoice');
      } else {
        // 실패하면 다이얼로그를 열어 둔다 — 다시 시도할 수 있게
        toast.error(res.message || res.error || '삭제하지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제하지 못했습니다.');
    } finally {
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
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}
        <EmptyState
          title="세금계산서를 열지 못했습니다"
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
  const printHref = `/boss/tax-invoice/${data.id}/print`;

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
        { label: '발급 구분', value: data.buyerBizNo ? '지출증빙용' : '소득공제용' },
        { label: data.buyerBizNo ? '사업자번호' : '휴대폰번호', value: data.buyerBizNo || data.buyerPhone || '' },
        { label: '거래일자', value: data.issueDate ?? '' },
        { label: '공급가액', value: String(data.supplyAmount) },
        { label: '부가세', value: String(data.vatAmount) },
        { label: '총 금액', value: String(data.totalAmount) },
      ];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* 주요 행동은 화면 맨 위에 — 스크롤하지 않고 바로 누른다 */}
      <div className="lg:col-span-2">
        <DetailActions note={<Tag tone={STATUS_TONE[data.status]}>{STATUS_LABEL[data.status]}</Tag>}>
          {data.status !== 'ISSUED' && (
            <Button variant="primary" size="sm" onClick={() => setIssueOpen(true)} disabled={changing}>
              발행 완료 처리
            </Button>
          )}
          <ButtonLink href={printHref} variant="secondary" size="sm" icon={FileText}>
            서식 보기 · 보내기
          </ButtonLink>
          <ButtonLink href={`/boss/tax-invoice/new?id=${data.id}`} variant="secondary" size="sm" icon={Pencil}>
            수정
          </ButtonLink>
          <Button
            variant="secondary"
            size="sm"
            icon={Trash2}
            onClick={() => setConfirmDelete(true)}
            className="!text-boss-error"
          >
            삭제
          </Button>
        </DetailActions>
      </div>
      {/* ── 좌 ── */}
      <div className="flex flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}

        {data.status === 'REQUESTED' && (
          <AlertBanner
            tone="warn"
            action={
              <Button variant="primary" size="sm" onClick={() => setIssueOpen(true)}>
                발행 완료 처리
              </Button>
            }
          >
            아직 홈택스에서 발행하지 않은 건입니다. 발행한 뒤 승인번호를 남기면 부가세 예상에 반영됩니다.
          </AlertBanner>
        )}

        <Panel
          kicker={DOC_TYPE_LABEL[data.docType]}
          title={data.buyerName || '(상호 없음)'}
          right={<Tag tone={STATUS_TONE[data.status]}>{STATUS_LABEL[data.status]}</Tag>}
        >
          <dl>
            {isTax ? (
              <>
                <DescRow label="사업자등록번호" value={data.buyerBizNo || '-'} />
                <DescRow label="대표자" value={data.buyerCeo || '-'} />
                <DescRow label="사업장 주소" value={data.buyerAddress || '-'} />
                <DescRow label="업태 / 종목" value={[data.buyerBizType, data.buyerBizKind].filter(Boolean).join(' / ') || '-'} />
                <DescRow label="수신 이메일" value={data.buyerEmail || '-'} />
              </>
            ) : (
              <>
                <DescRow label="휴대폰번호" value={data.buyerPhone || '-'} />
                <DescRow label="사업자번호(지출증빙)" value={data.buyerBizNo || '-'} />
              </>
            )}
            <DescRow label="작성일자" value={data.issueDate || '미정'} />
            <DescRow label="영수 / 청구" value={PAY_TYPE_LABEL[data.payType]} />
            {data.customerId && (
              <DescRow
                label="연결 고객"
                value={
                  <Link href={`/boss/customers/${data.customerId}`} className="hover:underline">
                    고객 #{data.customerId}
                  </Link>
                }
              />
            )}
          </dl>
        </Panel>

        <Panel kicker="금액" title="공급가액 · 세액">
          <div className="grid grid-cols-3 gap-2">
            <MetricBox label="공급가액" value={`${fmt(data.supplyAmount)}원`} />
            <MetricBox label="세액" value={`${fmt(data.vatAmount)}원`} />
            <MetricBox label="합계" value={`${fmt(data.totalAmount)}원`} />
          </div>
          <p className="mt-2 font-boss-head text-[13px] text-boss-text-secondary">{toKoreanAmountLabel(data.totalAmount)}</p>
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
          <Panel kicker="메모" title="메모">
            <p className="whitespace-pre-wrap text-[13.5px] leading-[1.7] text-boss-text">{data.memo}</p>
          </Panel>
        )}
      </div>

      {/* ── 우 ── */}
      <div className="flex flex-col gap-4">
        <Panel kicker="상태" title={STATUS_LABEL[data.status]}>
          {data.status === 'ISSUED' && (
            <dl className="mb-3">
              <DescRow label="승인번호" value={data.approvalNo || '미입력'} />
              <DescRow label="발행 처리" value={(data.issuedAt ?? '').slice(0, 16).replace('T', ' ') || '-'} />
            </dl>
          )}

          {issueOpen ? (
            <div className="flex flex-col gap-3 border border-boss-border bg-boss-bg p-3">
              <Field
                id="approvalNo"
                label="홈택스 승인번호"
                value={approvalNo}
                onChange={(e) => setApprovalNo(e.target.value)}
                placeholder="20260906-41000000-12345678"
                hint="홈택스 발급 완료 화면의 승인번호. 현금영수증은 승인번호 8자리."
              />
              <Field
                id="issueDate"
                label="작성일자"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIssueOpen(false)} disabled={changing}>
                  취소
                </Button>
                <Button variant="primary" size="sm" onClick={() => void changeStatus('ISSUED')} disabled={changing}>
                  {changing ? '처리 중…' : '발행 완료로 표시'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.status !== 'ISSUED' && (
                <Button variant="primary" onClick={() => setIssueOpen(true)} disabled={changing}>
                  발행 완료 처리
                </Button>
              )}
              {data.status === 'ISSUED' && (
                <Button variant="secondary" size="sm" onClick={() => setIssueOpen(true)} disabled={changing}>
                  승인번호 · 작성일 수정
                </Button>
              )}
              {data.status !== 'CANCELED' && (
                <Button variant="secondary" size="sm" onClick={() => void changeStatus('CANCELED')} disabled={changing}>
                  취소로 표시
                </Button>
              )}
              {data.status === 'CANCELED' && (
                <Button variant="secondary" size="sm" onClick={() => void changeStatus('REQUESTED')} disabled={changing}>
                  요청으로 되돌리기
                </Button>
              )}
            </div>
          )}
        </Panel>

        <Panel kicker="문서" title="서식 · 보내기">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            국세청 서식으로 출력하거나 PDF · 이미지로 저장해 고객에게 보냅니다. 핸드폰에서는 공유 버튼으로 문자 ·
            카카오톡에 바로 첨부됩니다.
          </p>
          <div className="mt-3">
            <ButtonLink href={printHref} variant="primary" size="sm" icon={FileText}>
              서식 보기 · 보내기
            </ButtonLink>
          </div>
        </Panel>

        <Panel
          kicker="홈택스"
          title="입력 도우미"
          right={
            <a
              href="https://www.hometax.go.kr"
              target="_blank"
              rel="noreferrer"
              className="boss-btn boss-btn-sm boss-btn-secondary"
            >
              <ExternalLink size={13} strokeWidth={1.75} /> 홈택스 열기
            </a>
          }
        >
          <p className="mb-2 text-[12px] leading-relaxed text-boss-text-secondary">
            {isTax
              ? '홈택스 → 전자(세금)계산서 → 건별 발급. 아래 순서대로 복사해 붙여 넣으세요.'
              : '홈택스 → 현금영수증 → 발급. 아래 값을 그대로 입력하세요.'}
          </p>
          <dl className="flex flex-col">
            {hometaxRows.map((r) => (
              <CopyRow key={r.label} label={r.label} value={r.value} />
            ))}
          </dl>
          {isTax && company && (
            <p className="mt-3 text-[11.5px] leading-relaxed text-boss-text-muted">
              공급자(우리 회사) 정보는 홈택스 로그인 계정에서 자동으로 채워집니다: {company.name}
              {company.bizno ? ` · ${company.bizno}` : ''}
            </p>
          )}
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="이 세금계산서 기록을 삭제할까요?"
        description="홈택스에서 이미 발행한 계산서는 취소되지 않습니다. 여기 기록만 지워지며 부가세 예상에서 빠집니다."
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
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
