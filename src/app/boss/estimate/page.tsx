'use client';

// 사장님 견적서(품목) 관리 페이지
// Flutter `lib/app/estimate/estimate_page.dart` 의 핵심 흐름을 Next.js B2B 다크 테마로 포팅.
// - customerId 를 입력해 해당 고객의 견적 품목 리스트를 조회
// - 신규 등록 / 수정 / 삭제 모달 제공
// - 합계(품목수, 수량, 공급가, 부가세, 합계) 표시

import { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Search,
  Inbox,
  Receipt,
  Package,
  Calculator,
  X,
  Save,
} from 'lucide-react';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { bossEstimatesApi } from '@/lib/api/boss/estimates';
import type {
  BossEstimate,
  BossEstimateItem,
  BossEstimateItemCreateRequest,
  BossEstimateTotals,
} from '@/types/boss-estimate';

// 기본 품목 칩 (Flutter EstimateItemBottomSheet 의 checkboxItems 와 동일)
const QUICK_ITEM_CHIPS = ['자재비', '부재료비', '인건비', '공과잡비', '식대', '기타'];

// 천단위 콤마 포매팅
const fmtMoney = (v?: number | string | null): string => {
  if (v === null || v === undefined || v === '') return '0';
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '')) : v;
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('ko-KR');
};

// 합계 계산
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

// 품목 폼 상태
interface ItemFormState {
  itemName: string;
  itemSpec: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  memo: string;
  isTaxFree: boolean;
  isVat: boolean;
}

const EMPTY_FORM: ItemFormState = {
  itemName: '',
  itemSpec: '',
  unit: '',
  quantity: '',
  unitPrice: '',
  memo: '',
  isTaxFree: false,
  isVat: true,
};

// 폼 → 계산 결과 (Flutter EstimateCntr.calculate / calculate3 로직)
function calcFromForm(form: ItemFormState): { supply: number; vat: number; total: number } {
  const qty = Number(form.quantity || '0');
  const price = Number((form.unitPrice || '0').toString().replace(/,/g, ''));
  if (!qty || !price) return { supply: 0, vat: 0, total: 0 };

  if (form.isVat) {
    // 부가세 추가: 공급가=수량*단가, 부가세=공급가*0.1
    const supply = qty * price;
    const vat = Math.floor(supply * 0.1);
    return { supply, vat, total: supply + vat };
  }
  if (form.isTaxFree) {
    // 비과세: 공급가 = 합계, 부가세 0
    const total = qty * price;
    return { supply: total, vat: 0, total };
  }
  // 일반(부가세 포함): 합계에서 역산
  const total = qty * price;
  const supply = Math.floor(total / 1.1);
  return { supply, vat: total - supply, total };
}

