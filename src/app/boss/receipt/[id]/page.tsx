'use client';

// 영수증 상세 — Industry 패턴
//   좌: 거래처 · 금액 개요 + 품목 표 + 메모 (수정 모드에서는 2열 폼 + 하단 액션 패널)
//   우: DescRow 요약 + 영수증 이미지 + 수정 · 새로고침 · 목록 · 삭제.
//   화면 제목과 ← 영수증 관리 링크는 셸 헤더가 그린다. 삭제는 ConfirmDialog.
// Flutter receipt_detail_page.dart 포팅
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, RefreshCw, Pencil, Package, ArrowLeft, Receipt as ReceiptIcon } from 'lucide-react';
import { bossReceiptApi } from '@/lib/api/boss/receipt';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import type { ReceiptData, ReceiptSaveRequest } from '@/types/boss-receipt';
import {
  RECEIPT_CATEGORIES,
  categoryLabel,
  paymentLabel,
  type ReceiptCategoryCode,
} from '@/types/boss-receipt';
import {
  Panel,
  ContentCard,
  CardHead,
  Button,
  ButtonLink,
  StatusPill,
  DescRow,
  Field,
  SelectField,
  TextareaField,
  EmptyState,
  AlertBanner,
  Skeleton,
  ConfirmDialog,
} from '@/components/boss/ui';

function fmtWon(n?: number): string {
  if (n == null) return '0';
  return n.toLocaleString('ko-KR');
}

function won(n?: number): string {
  return `₩${fmtWon(n)}`;
}

