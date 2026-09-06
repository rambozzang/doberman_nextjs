'use client';

// 고객 견적서 품목(견적 내역) — 앱 `lib/app/estimate` 와 같은 규칙
//
// 품목은 견적서 헤더가 아니라 "고객" 에 붙는다 (GET /estimateitems/{customerId}).
// 견적서 · 거래명세서 인쇄물은 전적으로 이 품목을 읽어 그린다. 웹에는 등록 화면이 없어서
// 사장님이 품목을 넣을 수 없었고, 그래서 인쇄물이 빈 채로 나왔다.
//
// 금액 계산은 앱 estimate_cntr.calculate() 와 똑같이 맞춘다.
//   단가는 부가세가 포함된 값으로 입력한다.
//   합계 = 수량 × 단가
//   비과세(isTaxFree='Y') → 공급가 = 합계, 부가세 = 0
//   과세                  → 공급가 = floor(합계 / 1.1), 부가세 = 합계 − 공급가

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Pencil, Trash2, X } from 'lucide-react';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { toKoreanAmountLabel } from '@/lib/boss/koreanAmount';
import type { BossEstimateItem } from '@/types/boss-estimate';
import {
  ContentCard,
  CardHead,
  DataTable,
  Button,
  ButtonLink,
  Field,
  TextareaField,
  AlertBanner,
  EmptyState,
  RowSkeleton,
  ConfirmDialog,
  Tag,
} from '@/components/boss/ui';

/** 앱 calculate() 와 동일한 금액 계산 */
export function calcAmounts(quantity: number, unitPrice: number, taxFree: boolean) {
  const total = Math.max(0, Math.trunc(quantity)) * Math.max(0, Math.trunc(unitPrice));
  if (taxFree) return { supplyAmount: total, vatAmount: 0, totalAmount: total };
  const supplyAmount = Math.floor(total / 1.1);
  return { supplyAmount, vatAmount: total - supplyAmount, totalAmount: total };
}

function won(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '₩0';
  return `₩${n.toLocaleString('ko-KR')}`;
}