export default function BossEstimatePage() {
  // 고객 ID (Flutter g_customerId)
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [customerId, setCustomerId] = useState<string>('');

  // 해당 고객의 견적서 목록 및 선택된 견적서 ID
  const [estimates, setEstimates] = useState<BossEstimate[]>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);

  const [items, setItems] = useState<BossEstimateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingEstimateId, setEditingEstimateId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // 품목 조회
  const loadItems = useCallback(async (cid: string) => {
    if (!cid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossEstimateApi.list(cid);
      if (res.success !== false && res.data) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else if (res.success === false) {
        setError(res.message || '품목을 불러오지 못했습니다.');
        setItems([]);
      } else {
        setItems([]);
      }
    } catch {
      setError('네트워크 오류로 품목을 불러오지 못했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 고객별 견적서 목록 조회
  const loadEstimates = useCallback(async (cid: string) => {
    if (!cid) return;
    setEstimatesLoading(true);
    try {
      const res = await bossEstimatesApi.listByCustomer(cid);
      const list = Array.isArray(res.data) ? res.data : [];
      setEstimates(list);
      // 최신 견적서를 기본 선택
      const latest =
        list.find((e) => !e.deletedDt) ??
        (list.length > 0 ? list[list.length - 1] : null);
      setSelectedEstimateId(latest?.id ?? null);
    } catch {
      setEstimates([]);
      setSelectedEstimateId(null);
    } finally {
      setEstimatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (customerId) {
      loadItems(customerId);
      loadEstimates(customerId);
    }
  }, [customerId, loadItems, loadEstimates]);

  const totals = useMemo(() => computeTotals(items), [items]);
  const calcPreview = useMemo(() => calcFromForm(form), [form]);

  // 고객 ID 적용
  const onApplyCustomerId = (e: React.FormEvent) => {
    e.preventDefault();
    const v = customerIdInput.trim();
    if (!v) {
      toast.error('고객 ID를 입력하세요.');
      return;
    }
    setCustomerId(v);
    setEstimates([]);
    setSelectedEstimateId(null);
  };

  // 신규 등록 모달 열기
  const openCreateModal = () => {
    if (!customerId) {
      toast.error('먼저 고객 ID를 입력하세요.');
      return;
    }
    if (selectedEstimateId == null) {
      toast.error('등록할 견적서를 선택하세요.');
      return;
    }
    setModalMode('create');
    setEditingId(null);
    setEditingEstimateId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  // 수정 모달 열기
  const openEditModal = (item: BossEstimateItem) => {
    setModalMode('edit');
    setEditingId(item.id ?? null);
    setEditingEstimateId(item.estimateId ?? null);
    setForm({
      itemName: item.itemName ?? '',
      itemSpec: item.itemSpec ?? '',
      unit: item.unit ?? '',
      quantity: item.quantity != null ? String(item.quantity) : '',
      unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
      memo: item.memo ?? '',
      isTaxFree: item.isTaxFree === 'Y',
      isVat: item.isVat === 'Y',
    });
    setModalOpen(true);
  };

  // 폼 검증
  const validateForm = (): boolean => {
    if (!form.itemName.trim()) {
      toast.error('품목명을 입력하세요.');
      return false;
    }
    if (!form.quantity.trim() || Number(form.quantity) <= 0) {
      toast.error('수량을 입력하세요.');
      return false;
    }
    if (!form.unitPrice.trim() || Number(form.unitPrice.replace(/,/g, '')) <= 0) {
      toast.error('단가를 입력하세요.');
      return false;
    }
    return true;
  };

  // 페이로드 생성
  const buildPayload = (): BossEstimateItemCreateRequest => {
    const { supply, vat, total } = calcFromForm(form);
    return {
      customerId: Number(customerId),
      estimateId: editingEstimateId ?? selectedEstimateId ?? undefined,
      itemName: form.itemName.trim(),
      itemSpec: form.itemSpec.trim(),
      unit: form.unit.trim(),
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice.replace(/,/g, '')),
      isTaxFree: form.isTaxFree ? 'Y' : 'N',
      isVat: form.isVat ? 'Y' : 'N',
      memo: form.memo.trim(),
      supplyAmount: supply,
      vatAmount: vat,
      totalAmount: total,
      totalAmountKor: '',
    };
  };

  // 등록(저장 또는 연속 저장)
  const onCreate = async (continueAfter: boolean) => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await bossEstimateApi.create(buildPayload());
      if (res.success === false) {
        toast.error(res.message || '품목 등록 실패');
        return;
      }
      toast.success('품목이 등록되었습니다.');
      await loadItems(customerId);
      if (continueAfter) {
        // 연속 등록: 폼 비우고 모달 유지
        setForm({ ...EMPTY_FORM });
      } else {
        setModalOpen(false);
      }
    } catch {
      toast.error('네트워크 오류로 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 수정
  const onUpdate = async () => {
    if (!validateForm() || editingId == null) return;
    setSubmitting(true);
    try {
      const payload = { ...buildPayload(), id: editingId };
      const res = await bossEstimateApi.update(payload);
      if (res.success === false) {
        toast.error(res.message || '품목 수정 실패');
        return;
      }
      toast.success('품목이 수정되었습니다.');
      await loadItems(customerId);
      setModalOpen(false);
    } catch {
      toast.error('네트워크 오류로 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 삭제
  const onDelete = async (id?: number) => {
    if (id == null) return;
    if (!confirm('이 품목을 삭제하시겠습니까?')) return;
    try {
      const res = await bossEstimateApi.remove(id);
      if (res.success === false) {
        toast.error(res.message || '품목 삭제 실패');
        return;
      }
      toast.success('품목이 삭제되었습니다.');
      await loadItems(customerId);
    } catch {
      toast.error('네트워크 오류로 삭제에 실패했습니다.');
    }
  };

  // 빠른 품목 칩 클릭
  const onPickChip = (text: string) => {
    setForm((prev) => ({ ...prev, itemName: text }));
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Receipt size={20} className="text-boss-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">견적서 품목 관리</h1>
            <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-xs font-semibold text-boss-text-secondary">
              {totals.totalItems.toLocaleString()}건
            </span>
          </div>
          <p className="text-sm text-boss-text-muted">
            고객 ID 별로 견적 품목을 등록·수정·삭제하고 합계를 확인하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={onApplyCustomerId} className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted"
              />
              <input
                value={customerIdInput}
                onChange={(e) => setCustomerIdInput(e.target.value)}
                placeholder="고객 ID 입력"
                inputMode="numeric"
                className="h-9 w-44 rounded-lg border border-boss-border bg-boss-surface pl-9 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
              />
            </div>
            <button
              type="submit"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
            >
              조회
            </button>
          </form>

          {customerId && (
            <div className="relative">
              <select
                value={selectedEstimateId ?? ''}
                onChange={(e) => setSelectedEstimateId(e.target.value ? Number(e.target.value) : null)}
                disabled={estimatesLoading || estimates.length === 0}
                className="h-9 min-w-[10rem] rounded-lg border border-boss-border bg-boss-surface pl-3 pr-8 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10 disabled:opacity-50"
              >
                {estimatesLoading ? (
                  <option>견적서 로딩 중…</option>
                ) : estimates.length === 0 ? (
                  <option value="">견적서 없음</option>
                ) : (
                  estimates.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id}번 {e.customerName} {e.estimateDate ? `(${e.estimateDate})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => customerId && loadItems(customerId)}
            disabled={!customerId || loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-semibold text-emerald-950 hover:bg-boss-primary-hover"
          >
            <Plus size={14} /> 품목 추가
          </button>
        </div>
      </div>

      {/* 합계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="품목수" value={`${totals.totalItems.toLocaleString()}건`} icon={<Package size={14} />} />
        <SummaryCard label="총 수량" value={totals.totalQuantity.toLocaleString()} icon={<Calculator size={14} />} />
        <SummaryCard label="공급가" value={fmtMoney(totals.supplyAmount)} />
        <SummaryCard label="부가세" value={fmtMoney(totals.vatAmount)} />
        <SummaryCard label="합계" value={fmtMoney(totals.totalAmount)} highlight />
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 품목 테이블 */}
      {!customerId ? (
        <EmptyState
          title="고객 ID를 먼저 입력하세요"
          description="우측 상단의 입력란에 고객 ID를 넣고 조회 버튼을 누르세요."
        />
      ) : loading && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl border border-boss-border bg-boss-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="등록된 품목이 없습니다"
          description="우측 상단 ‘품목 추가’ 버튼으로 새 품목을 등록하세요."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/30">
          <table className="w-full text-sm">
            <thead className="border-b border-boss-border bg-boss-surface text-xs uppercase tracking-wider text-boss-text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">품목명</th>
                <th className="px-4 py-3 text-left font-medium">규격</th>
                <th className="px-4 py-3 text-left font-medium">단위</th>
                <th className="px-4 py-3 text-right font-medium">수량</th>
                <th className="px-4 py-3 text-right font-medium">단가</th>
                <th className="px-4 py-3 text-right font-medium">공급가</th>
                <th className="px-4 py-3 text-right font-medium">부가세</th>
                <th className="px-4 py-3 text-right font-medium">합계</th>
                <th className="px-4 py-3 text-center font-medium">세금</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((it, idx) => (
                <tr key={it.id ?? idx} className="group transition-colors hover:bg-boss-elevated/40">
                  <td className="px-4 py-3 text-xs text-boss-text-muted">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-boss-text">{it.itemName ?? '-'}</td>
                  <td className="px-4 py-3 text-boss-text-secondary">{it.itemSpec || '-'}</td>
                  <td className="px-4 py-3 text-boss-text-secondary">{it.unit || '-'}</td>
                  <td className="px-4 py-3 text-right text-boss-text-secondary">
                    {(it.quantity ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-boss-text-secondary">{fmtMoney(it.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-boss-text-secondary">{fmtMoney(it.supplyAmount)}</td>
                  <td className="px-4 py-3 text-right text-boss-text-secondary">{fmtMoney(it.vatAmount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-boss-primary">
                    {fmtMoney(it.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {it.isTaxFree === 'Y' ? (
                      <span className="inline-flex items-center rounded-full bg-boss-warning/10 px-2 py-0.5 text-[10px] font-semibold text-boss-warning ring-1 ring-inset ring-amber-500/30">
                        비과세
                      </span>
                    ) : it.isVat === 'Y' ? (
                      <span className="inline-flex items-center rounded-full bg-boss-info/10 px-2 py-0.5 text-[10px] font-semibold text-boss-info ring-1 ring-inset ring-boss-info/30">
                        부가세+
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-boss-elevated/40 px-2 py-0.5 text-[10px] font-semibold text-boss-text-secondary ring-1 ring-inset ring-boss-border/30">
                        포함
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(it)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-boss-border bg-boss-surface text-boss-text-secondary hover:border-boss-primary/20 hover:text-boss-primary"
                        aria-label="수정"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(it.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-boss-border bg-boss-surface text-boss-text-secondary hover:border-boss-error/20 hover:text-boss-error"
                        aria-label="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-boss-bg/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-boss-border bg-boss-surface shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-boss-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-boss-primary" />
                <h2 className="text-base font-semibold text-boss-text">
                  {modalMode === 'create' ? '견적 품목 추가' : '견적 품목 수정'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
              {/* 빠른 품목 칩 */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ITEM_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onPickChip(chip)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      form.itemName === chip
                        ? 'border-boss-primary/20 bg-boss-primary/10 text-boss-primary'
                        : 'border-boss-border bg-boss-surface text-boss-text-secondary hover:border-boss-border hover:text-boss-text'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* 품목명 */}
              <Field label="품목명" required>
                <input
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  maxLength={20}
                  placeholder="자재비, 인건비 등"
                  className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/40 px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                />
              </Field>

              {/* 수량 / 단가 / 세금 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="수량" required>
                  <input
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    inputMode="numeric"
                    placeholder="갯수"
                    className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/40 px-3 text-right text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                  />
                </Field>
                <Field label="단가" required>
                  <input
                    value={form.unitPrice}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setForm({ ...form, unitPrice: raw ? Number(raw).toLocaleString('ko-KR') : '' });
                    }}
                    inputMode="numeric"
                    placeholder="금액"
                    className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/40 px-3 text-right text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CheckChip
                  checked={form.isTaxFree}
                  onChange={(v) =>
                    setForm({ ...form, isTaxFree: v, isVat: v ? false : form.isVat })
                  }
                  label="비과세"
                />
                <CheckChip
                  checked={form.isVat}
                  onChange={(v) =>
                    setForm({ ...form, isVat: v, isTaxFree: v ? false : form.isTaxFree })
                  }
                  label="부가세 추가"
                />
              </div>

              {/* 규격 / 단위 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="규격">
                  <input
                    value={form.itemSpec}
                    onChange={(e) => setForm({ ...form, itemSpec: e.target.value })}
                    maxLength={20}
                    placeholder="규격"
                    className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/40 px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                  />
                </Field>
                <Field label="단위">
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    maxLength={20}
                    placeholder="ex) EA, m, kg"
                    className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/40 px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                  />
                </Field>
              </div>

              <Field label="메모">
                <input
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="메모 사항"
                  className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/40 px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                />
              </Field>

              {/* 계산 미리보기 */}
              <div className="rounded-xl border border-boss-border bg-boss-bg/40 p-3">
                <div className="flex items-center justify-between text-xs text-boss-text-muted">
                  <span>공급가</span>
                  <span className="font-semibold text-boss-text">{fmtMoney(calcPreview.supply)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-boss-text-muted">
                  <span>부가세</span>
                  <span className="font-semibold text-boss-text">{fmtMoney(calcPreview.vat)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-boss-border pt-2 text-sm">
                  <span className="text-boss-text-secondary">합계</span>
                  <span className="text-base font-bold text-boss-primary">
                    {fmtMoney(calcPreview.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-2 border-t border-boss-border px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-4 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
              >
                취소
              </button>
              {modalMode === 'create' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onCreate(true)}
                    disabled={submitting}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-primary/20 bg-boss-primary/10 px-4 text-sm font-semibold text-boss-primary hover:bg-boss-primary/20 disabled:opacity-50"
                  >
                    <Plus size={14} /> 연속 저장
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreate(false)}
                    disabled={submitting}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-4 text-sm font-semibold text-emerald-950 hover:bg-boss-primary-hover disabled:opacity-50"
                  >
                    <Save size={14} /> 저장
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onUpdate}
                  disabled={submitting}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-4 text-sm font-semibold text-emerald-950 hover:bg-boss-primary-hover disabled:opacity-50"
                >
                  <Save size={14} /> 수정 저장
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 보조 컴포넌트 ============

function SummaryCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? 'border-boss-primary/30 bg-boss-primary/5'
          : 'border-boss-border bg-boss-surface'
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-boss-text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p
        className={`text-lg font-bold ${
          highlight ? 'text-boss-primary' : 'text-boss-text'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
        <Inbox size={20} />
      </div>
      <p className="text-sm font-medium text-boss-text">{title}</p>
      <p className="mt-1 text-xs text-boss-text-muted">{description}</p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-boss-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-boss-error">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckChip({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        checked
          ? 'border-boss-primary/20 bg-boss-primary/10 text-boss-primary'
          : 'border-boss-border bg-boss-surface text-boss-text-muted hover:border-boss-border hover:text-boss-text'
      }`}
    >
      <span
        className={`h-3 w-3 rounded-sm border ${
          checked ? 'border-emerald-400 bg-boss-primary' : 'border-boss-border'
        }`}
      />
      {label}
    </button>
  );
}
