'use client';

// 세금계산서 · 현금영수증 등록/수정 — Industry 패턴 (참조 04 의 폼 조판)
//
// 좌: 유형 · 고객 → 공급받는자 사업자 정보 → 품목 · 금액 → 작성일자 · 영수/청구 · 메모
// 우: 필수 누락 체크 · 발행 절차 안내
// 하단: 취소 / 저장
//
// 고객을 고르면 그 고객의 견적 품목을 읽어 공급가액 · 세액을 자동으로 채운다(비과세 품목은 세액 0).
// 같은 고객에게 전에 발행한 적이 있으면 사업자 정보를 그대로 가져온다(프리필).
// ?id= 가 있으면 수정, ?customerId= 가 있으면 그 고객으로 시작한다.

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { formatBizNo, isValidBizNo, maskBizNo } from '@/lib/boss/bizno';
import { toKoreanAmountLabel } from '@/lib/boss/koreanAmount';
import type { BossCustomerData } from '@/types/boss-customer';
import type { BossEstimateItem } from '@/types/boss-estimate';
import type {
  TaxInvoiceDocType,
  TaxInvoiceItem,
  TaxInvoicePayType,
  TaxInvoiceSaveRequest,
} from '@/types/boss-taxinvoice';
import {
  AlertBanner,
  Button,
  ButtonLink,
  CheckLine,
  Field,
  FieldLabel,
  MetricBox,
  Panel,
  Segmented,
  Skeleton,
  TextareaField,
} from '@/components/boss/ui';
import { useSubmitHotkey } from '@/components/boss/layout/BossSearchContext';

type Row = TaxInvoiceItem & { key: string; taxFree: boolean };

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');
const todayIso = () => new Date().toISOString().slice(0, 10);
let rowSeq = 0;
const newRow = (init?: Partial<Row>): Row => ({
  key: `r${++rowSeq}`,
  name: '',
  spec: '',
  qty: 1,
  unitPrice: 0,
  supplyAmount: 0,
  vatAmount: 0,
  date: todayIso(),
  taxFree: false,
  ...init,
});

/** 견적 품목 → 서식 행. 견적의 공급가액 · 세액이 있으면 그대로, 없으면 단가×수량으로 계산 */
function fromEstimateItem(it: BossEstimateItem): Row {
  const qty = it.quantity ?? 1;
  const unitPrice = it.unitPrice ?? 0;
  const supply = it.supplyAmount ?? qty * unitPrice;
  const taxFree = it.isTaxFree === 'Y';
  const vat = taxFree ? 0 : (it.vatAmount ?? Math.round(supply * 0.1));
  return newRow({
    name: it.itemName ?? '',
    spec: it.itemSpec ?? '',
    qty,
    unitPrice,
    supplyAmount: supply,
    vatAmount: vat,
    date: (it.createdDt ?? '').slice(0, 10) || todayIso(),
    taxFree,
  });
}

function recalc(row: Row): Row {
  const supply = Math.round((row.qty ?? 0) * (row.unitPrice ?? 0));
  return { ...row, supplyAmount: supply, vatAmount: row.taxFree ? 0 : Math.round(supply * 0.1) };
}

export default function BossTaxInvoiceNewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <TaxInvoiceForm />
    </Suspense>
  );
}

function TaxInvoiceForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const presetCustomerId = params.get('customerId');

  const [customers, setCustomers] = useState<BossCustomerData[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [docType, setDocType] = useState<TaxInvoiceDocType>('TAX');
  const [payType, setPayType] = useState<TaxInvoicePayType>('CLAIM');
  const [customerId, setCustomerId] = useState<string>(presetCustomerId ?? '');
  const [estimateId, setEstimateId] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState(todayIso());
  const [buyerName, setBuyerName] = useState('');
  const [buyerBizNo, setBuyerBizNo] = useState('');
  const [buyerCeo, setBuyerCeo] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerBizType, setBuyerBizType] = useState('');
  const [buyerBizKind, setBuyerBizKind] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [memo, setMemo] = useState('');
  const [itemsLoaded, setItemsLoaded] = useState<string | null>(null);

  // 고객 목록
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await bossCustomersApi.list();
        if (alive && res.success !== false && res.data) setCustomers(res.data);
      } catch {
        // 고객을 못 읽어도 직접 입력으로 등록할 수 있다
      } finally {
        if (alive) setCustomersLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 수정 모드 — 기존 건 읽기
  useEffect(() => {
    if (!editId) return;
    let alive = true;
    (async () => {
      try {
        const res = await bossTaxInvoiceApi.get(editId);
        if (!alive) return;
        if (res.success !== false && res.data) {
          const d = res.data;
          setDocType(d.docType);
          setPayType(d.payType);
          setCustomerId(d.customerId ? String(d.customerId) : '');
          setEstimateId(d.estimateId ?? null);
          setIssueDate(d.issueDate ?? todayIso());
          setBuyerName(d.buyerName ?? '');
          setBuyerBizNo(d.buyerBizNo ?? '');
          setBuyerCeo(d.buyerCeo ?? '');
          setBuyerAddress(d.buyerAddress ?? '');
          setBuyerBizType(d.buyerBizType ?? '');
          setBuyerBizKind(d.buyerBizKind ?? '');
          setBuyerEmail(d.buyerEmail ?? '');
          setBuyerPhone(d.buyerPhone ?? '');
          setMemo(d.memo ?? '');
          setRows(
            d.items.length > 0
              ? d.items.map((it) =>
                  newRow({ ...it, taxFree: (it.vatAmount ?? 0) === 0 && (it.supplyAmount ?? 0) > 0 })
                )
              : [newRow({ supplyAmount: d.supplyAmount, vatAmount: d.vatAmount, name: d.itemSummary ?? '' })]
          );
          setItemsLoaded(d.customerId ? String(d.customerId) : null);
        } else {
          setError(res.message || res.error || '세금계산서를 불러오지 못했습니다.');
        }
      } catch {
        if (alive) setError('네트워크 오류로 세금계산서를 불러오지 못했습니다.');
      } finally {
        if (alive) setLoadingEdit(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [editId]);

  // 고객 기본 정보(이름 · 전화 · 주소) — 고객 목록이 품목보다 늦게 도착해도 채워지도록 따로 둔다.
  // 이미 값이 있으면(프리필 · 수정 모드 · 직접 입력) 덮어쓰지 않는다.
  useEffect(() => {
    if (!customerId) return;
    const customer = customers.find((c) => String(c.id) === customerId);
    if (!customer) return;
    setBuyerName((v) => v || customer.name || '');
    setBuyerPhone((v) => v || customer.phone || '');
    setBuyerAddress((v) => v || [customer.address1, customer.address2].filter(Boolean).join(' '));
  }, [customerId, customers]);

  // 고객 선택 → 견적 품목 · 프리필. 수정 모드에서 이미 읽은 고객이면 건너뛴다.
  useEffect(() => {
    if (!customerId || itemsLoaded === customerId) return;
    let alive = true;
    (async () => {
      try {
        const [itemsRes, prefillRes] = await Promise.all([
          bossEstimateApi.list(customerId),
          bossTaxInvoiceApi.prefill(customerId),
        ]);
        if (!alive) return;
        if (itemsRes.success !== false && Array.isArray(itemsRes.data) && itemsRes.data.length > 0) {
          setRows(itemsRes.data.map(fromEstimateItem));
          setEstimateId(itemsRes.data[0].estimateId ?? null);
          toast.success(`견적 품목 ${itemsRes.data.length}건을 불러왔습니다.`);
        }
        const p = prefillRes.success !== false ? prefillRes.data : null;
        if (p) {
          setBuyerName((v) => p.buyerName || v);
          setBuyerBizNo((v) => p.buyerBizNo || v);
          setBuyerCeo((v) => p.buyerCeo || v);
          setBuyerAddress((v) => p.buyerAddress || v);
          setBuyerBizType((v) => p.buyerBizType || v);
          setBuyerBizKind((v) => p.buyerBizKind || v);
          setBuyerEmail((v) => p.buyerEmail || v);
          setBuyerPhone((v) => p.buyerPhone || v);
        }
      } catch {
        // 품목 · 프리필 실패는 직접 입력으로 이어간다
      } finally {
        if (alive) setItemsLoaded(customerId);
      }
    })();
    return () => {
      alive = false;
    };
  }, [customerId, itemsLoaded]);

  const totals = useMemo(() => {
    const supply = rows.reduce((a, r) => a + (r.supplyAmount ?? 0), 0);
    const vat = rows.reduce((a, r) => a + (r.vatAmount ?? 0), 0);
    return { supply, vat, total: supply + vat };
  }, [rows]);

  const bizNoOk = docType === 'CASH' ? true : isValidBizNo(buyerBizNo);
  const missing = useMemo(() => {
    const list: string[] = [];
    if (!buyerName.trim()) list.push(docType === 'TAX' ? '상호(법인명)' : '고객명');
    if (docType === 'TAX' && !buyerBizNo.trim()) list.push('사업자등록번호');
    if (docType === 'TAX' && buyerBizNo.trim() && !bizNoOk) list.push('사업자등록번호 형식(체크섬 불일치)');
    if (docType === 'CASH' && !buyerPhone.trim() && !buyerBizNo.trim()) list.push('휴대폰번호 또는 사업자번호');
    if (totals.total <= 0) list.push('금액(품목)');
    if (!issueDate) list.push('작성일자');
    return list;
  }, [buyerName, buyerBizNo, buyerPhone, docType, bizNoOk, totals.total, issueDate]);

  const canSave = missing.length === 0 && !saving && !loadingEdit;

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? recalc({ ...r, ...patch }) : r)));

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const body: TaxInvoiceSaveRequest = {
      id: editId ? Number(editId) : undefined,
      customerId: customerId ? Number(customerId) : null,
      estimateId,
      docType,
      payType,
      issueDate,
      buyerName: buyerName.trim(),
      buyerBizNo: buyerBizNo ? formatBizNo(buyerBizNo) : null,
      buyerCeo: buyerCeo.trim() || null,
      buyerAddress: buyerAddress.trim() || null,
      buyerBizType: buyerBizType.trim() || null,
      buyerBizKind: buyerBizKind.trim() || null,
      buyerEmail: buyerEmail.trim() || null,
      buyerPhone: buyerPhone.trim() || null,
      supplyAmount: totals.supply,
      vatAmount: totals.vat,
      totalAmount: totals.total,
      items: rows
        .filter((r) => (r.name ?? '').trim() || (r.supplyAmount ?? 0) > 0)
        .map(({ key: _k, taxFree: _t, ...rest }) => rest),
      memo: memo.trim() || null,
    };
    try {
      const res = await bossTaxInvoiceApi.save(body);
      if (res.success !== false && res.data?.id) {
        toast.success(editId ? '수정했습니다.' : '등록했습니다. 홈택스에서 발행한 뒤 승인번호를 남겨 주세요.');
        router.replace(`/boss/tax-invoice/${res.data.id}`);
      } else {
        setError(res.message || res.error || '저장하지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }, [
    canSave, editId, customerId, estimateId, docType, payType, issueDate, buyerName, buyerBizNo, buyerCeo,
    buyerAddress, buyerBizType, buyerBizKind, buyerEmail, buyerPhone, totals, rows, memo, router,
  ]);

  useSubmitHotkey(handleSave, canSave);

  if (loadingEdit) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="grid max-w-[1180px] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}

        {/* ── 1. 유형 · 고객 ── */}
        <Panel kicker="01" title="유형 · 고객">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>문서 유형</FieldLabel>
              <Segmented
                ariaLabel="문서 유형"
                value={docType}
                onChange={setDocType}
                options={[
                  { key: 'TAX', label: '세금계산서' },
                  { key: 'CASH', label: '현금영수증' },
                ]}
              />
              <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
                사업자 고객(인테리어 · 건설 · 상가)은 세금계산서, 개인 고객은 현금영수증입니다.
              </p>
            </div>
            <div>
              <FieldLabel htmlFor="customerId">고객</FieldLabel>
              <select
                id="customerId"
                className="boss-input"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setItemsLoaded(null);
                }}
                disabled={customersLoading}
              >
                <option value="">직접 입력 (고객 연결 없음)</option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ''}
                    {c.address1 ? ` · ${c.address1}` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
                고르면 그 고객의 견적 품목과 이전에 받아 둔 사업자 정보를 채웁니다.
              </p>
            </div>
          </div>
        </Panel>

        {/* ── 2. 공급받는자 ── */}
        <Panel kicker="02" title={docType === 'TAX' ? '공급받는자 (사업자 정보)' : '고객 정보'}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="buyerName"
              label={docType === 'TAX' ? '상호(법인명)' : '고객명'}
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder={docType === 'TAX' ? '(주)OO인테리어' : '홍길동'}
            />
            <div>
              <Field
                id="buyerBizNo"
                label="사업자등록번호"
                required={docType === 'TAX'}
                value={buyerBizNo}
                onChange={(e) => setBuyerBizNo(maskBizNo(e.target.value))}
                inputMode="numeric"
                placeholder="000-00-00000"
                hint={
                  buyerBizNo.trim() ? (
                    bizNoOk ? (
                      <span className="text-boss-success">확인된 형식입니다.</span>
                    ) : (
                      <span className="text-boss-error">
                        검증번호가 맞지 않습니다. 사업자등록증의 번호를 다시 확인하세요.
                      </span>
                    )
                  ) : docType === 'CASH' ? (
                    '지출증빙용 현금영수증이면 사업자번호를 적습니다.'
                  ) : (
                    '고객 사업자등록증의 10자리 번호'
                  )
                }
              />
            </div>
            {docType === 'TAX' ? (
              <>
                <Field
                  id="buyerCeo"
                  label="대표자"
                  value={buyerCeo}
                  onChange={(e) => setBuyerCeo(e.target.value)}
                />
                <Field
                  id="buyerEmail"
                  label="전자세금계산서 수신 이메일"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="tax@example.com"
                  hint="홈택스 발행 시 이 주소로 계산서가 전송됩니다."
                />
                <Field
                  id="buyerAddress"
                  label="사업장 주소"
                  className="md:col-span-2"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                />
                <Field
                  id="buyerBizType"
                  label="업태"
                  value={buyerBizType}
                  onChange={(e) => setBuyerBizType(e.target.value)}
                  placeholder="건설업"
                />
                <Field
                  id="buyerBizKind"
                  label="종목"
                  value={buyerBizKind}
                  onChange={(e) => setBuyerBizKind(e.target.value)}
                  placeholder="실내건축공사"
                />
              </>
            ) : (
              <Field
                id="buyerPhone"
                label="현금영수증 휴대폰번호"
                required={!buyerBizNo.trim()}
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                inputMode="tel"
                placeholder="010-0000-0000"
                hint="소득공제용은 휴대폰번호, 지출증빙용은 사업자번호로 발급합니다."
              />
            )}
          </div>
        </Panel>

        {/* ── 3. 품목 · 금액 ── */}
        <Panel
          kicker="03"
          title="품목 · 금액"
          right={
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => setRows((rs) => [...rs, newRow()])}>
              행 추가
            </Button>
          }
        >
          <div className="boss-scroll overflow-x-auto">
            <table className="boss-table">
              <thead>
                <tr>
                  <th>품목</th>
                  <th>규격</th>
                  <th className="num">수량</th>
                  <th className="num">단가</th>
                  <th className="num">공급가액</th>
                  <th className="num">세액</th>
                  <th>면세</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td className="min-w-[160px]">
                      <input
                        className="boss-input"
                        value={r.name ?? ''}
                        onChange={(e) => updateRow(r.key, { name: e.target.value })}
                        placeholder="도배 시공"
                        aria-label="품목"
                      />
                    </td>
                    <td className="min-w-[120px]">
                      <input
                        className="boss-input"
                        value={r.spec ?? ''}
                        onChange={(e) => updateRow(r.key, { spec: e.target.value })}
                        placeholder="84㎡ 실크"
                        aria-label="규격"
                      />
                    </td>
                    <td className="w-[90px]">
                      <input
                        className="boss-input text-right"
                        type="number"
                        min={0}
                        value={r.qty ?? 0}
                        onChange={(e) => updateRow(r.key, { qty: Number(e.target.value) })}
                        aria-label="수량"
                      />
                    </td>
                    <td className="w-[140px]">
                      <input
                        className="boss-input text-right"
                        type="number"
                        min={0}
                        step={1000}
                        value={r.unitPrice ?? 0}
                        onChange={(e) => updateRow(r.key, { unitPrice: Number(e.target.value) })}
                        aria-label="단가"
                      />
                    </td>
                    <td className="num text-boss-text">{fmt(r.supplyAmount)}</td>
                    <td className="num text-boss-text-secondary">{fmt(r.vatAmount)}</td>
                    <td>
                      <CheckLine checked={r.taxFree} onChange={(v) => updateRow(r.key, { taxFree: v })}>
                        <span className="sr-only">면세</span>
                      </CheckLine>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="boss-btn boss-btn-sm boss-btn-ghost !text-boss-text-muted hover:!text-boss-error"
                        onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
                        aria-label="행 삭제"
                        disabled={rows.length <= 1}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MetricBox label="공급가액" value={`${fmt(totals.supply)}원`} />
            <MetricBox label="세액 (10%)" value={`${fmt(totals.vat)}원`} />
            <MetricBox label="합계" value={`${fmt(totals.total)}원`} />
          </div>
          <p className="mt-2 font-boss-head text-[13px] text-boss-text-secondary">{toKoreanAmountLabel(totals.total)}</p>
        </Panel>

        {/* ── 4. 작성일자 · 영수/청구 · 메모 ── */}
        <Panel kicker="04" title="작성일자 · 구분">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="issueDate"
              label="작성일자"
              required
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              hint="세금계산서는 공급 시기(시공 완료일)가 속한 달 안에 작성해야 가산세가 없습니다."
            />
            <div>
              <FieldLabel>영수 / 청구</FieldLabel>
              <Segmented
                ariaLabel="영수 청구 구분"
                value={payType}
                onChange={setPayType}
                options={[
                  { key: 'CLAIM', label: '청구 (아직 안 받음)' },
                  { key: 'RECEIPT', label: '영수 (받았음)' },
                ]}
              />
            </div>
            <TextareaField
              id="memo"
              label="메모"
              className="md:col-span-2"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="현장명 · 담당자 · 요청 경위 등"
              rows={3}
            />
          </div>
        </Panel>

        {/* ── 하단 액션 ── */}
        <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-[12.5px] text-boss-text-secondary">
            {missing.length > 0 ? `필수 ${missing.length}항목 남음` : '저장하면 발행 요청 상태로 등록됩니다.'}{' '}
            <kbd className="ml-1 border border-boss-border px-1 font-boss-head text-[11px]">⌘↵</kbd>
          </span>
          <div className="flex gap-2">
            <ButtonLink href={editId ? `/boss/tax-invoice/${editId}` : '/boss/tax-invoice'} variant="secondary">
              취소
            </ButtonLink>
            <Button variant="primary" onClick={() => void handleSave()} disabled={!canSave}>
              {saving ? '저장 중…' : editId ? '수정 저장' : '등록'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 우측 안내 ── */}
      <div className="flex flex-col gap-4">
        <Panel kicker="필수 누락" title={missing.length === 0 ? '문제 없음' : `${missing.length}항목`}>
          {missing.length === 0 ? (
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              저장 후 상세 화면의 홈택스 입력 도우미로 발행하면 됩니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 text-[13px] text-boss-error">
              {missing.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel kicker="절차" title="발행은 3단계">
          <ol className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
            <li>
              <span className="font-semibold text-boss-text">1. 여기 등록</span> — 고객 사업자번호 · 금액을 정리해 둡니다.
            </li>
            <li>
              <span className="font-semibold text-boss-text">2. 홈택스 발행</span> — 상세 화면의 입력 도우미에서 항목별
              복사해 붙여 넣습니다.
            </li>
            <li>
              <span className="font-semibold text-boss-text">3. 승인번호 기록</span> — 발행 완료 처리하면 분기 부가세
              예상에 반영됩니다.
            </li>
          </ol>
        </Panel>
        <Panel kicker="참고" title="세액 계산">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            세액은 공급가액의 10% 로 자동 계산됩니다. 면세 품목(예: 미가공 자재 일부)은 행의 면세를 켜면 세액이 0 이
            됩니다. 합계는 서버가 공급가액 + 세액으로 다시 계산해 저장합니다.
          </p>
        </Panel>
      </div>
    </div>
  );
}
