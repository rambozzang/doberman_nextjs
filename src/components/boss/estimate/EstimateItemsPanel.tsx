'use client';

// 고객 견적서 품목(견적 내역) — 앱 `lib/app/estimate` 와 같은 규칙
//
// 품목은 견적서 헤더가 아니라 "고객" 에 붙는다 (GET /estimateitems/{customerId}).
// 견적서 · 영수증 인쇄물은 전적으로 이 품목을 읽어 그린다.
//
// 표에서 바로 고친다(2026-09-08). 예전에는 폼을 열고 → 채우고 → 저장하고 → 다시 열어야 해서
// 품목 다섯 줄 넣는 데 같은 일을 다섯 번 반복해야 했다. 지금은 장부 쓰듯 칸에 바로 적고,
// 줄을 벗어나거나 Enter 를 누르면 저장된다. 맨 아래 빈 줄에 적기 시작하면 다음 빈 줄이 생긴다.
//
// 금액 계산은 앱 estimate_cntr 의 calculate() · calculate3() 와 똑같이 맞춘다.
// 과세 방식은 하나만 고른다(앱 changeTaxFree · changeVat 가 서로를 끈다).
//
//   VAT 포함(기본)      단가에 부가세가 들어 있다.
//                       합계 = 수량 × 단가 · 공급가 = floor(합계 / 1.1) · 부가세 = 합계 − 공급가
//   비과세 isTaxFree=Y  부가세가 없다.
//                       합계 = 수량 × 단가 · 공급가 = 합계 · 부가세 = 0
//   ±과세  isVat=Y      단가는 부가세 별도, 10% 를 얹는다.
//                       공급가 = 수량 × 단가 · 부가세 = trunc(공급가 × 0.1) · 합계 = 공급가 + 부가세

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { toKoreanAmountLabel } from '@/lib/boss/koreanAmount';
import type { BossEstimateItem } from '@/types/boss-estimate';
import {
  ContentCard,
  CardHead,
  Button,
  ButtonLink,
  AlertBanner,
  EmptyState,
  RowSkeleton,
  ConfirmDialog,
} from '@/components/boss/ui';

/** 과세 방식 — 앱의 isTaxFree · isVat 두 체크를 하나의 값으로 */
export type TaxMode = 'included' | 'taxFree' | 'addVat';

export function taxModeOf(isTaxFree?: string | null, isVat?: string | null): TaxMode {
  if (isTaxFree === 'Y') return 'taxFree';
  if (isVat === 'Y') return 'addVat';
  return 'included';
}

/** 앱 calculate()(기본 · 비과세) · calculate3()(±과세) 와 동일한 금액 계산 */
export function calcAmounts(quantity: number, unitPrice: number, mode: TaxMode) {
  const base = Math.max(0, Math.trunc(quantity)) * Math.max(0, Math.trunc(unitPrice));
  if (mode === 'addVat') {
    // 공급가에 10% 를 얹는다 — 앱은 toInt() 로 소수점을 버린다
    const vatAmount = Math.trunc(base * 0.1);
    return { supplyAmount: base, vatAmount, totalAmount: base + vatAmount };
  }
  if (mode === 'taxFree') return { supplyAmount: base, vatAmount: 0, totalAmount: base };
  const supplyAmount = Math.floor(base / 1.1);
  return { supplyAmount, vatAmount: base - supplyAmount, totalAmount: base };
}

const TAX_MODE_LABEL: Record<TaxMode, string> = {
  included: 'VAT 포함',
  taxFree: '비과세',
  addVat: '± 과세',
};

/** 앱과 같은 상한 — 인쇄 서식이 감당하는 줄 수 */
const MAX_ITEMS = 14;

function won(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '₩0';
  return `₩${n.toLocaleString('ko-KR')}`;
}