function formatDate(s?: string): string {
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BossReceiptDetailPage() {
  const router = useRouter();
  // Next 16 에서 페이지의 params 는 Promise 라 직접 읽으면 undefined 가 된다 — useParams 를 쓴다
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 편집 필드
  const [vendorName, setVendorName] = useState('');
  const [txDate, setTxDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [category, setCategory] = useState<ReceiptCategoryCode>('ETC');
  const [memo, setMemo] = useState('');

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossReceiptApi.detail(id);
      if (res.success !== false && res.data) {
        const d = res.data;
        setData(d);
        setVendorName(d.vendorName ?? '');
        setTxDate(d.txDate ?? '');
        setTotalAmount(String(d.totalAmount ?? 0));
        setTaxAmount(String(d.taxAmount ?? ''));
        setPaymentMethod(d.paymentMethod ?? '');
        setCategory((d.category as ReceiptCategoryCode) ?? 'ETC');
        setMemo(d.memo ?? '');
      } else {
        setError(res.message || '영수증을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 영수증을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const payload: ReceiptSaveRequest = {
        id: data.id,
        vendorName: vendorName.trim() || undefined,
        txDate: txDate || undefined,
        totalAmount: Number(totalAmount.replace(/[^\d]/g, '')) || 0,
        taxAmount: taxAmount ? Number(taxAmount.replace(/[^\d]/g, '')) : undefined,
        paymentMethod: paymentMethod || undefined,
        category,
        imageUrl: data.imageUrl,
        memo: memo.trim() || undefined,
        items: data.items ?? [],
      };
      const res = await bossReceiptApi.save(payload);
      if (res.success !== false) {
        toast.success('수정되었습니다.');
        markListDirty(LIST_KEYS.receipt);
        setEditing(false);
        await load();
      } else {
        toast.error(res.message || '수정에 실패했습니다.');
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data?.id) return;
    setDeleting(true);
    try {
      const res = await bossReceiptApi.remove(data.id);
      if (res.success !== false) {
        toast.success('삭제되었습니다.');
        markListDirty(LIST_KEYS.receipt);
        router.replace('/boss/receipt');
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // ── 로딩 ──────────────────────────────────
  if (loading && !data) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-56" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  // ── 에러 / 없음 ───────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}
        <EmptyState
          icon={ReceiptIcon}
          title="영수증을 열 수 없습니다"
          description="삭제됐거나 주소가 잘못됐을 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <ButtonLink href="/boss/receipt" variant="primary" size="sm" icon={ArrowLeft}>
              목록으로
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const supplyAmount = data.totalAmount - (data.taxAmount ?? 0);
  const items = data.items ?? [];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ── 좌: 본문 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {editing ? (
          <>
            {/* 수정 폼 */}
            <Panel title="영수증 수정" kicker="EDIT">
              <div className="flex flex-col gap-4">
                <Field
                  id="vendorName"
                  label="상호명"
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="예: OO벽지 · OO자재"
                  maxLength={50}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    id="txDate"
                    label="거래일"
                    type="date"
                    value={txDate ? txDate.substring(0, 10) : ''}
                    onChange={(e) => setTxDate(e.target.value)}
                  />
                  <SelectField
                    id="category"
                    label="카테고리"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReceiptCategoryCode)}
                  >
                    {RECEIPT_CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    id="totalAmount"
                    label="총 금액"
                    type="text"
                    inputMode="numeric"
                    suffix="원"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="0"
                    className="[&_input]:font-boss-head [&_input]:tabular-nums"
                    maxLength={12}
                  />
                  <Field
                    id="taxAmount"
                    label="부가세"
                    type="text"
                    inputMode="numeric"
                    suffix="원"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="0"
                    hint="비워 두면 부가세 없음으로 저장됩니다."
                    className="[&_input]:font-boss-head [&_input]:tabular-nums"
                    maxLength={12}
                  />
                </div>
                <SelectField
                  id="paymentMethod"
                  label="결제 수단"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="md:w-1/2 md:pr-2"
                >
                  <option value="">선택 안함</option>
                  <option value="CARD">카드</option>
                  <option value="CASH">현금</option>
                </SelectField>
                <TextareaField
                  id="memo"
                  label="메모"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  placeholder="용도 · 현장 · 특이사항"
                  maxLength={2000}
                />
              </div>
            </Panel>

            {/* 하단 액션 패널 */}
            <div className="boss-card flex flex-wrap items-center gap-2.5 px-4 py-3.5">
              <span className="text-[12.5px] text-boss-text-secondary">
                품목과 영수증 이미지는 앱에서 읽어 온 값이라 여기서 바꾸지 않습니다.
              </span>
              <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving} className="ml-auto">
                취소
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 개요 */}
            <Panel>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="neutral">{categoryLabel(data.category)}</StatusPill>
                {data.paymentMethod && <StatusPill tone="info">{paymentLabel(data.paymentMethod)}</StatusPill>}
                {data.id != null && (
                  <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">#{data.id}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-boss-head text-[22px] font-semibold leading-tight tracking-[-0.01em] text-boss-text">
                    {data.vendorName || '거래처 미상'}
                  </h2>
                  <p className="mt-1 text-[12.5px] text-boss-text-secondary">
                    거래일{' '}
                    <span className="font-boss-head tabular-nums text-boss-text">{formatDate(data.txDate)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="boss-kicker">총 금액</p>
                  <p className="font-boss-head text-[32px] font-semibold leading-none tabular-nums tracking-[-0.01em] text-boss-text">
                    {won(data.totalAmount)}
                  </p>
                </div>
              </div>
            </Panel>

            {/* 품목 */}
            <ContentCard>
              <CardHead title="품목" count={items.length > 0 ? `${items.length}개` : undefined} countTone="muted" />
              {items.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={Package}
                    title="읽어 온 품목이 없습니다"
                    description="앱에서 영수증을 촬영할 때 품목이 인식되면 여기에 표로 나옵니다. 총 금액은 위 값 그대로입니다."
                  />
                </div>
              ) : (
                <div className="boss-scroll overflow-x-auto">
                <table className="boss-table">
                  <thead>
                    <tr>
                      <th>품명</th>
                      <th className="text-right">수량</th>
                      <th className="text-right">단가</th>
                      <th className="text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="wrap font-medium">{item.name ?? '-'}</td>
                        <td className="num text-boss-text-secondary">{item.qty ?? '-'}</td>
                        <td className="num text-boss-text-secondary">
                          {item.unitPrice != null ? won(item.unitPrice) : '-'}
                        </td>
                        <td className="num font-semibold">{item.amount != null ? won(item.amount) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </ContentCard>

            {/* 메모 */}
            <Panel title="메모" kicker="NOTE">
              {data.memo ? (
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.7] text-boss-text">{data.memo}</p>
              ) : (
                <p className="text-[13px] text-boss-text-secondary">
                  메모가 없습니다. 어느 현장 지출인지 적어 두면 월 정산 때 찾기 쉽습니다.
                </p>
              )}
            </Panel>
          </>
        )}
      </div>

      {/* ── 우: 요약 · 이미지 · 작업 ── */}
      <div className="flex flex-col gap-4">
        <Panel title="요약" kicker="RECEIPT">
          <dl>
            <DescRow
              label="사업자번호"
              value={
                data.bizNo ? (
                  <span className="font-boss-head tabular-nums">{data.bizNo}</span>
                ) : (
                  <span className="font-normal text-boss-text-muted">—</span>
                )
              }
            />
            <DescRow
              label="거래일"
              value={<span className="font-boss-head tabular-nums">{formatDate(data.txDate)}</span>}
            />
            <DescRow label="카테고리" value={categoryLabel(data.category)} />
            <DescRow
              label="결제수단"
              value={
                data.paymentMethod ? (
                  paymentLabel(data.paymentMethod)
                ) : (
                  <span className="font-normal text-boss-text-muted">—</span>
                )
              }
            />
            <DescRow
              label="공급가액"
              value={<span className="font-boss-head tabular-nums">{won(supplyAmount)}</span>}
            />
            <DescRow
              label="부가세"
              value={
                data.taxAmount != null ? (
                  <span className="font-boss-head tabular-nums">{won(data.taxAmount)}</span>
                ) : (
                  <span className="font-normal text-boss-text-muted">—</span>
                )
              }
            />
            <DescRow
              label="총 금액"
              value={
                <span className="font-boss-head text-[15px] tabular-nums text-boss-primary">
                  {won(data.totalAmount)}
                </span>
              }
            />
          </dl>
        </Panel>

        {data.imageUrl && (
          <Panel title="영수증 이미지" kicker="SCAN">
            <a
              href={data.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-boss-border bg-boss-inset"
              aria-label="영수증 이미지 새 창에서 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.imageUrl} alt={data.vendorName ?? '영수증'} className="w-full object-contain" />
            </a>
          </Panel>
        )}

        <Panel title="작업" kicker="ACTIONS">
          <div className="flex flex-col gap-2">
            {!editing && (
              <Button variant="primary" icon={Pencil} onClick={() => setEditing(true)} className="w-full">
                내용 수정
              </Button>
            )}
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={load}
              disabled={loading || saving}
              className="w-full"
            >
              새로고침
            </Button>
            <ButtonLink href="/boss/receipt" variant="secondary" icon={ArrowLeft} className="w-full">
              목록으로
            </ButtonLink>
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => setConfirmDelete(true)}
              className="w-full !text-boss-text-muted hover:!text-boss-error"
            >
              삭제
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            삭제하면 월 합계에서 바로 빠지며 복구할 수 없습니다.
          </p>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="이 영수증을 삭제할까요?"
        description={`'${data.vendorName ?? '거래처 미상'}' 영수증을 삭제합니다. 삭제 후 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