/** 콤마가 섞인 입력에서 숫자만 뽑는다 */
function toNumber(v: string): number {
  const n = Number(v.replace(/[^0-9]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

type FormState = {
  id?: number;
  itemName: string;
  itemSpec: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  taxFree: boolean;
  memo: string;
};

const EMPTY_FORM: FormState = {
  itemName: '',
  itemSpec: '',
  unit: '',
  quantity: '1',
  unitPrice: '',
  taxFree: false,
  memo: '',
};

export default function EstimateItemsPanel({
  customerId,
  onTotalChange,
}: {
  customerId: string;
  /** 합계가 바뀌면 알려 준다 (상위에서 견적서 헤더 금액을 함께 보여 줄 때 사용) */
  onTotalChange?: (total: number) => void;
}) {
  const [items, setItems] = useState<BossEstimateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BossEstimateItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossEstimateApi.list(customerId);
      if (res.success !== false && Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
        setError(res.message || res.error || '품목을 불러오지 못했습니다.');
      }
    } catch {
      setItems([]);
      setError('네트워크 오류로 품목을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const acc = { count: 0, quantity: 0, supply: 0, vat: 0, total: 0 };
    for (const it of items) {
      acc.count += 1;
      acc.quantity += it.quantity ?? 0;
      acc.supply += it.supplyAmount ?? 0;
      acc.vat += it.vatAmount ?? 0;
      acc.total += it.totalAmount ?? 0;
    }
    return acc;
  }, [items]);

  useEffect(() => {
    onTotalChange?.(totals.total);
  }, [totals.total, onTotalChange]);

  // 입력 중인 값으로 미리 계산해 보여 준다 (앱과 같이 단가는 부가세 포함)
  const preview = calcAmounts(toNumber(form.quantity), toNumber(form.unitPrice), form.taxFree);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (it: BossEstimateItem) => {
    setForm({
      id: it.id,
      itemName: it.itemName ?? '',
      itemSpec: it.itemSpec ?? '',
      unit: it.unit ?? '',
      quantity: String(it.quantity ?? 0),
      unitPrice: String(it.unitPrice ?? 0),
      taxFree: it.isTaxFree === 'Y',
      memo: it.memo ?? '',
    });
    setFormOpen(true);
  };

  const onSave = async () => {
    if (saving) return;
    if (!form.itemName.trim()) {
      toast.error('품목명을 입력하세요.');
      return;
    }
    const quantity = toNumber(form.quantity);
    const unitPrice = toNumber(form.unitPrice);
    if (quantity <= 0) {
      toast.error('수량을 입력하세요.');
      return;
    }
    if (unitPrice <= 0) {
      toast.error('단가를 입력하세요.');
      return;
    }
    const amounts = calcAmounts(quantity, unitPrice, form.taxFree);
    setSaving(true);
    try {
      const payload = {
        customerId: Number(customerId),
        // 백엔드가 필수(NOT NULL)로 받는다. 앱이 넣은 기존 데이터도 전부 0 이라 0 으로 맞춘다.
        estimateId: 0,
        itemName: form.itemName.trim(),
        itemSpec: form.itemSpec.trim(),
        unit: form.unit.trim(),
        quantity,
        unitPrice,
        isTaxFree: (form.taxFree ? 'Y' : 'N') as 'Y' | 'N',
        // 단가에 부가세가 포함돼 있으므로 "부가세 별도 추가" 플래그는 앱과 같이 N 이다
        isVat: 'N' as 'Y' | 'N',
        memo: form.memo.trim(),
        supplyAmount: amounts.supplyAmount,
        vatAmount: amounts.vatAmount,
        totalAmount: amounts.totalAmount,
        totalAmountKor: toKoreanAmountLabel(amounts.totalAmount),
      };
      const res = form.id
        ? await bossEstimateApi.update({ ...payload, id: form.id })
        : await bossEstimateApi.create(payload);
      if (res.success !== false) {
        toast.success(form.id ? '품목을 수정했습니다.' : '품목을 등록했습니다.');
        setFormOpen(false);
        setForm(EMPTY_FORM);
        await load();
      } else {
        toast.error(res.message || res.error || '저장하지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const target = deleteTarget;
    if (!target?.id || deleting) return;
    setDeleting(true);
    try {
      const res = await bossEstimateApi.remove(target.id);
      if (res.success !== false) {
        toast.success('품목을 삭제했습니다.');
        setDeleteTarget(null);
        await load();
      } else {
        toast.error(res.message || res.error || '삭제하지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제하지 못했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ContentCard>
      <CardHead
        title="견적 품목"
        meta="견적서 · 거래명세서는 이 품목으로 만들어집니다"
        count={loading ? undefined : `${totals.count}건`}
        countTone="muted"
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-boss-border px-5 py-3">
        <p className="text-[12px] text-boss-text-secondary">단가는 부가세를 포함해 입력합니다.</p>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => load()}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>
            품목 추가
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-5 pt-4">
          <AlertBanner
            tone="bad"
            action={
              <Button variant="primary" size="sm" onClick={() => load()}>
                다시 시도
              </Button>
            }
          >
            {error}
          </AlertBanner>
        </div>
      )}

      {/* ───── 입력 폼 ───── */}
      {formOpen && (
        <div className="border-b border-boss-border bg-boss-inset px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-boss-text">
              {form.id ? '품목 수정' : '새 품목'}
            </p>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
              aria-label="닫기"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <Field
              className="col-span-2"
              id="itemName"
              label="품목명"
              required
              value={form.itemName}
              onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
              placeholder="예: 실크 도배"
            />
            <Field
              id="itemSpec"
              label="규격"
              value={form.itemSpec}
              onChange={(e) => setForm((f) => ({ ...f, itemSpec: e.target.value }))}
              placeholder="예: 광폭"
            />
            <Field
              id="unit"
              label="단위"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="예: 롤"
            />
            <Field
              id="quantity"
              label="수량"
              required
              inputMode="numeric"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            <Field
              id="unitPrice"
              label="단가"
              required
              inputMode="numeric"
              hint="부가세 포함"
              value={form.unitPrice ? toNumber(form.unitPrice).toLocaleString('ko-KR') : ''}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            />
            <TextareaField
              className="col-span-2 md:col-span-6"
              id="memo"
              label="메모"
              rows={2}
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-boss-border pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-boss-text">
              <input
                type="checkbox"
                checked={form.taxFree}
                onChange={(e) => setForm((f) => ({ ...f, taxFree: e.target.checked }))}
              />
              비과세
            </label>
            <span className="text-[12px] text-boss-text-secondary">
              공급가{' '}
              <b className="font-boss-head tabular-nums text-boss-text">{won(preview.supplyAmount)}</b>
            </span>
            <span className="text-[12px] text-boss-text-secondary">
              부가세{' '}
              <b className="font-boss-head tabular-nums text-boss-text">{won(preview.vatAmount)}</b>
            </span>
            <span className="text-[12px] text-boss-text-secondary">
              합계{' '}
              <b className="font-boss-head text-[15px] tabular-nums text-boss-text">
                {won(preview.totalAmount)}
              </b>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setFormOpen(false)}>
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={() => void onSave()} disabled={saving}>
                {saving ? '저장 중…' : form.id ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───── 품목 표 ───── */}
      {loading && items.length === 0 ? (
        <RowSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title="등록된 품목이 없습니다"
          description="품목을 넣어야 견적서 · 거래명세서에 내역과 금액이 찍힙니다. 단가는 부가세를 포함해 입력하세요."
          action={
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>
              품목 추가
            </Button>
          }
        />
      ) : (
        <>
          <div className="boss-scroll overflow-x-auto">
            <DataTable className="border-b-0">
              <thead>
                <tr>
                  <th>품목</th>
                  <th>규격 · 단위</th>
                  <th className="text-right">수량</th>
                  <th className="text-right">단가</th>
                  <th className="text-right">공급가</th>
                  <th className="text-right">부가세</th>
                  <th className="text-right">합계</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="font-semibold text-boss-text">
                      {it.itemName || '이름 없음'}
                      {it.isTaxFree === 'Y' && (
                        <Tag tone="neutral" className="ml-1.5">
                          비과세
                        </Tag>
                      )}
                      {it.memo ? (
                        <span className="block text-[11.5px] text-boss-text-muted">{it.memo}</span>
                      ) : null}
                    </td>
                    <td className="text-boss-text-secondary">
                      {[it.itemSpec, it.unit].filter(Boolean).join(' · ') || '-'}
                    </td>
                    <td className="num text-boss-text-secondary">
                      {(it.quantity ?? 0).toLocaleString('ko-KR')}
                    </td>
                    <td className="num text-boss-text-secondary">{won(it.unitPrice)}</td>
                    <td className="num text-boss-text-secondary">{won(it.supplyAmount)}</td>
                    <td className="num text-boss-text-secondary">{won(it.vatAmount)}</td>
                    <td className="num font-semibold text-boss-text">{won(it.totalAmount)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center !text-boss-text-muted hover:bg-boss-elevated hover:!text-boss-text"
                          title="수정"
                          onClick={() => openEdit(it)}
                        >
                          <Pencil size={13} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center !text-boss-text-muted hover:bg-boss-elevated hover:!text-boss-error"
                          title="삭제"
                          onClick={() => setDeleteTarget(it)}
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>

          {/* ───── 합계 ───── */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-boss-border bg-boss-inset px-5 py-4">
            <div>
              <p className="boss-mono-label">품목 · 수량</p>
              <p className="font-boss-head text-[15px] tabular-nums text-boss-text">
                {totals.count}건 · {totals.quantity.toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <p className="boss-mono-label">공급가</p>
              <p className="font-boss-head text-[15px] tabular-nums text-boss-text">
                {won(totals.supply)}
              </p>
            </div>
            <div>
              <p className="boss-mono-label">부가세</p>
              <p className="font-boss-head text-[15px] tabular-nums text-boss-text">
                {won(totals.vat)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="boss-mono-label">합계 금액</p>
              <p className="font-boss-head text-[26px] font-semibold leading-none tabular-nums text-boss-text">
                {won(totals.total)}
              </p>
              <p className="mt-1 text-[11.5px] text-boss-text-secondary">
                {toKoreanAmountLabel(totals.total)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-boss-border px-5 py-3">
            <ButtonLink href={`/boss/estimate/${customerId}/print`} variant="primary" size="sm">
              견적서 인쇄 · PDF
            </ButtonLink>
            <ButtonLink href={`/boss/estimate/${customerId}/receipt`} variant="secondary" size="sm">
              거래명세서 · 영수증
            </ButtonLink>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 품목을 삭제할까요?"
        description={`'${deleteTarget?.itemName ?? '선택한 품목'}' 을(를) 견적에서 뺍니다. 인쇄물 금액도 함께 줄어듭니다.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void onDelete()}
      />
    </ContentCard>
  );
}