/** 콤마가 섞인 입력에서 숫자만 뽑는다 */
function toNumber(v: string): number {
  const n = Number(String(v).replace(/[^0-9]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

const comma = (v: string) => {
  const n = toNumber(v);
  return n > 0 ? n.toLocaleString('ko-KR') : '';
};

type RowState = {
  /** 화면에서만 쓰는 키 — 저장 전에도 줄을 구분해야 한다 */
  key: string;
  /** 서버에 저장된 품목이면 있다 */
  id?: number;
  itemName: string;
  itemSpec: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  taxMode: TaxMode;
  memo: string;
  /** 고친 뒤 아직 저장하지 않았다 */
  dirty: boolean;
  saving: boolean;
  error?: string;
  /** 방금 저장했다 — 잠깐 체크 표시 */
  justSaved?: boolean;
};

let keySeq = 0;
const newKey = () => `row-${++keySeq}`;

function emptyRow(): RowState {
  return {
    key: newKey(),
    itemName: '',
    itemSpec: '',
    unit: '',
    quantity: '1',
    unitPrice: '',
    taxMode: 'included',
    memo: '',
    dirty: false,
    saving: false,
  };
}

function toRow(it: BossEstimateItem): RowState {
  return {
    key: newKey(),
    id: it.id,
    itemName: it.itemName ?? '',
    itemSpec: it.itemSpec ?? '',
    unit: it.unit ?? '',
    quantity: String(it.quantity ?? 0),
    unitPrice: String(it.unitPrice ?? 0),
    taxMode: taxModeOf(it.isTaxFree, it.isVat),
    memo: it.memo ?? '',
    dirty: false,
    saving: false,
  };
}

/** 적은 내용이 있는가 — 빈 줄은 저장하지 않는다 */
function hasContent(r: RowState): boolean {
  return r.itemName.trim().length > 0 || toNumber(r.unitPrice) > 0;
}

export default function EstimateItemsPanel({
  customerId,
  onTotalChange,
}: {
  customerId: string;
  /** 합계가 바뀌면 알려 준다 (상위에서 견적서 헤더 금액을 함께 보여 줄 때 사용) */
  onTotalChange?: (total: number) => void;
}) {
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RowState | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** 저장 중복을 막는다 — 줄에서 벗어남 · Enter 가 겹쳐 들어온다 */
  const savingKeys = useRef<Set<string>>(new Set());
  /** 최신 줄 상태 — 저장할 때 state 를 거치지 않고 바로 읽는다 */
  const rowsRef = useRef<RowState[]>([]);
  rowsRef.current = rows;

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossEstimateApi.list(customerId);
      if (res.success !== false && Array.isArray(res.data)) {
        setRows([...res.data.map(toRow), emptyRow()]);
      } else {
        setRows([emptyRow()]);
        setError(res.message || res.error || '품목을 불러오지 못했습니다.');
      }
    } catch {
      setRows([emptyRow()]);
      setError('네트워크 오류로 품목을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const savedCount = useMemo(() => rows.filter((r) => r.id != null).length, [rows]);

  const totals = useMemo(() => {
    const acc = { count: 0, quantity: 0, supply: 0, vat: 0, total: 0 };
    for (const r of rows) {
      if (!hasContent(r)) continue;
      const amounts = calcAmounts(toNumber(r.quantity), toNumber(r.unitPrice), r.taxMode);
      acc.count += 1;
      acc.quantity += toNumber(r.quantity);
      acc.supply += amounts.supplyAmount;
      acc.vat += amounts.vatAmount;
      acc.total += amounts.totalAmount;
    }
    return acc;
  }, [rows]);

  useEffect(() => {
    onTotalChange?.(totals.total);
  }, [totals.total, onTotalChange]);

  const patch = useCallback(
    (key: string, part: Partial<RowState>) =>
      setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...part } : r))),
    []
  );

  /** 값이 바뀌면 아직 저장 안 됨으로 두고, 마지막 빈 줄에 적기 시작했으면 다음 빈 줄을 붙인다 */
  const edit = (key: string, part: Partial<RowState>) => {
    setRows((rs) => {
      const next = rs.map((r) =>
        r.key === key ? { ...r, ...part, dirty: true, error: undefined, justSaved: false } : r
      );
      const last = next[next.length - 1];
      const saved = next.filter((r) => r.id != null).length;
      if (last && last.key === key && hasContent(last) && saved + 1 < MAX_ITEMS) {
        next.push(emptyRow());
      }
      return next;
    });
  };

  /** 줄 저장 — 줄에서 벗어나거나 Enter 를 누르면 부른다 */
  const commit = useCallback(
    async (key: string) => {
      if (savingKeys.current.has(key)) return;
      const row = rowsRef.current.find((r) => r.key === key);
      if (!row || !row.dirty || row.saving || !hasContent(row)) return;

      const quantity = toNumber(row.quantity);
      const unitPrice = toNumber(row.unitPrice);
      if (!row.itemName.trim()) {
        patch(key, { error: '품목명을 적어 주세요.' });
        return;
      }
      if (quantity <= 0 || unitPrice <= 0) {
        patch(key, { error: '수량과 단가를 적어 주세요.' });
        return;
      }

      savingKeys.current.add(key);
      patch(key, { saving: true, error: undefined });
      const amounts = calcAmounts(quantity, unitPrice, row.taxMode);
      const payload = {
        customerId: Number(customerId),
        // 백엔드가 필수(NOT NULL)로 받는다. 앱이 넣은 기존 데이터도 전부 0 이라 0 으로 맞춘다.
        estimateId: 0,
        itemName: row.itemName.trim(),
        itemSpec: row.itemSpec.trim(),
        unit: row.unit.trim(),
        quantity,
        unitPrice,
        // 앱과 같은 두 플래그 — 둘 중 하나만 Y 가 된다
        isTaxFree: (row.taxMode === 'taxFree' ? 'Y' : 'N') as 'Y' | 'N',
        isVat: (row.taxMode === 'addVat' ? 'Y' : 'N') as 'Y' | 'N',
        memo: row.memo.trim(),
        supplyAmount: amounts.supplyAmount,
        vatAmount: amounts.vatAmount,
        totalAmount: amounts.totalAmount,
        totalAmountKor: toKoreanAmountLabel(amounts.totalAmount),
      };

      try {
        const res = row.id
          ? await bossEstimateApi.update({ ...payload, id: row.id })
          : await bossEstimateApi.create(payload);
        if (res.success !== false) {
          const savedId = row.id ?? (res.data as BossEstimateItem | undefined)?.id;
          patch(key, { id: savedId, dirty: false, saving: false, justSaved: true });
          window.setTimeout(() => patch(key, { justSaved: false }), 1600);
          // 서버가 새 id 를 안 주면 목록을 다시 읽어 맞춘다(수정 · 삭제가 id 를 쓴다)
          if (!savedId) void load();
        } else {
          patch(key, { saving: false, error: res.message || res.error || '저장하지 못했습니다.' });
        }
      } catch {
        patch(key, { saving: false, error: '네트워크 오류로 저장하지 못했습니다.' });
      } finally {
        savingKeys.current.delete(key);
      }
    },
    [customerId, load, patch]
  );

  const onDelete = async () => {
    const target = deleteTarget;
    if (!target || deleting) return;
    // 아직 저장 안 한 줄은 그냥 지운다
    if (target.id == null) {
      setRows((rs) => rs.filter((r) => r.key !== target.key));
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await bossEstimateApi.remove(target.id);
      if (res.success !== false) {
        setRows((rs) => rs.filter((r) => r.key !== target.key));
        setDeleteTarget(null);
        toast.success('품목을 삭제했습니다.');
      } else {
        toast.error(res.message || res.error || '삭제하지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제하지 못했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const atLimit = savedCount >= MAX_ITEMS;
  const dirtyCount = rows.filter((r) => r.dirty && hasContent(r)).length;

  const addRow = () => {
    if (atLimit) {
      toast.error(`품목은 최대 ${MAX_ITEMS}개까지 넣을 수 있습니다.`);
      return;
    }
    setRows((rs) => [...rs, emptyRow()]);
    // 새 줄의 품목명으로 커서를 옮긴다
    window.setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-item-name]');
      inputs[inputs.length - 1]?.focus();
    }, 0);
  };

  /** 줄 안에서 칸을 옮길 때는 저장하지 않는다 — 줄 밖으로 나갈 때만 */
  const handleRowBlur = (key: string) => (e: React.FocusEvent<HTMLTableRowElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    void commit(key);
  };

  const handleKeyDown = (key: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void commit(key);
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <ContentCard>
      <CardHead
        title="견적 품목"
        meta="견적서 · 영수증은 이 품목으로 만들어집니다"
        count={loading ? undefined : `${totals.count}건`}
        countTone="muted"
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-boss-border px-5 py-3">
        <p className="text-[12px] text-boss-text-secondary">
          칸에 바로 적으면 됩니다. 줄을 벗어나거나 <b className="text-boss-text">Enter</b> 를 누르면 저장됩니다. 단가는
          VAT 포함이 기본이고, 비과세 · ±과세를 고르면 계산이 달라집니다.
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          {dirtyCount > 0 && (
            <span className="font-boss-head text-[12px] text-boss-text-muted">저장 안 된 줄 {dirtyCount}</span>
          )}
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => load()} disabled={loading}>
            새로고침
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={addRow} disabled={atLimit}>
            줄 추가
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

      {loading && rows.length === 0 ? (
        <RowSkeleton rows={4} />
      ) : (
        <>
          <div className="boss-scroll overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-boss-border bg-boss-inset text-left text-[12px] text-boss-text-secondary">
                  <th className="w-8 px-2 py-2 text-center font-medium">#</th>
                  <th className="px-2 py-2 font-medium">품목명</th>
                  <th className="w-[110px] px-2 py-2 font-medium">규격</th>
                  <th className="w-[70px] px-2 py-2 font-medium">단위</th>
                  <th className="w-[80px] px-2 py-2 text-right font-medium">수량</th>
                  <th className="w-[110px] px-2 py-2 text-right font-medium">단가</th>
                  <th className="w-[104px] px-2 py-2 font-medium">과세</th>
                  <th className="w-[110px] px-2 py-2 text-right font-medium">합계</th>
                  <th className="w-[64px] px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const amounts = calcAmounts(toNumber(r.quantity), toNumber(r.unitPrice), r.taxMode);
                  const blank = r.id == null && !hasContent(r);
                  return (
                    <tr
                      key={r.key}
                      onBlur={handleRowBlur(r.key)}
                      onKeyDown={handleKeyDown(r.key)}
                      className={`border-b border-boss-border-row last:border-b-0 ${
                        r.error ? 'bg-boss-pill-bad/10' : ''
                      }`}
                    >
                      <td className="px-2 py-1 text-center font-boss-head text-[12px] tabular-nums text-boss-text-muted">
                        {blank ? '+' : i + 1}
                      </td>
                      <td className="px-1 py-1">
                        <CellInput
                          data-item-name=""
                          value={r.itemName}
                          onChange={(v) => edit(r.key, { itemName: v })}
                          placeholder={blank ? '여기에 품목을 적으세요' : '실크 도배'}
                          maxLength={200}
                          aria-label={`${i + 1}번 품목명`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <CellInput
                          value={r.itemSpec}
                          onChange={(v) => edit(r.key, { itemSpec: v })}
                          placeholder="광폭"
                          maxLength={50}
                          aria-label={`${i + 1}번 규격`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <CellInput
                          value={r.unit}
                          onChange={(v) => edit(r.key, { unit: v })}
                          placeholder="롤"
                          maxLength={20}
                          aria-label={`${i + 1}번 단위`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <CellInput
                          value={r.quantity}
                          onChange={(v) => edit(r.key, { quantity: v.replace(/[^0-9]/g, '') })}
                          align="right"
                          inputMode="numeric"
                          maxLength={6}
                          aria-label={`${i + 1}번 수량`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <CellInput
                          value={comma(r.unitPrice)}
                          onChange={(v) => edit(r.key, { unitPrice: v.replace(/[^0-9]/g, '') })}
                          align="right"
                          inputMode="numeric"
                          maxLength={12}
                          placeholder="0"
                          aria-label={`${i + 1}번 단가`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <select
                          className="h-8 w-full border border-transparent bg-transparent px-1 text-[12.5px] text-boss-text hover:border-boss-border focus:border-boss-primary focus:outline-none"
                          value={r.taxMode}
                          onChange={(e) => edit(r.key, { taxMode: e.target.value as TaxMode })}
                          aria-label={`${i + 1}번 과세 방식`}
                        >
                          {(Object.keys(TAX_MODE_LABEL) as TaxMode[]).map((m) => (
                            <option key={m} value={m}>
                              {TAX_MODE_LABEL[m]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1 text-right font-boss-head text-[13px] font-semibold tabular-nums text-boss-text">
                        {hasContent(r) ? won(amounts.totalAmount) : '-'}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-end gap-1">
                          <RowStatus row={r} onRetry={() => void commit(r.key)} />
                          {!blank && (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center !text-boss-text-muted hover:bg-boss-elevated hover:!text-boss-error"
                              title="이 줄 삭제"
                              aria-label={`${i + 1}번 줄 삭제`}
                              onClick={() => setDeleteTarget(r)}
                            >
                              <Trash2 size={13} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 줄에 뜬 오류는 표 아래에 한 번 더 모아 준다 — 표를 옆으로 밀어 놨을 때도 보이게 */}
          {rows.some((r) => r.error) && (
            <div className="border-t border-boss-border px-5 py-2">
              {rows.map((r, i) =>
                r.error ? (
                  <p key={r.key} className="text-[12.5px] text-boss-error">
                    {i + 1}번 줄 · {r.error}
                  </p>
                ) : null
              )}
            </div>
          )}

          {totals.count === 0 && !loading ? (
            <EmptyState
              title="아직 품목이 없습니다"
              description="맨 윗줄 품목명 칸에 바로 적어 보세요. 줄을 벗어나면 저장되고 다음 줄이 생깁니다."
            />
          ) : (
            <>
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
                  <p className="font-boss-head text-[15px] tabular-nums text-boss-text">{won(totals.supply)}</p>
                </div>
                <div>
                  <p className="boss-mono-label">부가세</p>
                  <p className="font-boss-head text-[15px] tabular-nums text-boss-text">{won(totals.vat)}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="boss-mono-label">합계 금액</p>
                  <p className="font-boss-head text-[26px] font-semibold leading-none tabular-nums text-boss-text">
                    {won(totals.total)}
                  </p>
                  <p className="mt-1 text-[11.5px] text-boss-text-secondary">{toKoreanAmountLabel(totals.total)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-boss-border px-5 py-3">
                <ButtonLink href={`/boss/estimate/${customerId}/print`} variant="primary" size="sm">
                  견적서 인쇄 · PDF
                </ButtonLink>
                <ButtonLink href={`/boss/estimate/${customerId}/receipt`} variant="secondary" size="sm">
                  영수증 인쇄 · PDF
                </ButtonLink>
                {dirtyCount > 0 && (
                  <span className="text-[12px] text-boss-text-secondary">
                    저장 안 된 줄이 있습니다. 그 줄에서 Enter 를 누르거나 다른 곳을 누르면 저장됩니다.
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 품목을 삭제할까요?"
        description={`'${deleteTarget?.itemName || '적다 만 줄'}' 을(를) 견적에서 뺍니다. 인쇄물 금액도 함께 줄어듭니다.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void onDelete()}
      />
    </ContentCard>
  );
}

/** 표 안의 입력 칸 — 평소에는 테두리가 없다가 손이 닿으면 드러난다 */
function CellInput({
  value,
  onChange,
  align = 'left',
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  align?: 'left' | 'right';
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // 숫자 칸은 손이 닿으면 통째로 잡아 준다 — 고칠 때 지우고 다시 치지 않게
      onFocus={align === 'right' ? (e) => e.currentTarget.select() : undefined}
      className={`h-8 w-full border border-transparent bg-transparent px-1.5 text-[13px] text-boss-text placeholder:text-boss-text-ghost hover:border-boss-border focus:border-boss-primary focus:bg-white focus:outline-none ${
        align === 'right' ? 'text-right font-boss-head tabular-nums' : ''
      }`}
    />
  );
}

/** 줄 상태 — 저장 중 · 방금 저장됨 · 실패(누르면 다시 시도) */
function RowStatus({ row, onRetry }: { row: RowState; onRetry: () => void }) {
  if (row.saving) {
    return <Loader2 size={13} className="animate-spin text-boss-text-muted" aria-label="저장 중" />;
  }
  if (row.error) {
    return (
      <button
        type="button"
        onClick={onRetry}
        title={`${row.error} 다시 시도`}
        aria-label="다시 저장"
        className="inline-flex h-7 w-7 items-center justify-center !text-boss-error hover:bg-boss-elevated"
      >
        <AlertCircle size={13} strokeWidth={2} />
      </button>
    );
  }
  if (row.justSaved) {
    return <Check size={13} className="text-boss-primary" aria-label="저장됨" />;
  }
  if (row.dirty && hasContent(row)) {
    return <span className="h-1.5 w-1.5 rounded-full bg-boss-text-muted" aria-label="저장 안 됨" />;
  }
  return null;
}
