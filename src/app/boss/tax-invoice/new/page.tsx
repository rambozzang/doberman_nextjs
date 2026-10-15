'use client';

// 세금계산서 · 현금영수증 작성/수정 — Industry 패턴
//
// 좌: 01 문서 종류 · 고객 → 02 공급받는자(세금계산서) / 현금영수증 정보(용도 · 식별번호) → 03 품목 · 금액 → 04 작성일자 · 대금 · 메모
// 우: 확인할 것(누르면 그 칸으로) · 진행 순서 · 계산 규칙
// 하단: 취소 / 저장 / 저장 후 미리보기
//
// 저장은 "작성 완료(미발급)"일 뿐 발급이 아니다. 발급은 상세 화면에서 따로 한다.
// 입력 검증은 저장을 누를 때 한 번에 보여 주고 첫 오류 칸으로 옮긴다. 서버가 거절해도 입력은 그대로 둔다.
// 새 문서는 작성 중인 내용을 이 탭(sessionStorage)에 보관해 화면을 오가거나 새로고침해도 이어 쓴다.
//
// ?id= 수정, ?customerId= 그 고객으로 시작, ?docType=CASH 현금영수증으로 시작.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { bossEstimateApi } from '@/lib/api/boss/estimate';
import { formatBizNo, isValidBizNo, maskBizNo } from '@/lib/boss/bizno';
import { toKoreanAmountLabel } from '@/lib/boss/koreanAmount';
import { kstToday } from '@/lib/boss/taxInvoiceDocument';
import {
  CASH_IDENTITY_TYPES_BY_USAGE,
  cashFieldsOf,
  cashIdentityError,
  cashVatOf,
  isValidVat,
  splitVatInclusive,
  formatCashIdentity,
  guessCashTaxation,
  identityTypeForUsage,
  maskCashIdentityInput,
  normalizeCashIdentity,
} from '@/lib/boss/taxInvoiceCash';
import type { BossCustomerData } from '@/types/boss-customer';
import type { BossEstimateItem } from '@/types/boss-estimate';
import {
  CASH_IDENTITY_LABEL,
  CASH_MAX_TOTAL,
  CASH_SELF_ISSUE_NUMBER,
  CASH_TAXATION_LABEL,
  isProviderManaged,
  type CashIdentityType,
  type CashTaxationType,
  type CashUsage,
  type TaxInvoiceDocType,
  type TaxInvoiceItem,
  type TaxInvoicePayType,
  type TaxInvoiceSaveRequest,
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
  RadioOption,
  Segmented,
  Skeleton,
  TextareaField,
} from '@/components/boss/ui';
import { useSubmitHotkey } from '@/components/boss/layout/BossSearchContext';

type Row = TaxInvoiceItem & { key: string; taxFree: boolean };

/** 서버 검증과 같은 길이 */
const MEMO_MAX = 500;
/** 서버 qty 는 정수(Int) */
const QTY_MAX = 2_147_483_647;
const DRAFT_KEY = 'boss:tax-invoice:draft';
/** 현금영수증 고객명 — 선택 입력, 적으면 70자까지(팝빌 customerName · 서버 검증과 같다) */
const CASH_NAME_MAX = 70;

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');
// 새 문서 기본 날짜는 서버와 같은 한국시간 오늘
const todayIso = () => kstToday();
let rowSeq = 0;
const newRow = (init?: Partial<Row>): Row => ({
  name: '',
  spec: '',
  qty: 1,
  unitPrice: 0,
  supplyAmount: 0,
  vatAmount: 0,
  date: todayIso(),
  taxFree: false,
  ...init,
  key: `r${++rowSeq}`,
});

// 10% 원 단위 반올림 — 0.1 곱셈은 이진 소수 오차가 있어 10으로 나눈다(정수 공급가액의 .5 는 정확히 올림)
const vatOf = (supply: number, taxFree: boolean) => (taxFree ? 0 : Math.round(supply / 10));

/**
 * 견적 품목 → 서식 행. 견적의 공급가액 · 세액이 있으면 그대로, 없으면 단가×수량으로 계산.
 * 부가세 포함 견적(수량×단가 = 공급가액+세액)은 합계를 지키며 공급가액 · 세액을 다시 나누고
 * 단가를 공급가 기준으로 바꾼다(2026-10-16) — 예전엔 "1 × 50,000 = 45,454" 로 찍히고 발급이 막혔다.
 */
function fromEstimateItem(it: BossEstimateItem): Row {
  const qty = it.quantity ?? 1;
  let unitPrice = it.unitPrice ?? 0;
  let supply = it.supplyAmount ?? qty * unitPrice;
  const taxFree = it.isTaxFree === 'Y';
  let vat = taxFree ? 0 : (it.vatAmount ?? Math.round(supply / 10));
  const vatInclusive =
    !taxFree && it.supplyAmount != null && it.vatAmount != null && it.vatAmount > 0 && qty * unitPrice === it.supplyAmount + it.vatAmount;
  if (vatInclusive) {
    ({ supply, vat } = splitVatInclusive(qty * unitPrice));
    unitPrice = qty > 0 ? Math.round(supply / qty) : 0;
  }
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

const rowHasContent = (r: Row) => Boolean((r.name ?? '').trim() || (r.spec ?? '').trim() || (r.supplyAmount ?? 0) > 0);

type FieldKey = 'buyerName' | 'buyerBizNo' | 'buyerEmail' | 'cashIdentityNum' | 'legacyConfirm' | 'items' | 'issueDate' | 'memo';
type Problem = { field: FieldKey; message: string; /** 포커스를 옮길 요소 id */ target: string };

/** 작성 중 보관본 — 새 문서만 */
type Draft = {
  docType: TaxInvoiceDocType;
  payType: TaxInvoicePayType;
  payTypeTouched: boolean;
  customerId: string;
  estimateId: number | null;
  issueDate: string;
  buyerName: string;
  buyerBizNo: string;
  buyerCeo: string;
  buyerAddress: string;
  buyerBizType: string;
  buyerBizKind: string;
  buyerEmail: string;
  buyerPhone: string;
  cashUsage: CashUsage;
  cashIdentityType: CashIdentityType;
  cashIdentityNum: string;
  cashTaxation: CashTaxationType;
  rows: Row[];
  memo: string;
};

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && Array.isArray(d.rows) && (d.docType === 'TAX' || d.docType === 'CASH') ? d : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // 저장소를 못 쓰면 보관본도 없다
  }
}

/** 서버 오류 문구로 칸을 짐작한다 — 모르면 null(위 알림으로만) */
function fieldFromServerMessage(msg: string, docType: TaxInvoiceDocType): FieldKey | null {
  if (/식별|휴대폰|자진발급/.test(msg)) return docType === 'CASH' ? 'cashIdentityNum' : null;
  if (/사업자/.test(msg)) return docType === 'CASH' ? 'cashIdentityNum' : 'buyerBizNo';
  if (/상호|고객명/.test(msg)) return 'buyerName';
  if (/이메일/.test(msg)) return 'buyerEmail';
  if (/금액|합계|공급가액|세액|품목|과세|면세/.test(msg)) return 'items';
  if (/작성일|거래일/.test(msg)) return 'issueDate';
  if (/메모/.test(msg)) return 'memo';
  return null;
}

const FIELD_TARGET: Record<Exclude<FieldKey, 'items'>, string> = {
  buyerName: 'buyerName',
  buyerBizNo: 'buyerBizNo',
  buyerEmail: 'buyerEmail',
  cashIdentityNum: 'cashIdentityNum',
  legacyConfirm: 'legacyConfirm',
  issueDate: 'issueDate',
  memo: 'memo',
};

function focusTarget(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (el as HTMLElement).focus({ preventScroll: true });
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
  const presetDocType: TaxInvoiceDocType = params.get('docType') === 'CASH' ? 'CASH' : 'TAX';

  const [customers, setCustomers] = useState<BossCustomerData[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<null | 'detail' | 'preview'>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [serverFieldError, setServerFieldError] = useState<{ field: FieldKey; message: string } | null>(null);

  const [docType, setDocType] = useState<TaxInvoiceDocType>(presetDocType);
  const [payType, setPayType] = useState<TaxInvoicePayType>(presetDocType === 'CASH' ? 'RECEIPT' : 'CLAIM');
  const [payTypeTouched, setPayTypeTouched] = useState(false);
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
  const [cashUsage, setCashUsage] = useState<CashUsage>('DEDUCTION');
  const [cashIdentityType, setCashIdentityType] = useState<CashIdentityType>('PHONE');
  const [cashIdentityNum, setCashIdentityNum] = useState('');
  // 현금영수증 과세 구분 — 문서 전체에 적용. 새 문서는 과세
  const [cashTaxation, setCashTaxation] = useState<CashTaxationType>('TAXABLE');
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  const [memo, setMemo] = useState('');
  const [itemsLoaded, setItemsLoaded] = useState<string | null>(null);
  // 이미 적은 품목이 있으면 견적 품목으로 바로 덮지 않고 묻는다
  const [pendingEstimate, setPendingEstimate] = useState<{ rows: Row[]; estimateId: number | null } | null>(null);
  // 전자 발급한 문서는 고칠 수 없다 — 서버도 막지만 화면에서 먼저 닫는다
  const [providerLocked, setProviderLocked] = useState(false);
  // 예전 현금영수증 기록 — 용도 · 식별번호를 추정해 채웠다
  const [legacyInferred, setLegacyInferred] = useState(false);
  const [legacyConfirmed, setLegacyConfirmed] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftReady, setDraftReady] = useState(Boolean(editId));

  const inFlight = useRef(false);
  const mounted = useRef(true);
  // 늦게 온 견적 품목이 이미 적은 품목을 덮지 않았는지 볼 때 쓴다
  const rowsRef = useRef<Row[]>(rows);
  const serverErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // 고객 목록
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await bossCustomersApi.list();
        if (alive && res.success !== false && res.data) setCustomers(res.data);
      } catch {
        // 고객을 못 읽어도 직접 입력으로 작성할 수 있다
      } finally {
        if (alive) setCustomersLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 새 문서 — 이 탭에 보관해 둔 작성본을 되살린다. 다른 고객으로 시작했으면 되살리지 않는다
  useEffect(() => {
    if (editId) return;
    const d = readDraft();
    if (d && (!presetCustomerId || presetCustomerId === d.customerId)) {
      setDocType(d.docType);
      setPayType(d.payType);
      setPayTypeTouched(d.payTypeTouched);
      setCustomerId(d.customerId);
      setEstimateId(d.estimateId);
      setIssueDate(d.issueDate || todayIso());
      setBuyerName(d.buyerName);
      setBuyerBizNo(d.buyerBizNo);
      setBuyerCeo(d.buyerCeo);
      setBuyerAddress(d.buyerAddress);
      setBuyerBizType(d.buyerBizType);
      setBuyerBizKind(d.buyerBizKind);
      setBuyerEmail(d.buyerEmail);
      setBuyerPhone(d.buyerPhone);
      setCashUsage(d.cashUsage);
      setCashIdentityType(d.cashIdentityType);
      setCashIdentityNum(d.cashIdentityNum);
      setCashTaxation(d.cashTaxation === 'NON_TAXABLE' ? 'NON_TAXABLE' : 'TAXABLE');
      setRows(d.rows.length ? d.rows.map((r) => newRow({ ...r })) : [newRow()]);
      setMemo(d.memo);
      // 되살린 품목을 견적 품목으로 덮지 않게
      setItemsLoaded(d.customerId || null);
      setDraftRestored(true);
    }
    setDraftReady(true);
  }, [editId, presetCustomerId]);

  // 수정 모드 — 기존 건 읽기
  useEffect(() => {
    if (!editId) return;
    let alive = true;
    setLoadingEdit(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await bossTaxInvoiceApi.get(editId);
        if (!alive) return;
        if (res.success !== false && res.data) {
          const d = res.data;
          setProviderLocked(isProviderManaged(d));
          setDocType(d.docType);
          setPayType(d.payType);
          setPayTypeTouched(true);
          setCustomerId(d.customerId ? String(d.customerId) : '');
          setEstimateId(d.estimateId ?? null);
          setIssueDate(d.issueDate ?? todayIso());
          setBuyerName(d.buyerName ?? '');
          setBuyerBizNo(d.buyerBizNo ? maskBizNo(d.buyerBizNo) : '');
          setBuyerCeo(d.buyerCeo ?? '');
          setBuyerAddress(d.buyerAddress ?? '');
          setBuyerBizType(d.buyerBizType ?? '');
          setBuyerBizKind(d.buyerBizKind ?? '');
          setBuyerEmail(d.buyerEmail ?? '');
          setBuyerPhone(d.buyerPhone ?? '');
          if (d.docType === 'CASH') {
            const c = cashFieldsOf(d);
            setCashUsage(c.usage);
            setCashIdentityType(c.identityType);
            setCashIdentityNum(c.identityType === 'SELF' ? '' : maskCashIdentityInput(c.identityType, c.identityNum));
            // 예전 기록(과세 구분 없음)은 품목 세액으로 짐작해 채우되, 저장 전에 확인을 받는다
            setCashTaxation(c.taxation ?? guessCashTaxation(Array.isArray(d.items) ? d.items : []));
            setLegacyInferred(c.inferred);
            setLegacyConfirmed(false);
          }
          setMemo(d.memo ?? '');
          const items = Array.isArray(d.items) ? d.items : [];
          setRows(
            items.length > 0
              ? items.map((it) => newRow({ ...it, taxFree: (it.vatAmount ?? 0) === 0 && (it.supplyAmount ?? 0) > 0 }))
              : [newRow({ supplyAmount: d.supplyAmount, vatAmount: d.vatAmount, name: d.itemSummary ?? '', taxFree: d.vatAmount === 0 && d.supplyAmount > 0 })],
          );
          setItemsLoaded(d.customerId ? String(d.customerId) : null);
        } else {
          setLoadError(res.message || res.error || '문서를 불러오지 못했습니다.');
        }
      } catch {
        if (alive) setLoadError('네트워크 오류로 문서를 불러오지 못했습니다.');
      } finally {
        if (alive) setLoadingEdit(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [editId]);

  // 고객 기본 정보(이름 · 전화 · 주소) — 이미 값이 있으면(보관본 · 수정 모드 · 직접 입력) 덮어쓰지 않는다
  useEffect(() => {
    if (!customerId) return;
    const customer = customers.find((c) => String(c.id) === customerId);
    if (!customer) return;
    setBuyerName((v) => v || customer.name || '');
    setBuyerPhone((v) => v || customer.phone || '');
    setBuyerAddress((v) => v || [customer.address1, customer.address2].filter(Boolean).join(' '));
  }, [customerId, customers]);

  // 고객 선택 → 견적 품목 · 사업자 정보 프리필. 이미 읽은 고객이면 건너뛴다
  useEffect(() => {
    if (!customerId || itemsLoaded === customerId || !draftReady) return;
    let alive = true;
    const forCustomer = customerId;
    (async () => {
      try {
        const [itemsRes, prefillRes] = await Promise.all([
          bossEstimateApi.list(forCustomer),
          bossTaxInvoiceApi.prefill(forCustomer),
        ]);
        if (!alive) return;
        if (itemsRes.success !== false && Array.isArray(itemsRes.data) && itemsRes.data.length > 0) {
          const next = itemsRes.data.map(fromEstimateItem);
          const nextEstimateId = itemsRes.data[0].estimateId ?? null;
          if (rowsRef.current.some(rowHasContent)) {
            setPendingEstimate({ rows: next, estimateId: nextEstimateId });
          } else {
            setRows(next);
            setEstimateId(nextEstimateId);
            toast.success(`견적 품목 ${next.length}건을 불러왔습니다.`);
          }
        }
        const p = prefillRes.success !== false ? prefillRes.data : null;
        if (p) {
          setBuyerName((v) => v || p.buyerName || '');
          setBuyerBizNo((v) => v || (p.buyerBizNo ? maskBizNo(p.buyerBizNo) : ''));
          setBuyerCeo((v) => v || p.buyerCeo || '');
          setBuyerAddress((v) => v || p.buyerAddress || '');
          setBuyerBizType((v) => v || p.buyerBizType || '');
          setBuyerBizKind((v) => v || p.buyerBizKind || '');
          setBuyerEmail((v) => v || p.buyerEmail || '');
          setBuyerPhone((v) => v || p.buyerPhone || '');
        }
      } catch {
        // 품목 · 프리필 실패는 직접 입력으로 이어간다
      } finally {
        if (alive) setItemsLoaded(forCustomer);
      }
    })();
    return () => {
      alive = false;
    };
  }, [customerId, itemsLoaded, draftReady]);

  // 새 문서 작성본 보관 — 입력이 바뀔 때마다
  useEffect(() => {
    if (editId || !draftReady) return;
    const draft: Draft = {
      docType, payType, payTypeTouched, customerId, estimateId, issueDate, buyerName, buyerBizNo, buyerCeo, buyerAddress,
      buyerBizType, buyerBizKind, buyerEmail, buyerPhone, cashUsage, cashIdentityType, cashIdentityNum, cashTaxation, rows, memo,
    };
    const empty =
      !customerId && !buyerName.trim() && !buyerBizNo.trim() && !cashIdentityNum.trim() && !memo.trim() && !rows.some(rowHasContent);
    try {
      if (empty) sessionStorage.removeItem(DRAFT_KEY);
      else sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // 저장소가 막혀 있으면 보관만 못 한다
    }
  }, [
    editId, draftReady, docType, payType, payTypeTouched, customerId, estimateId, issueDate, buyerName, buyerBizNo, buyerCeo,
    buyerAddress, buyerBizType, buyerBizKind, buyerEmail, buyerPhone, cashUsage, cashIdentityType, cashIdentityNum, cashTaxation,
    rows, memo,
  ]);

  const isCash = docType === 'CASH';
  // 현금영수증은 문서 단위 과세 구분을 모든 품목에 적용한다(품목별 면세 선택은 세금계산서에서만).
  // 행 자체는 바꾸지 않아 세금계산서로 돌아가면 품목별 선택이 그대로 남는다.
  const effectiveRows = useMemo(
    () =>
      isCash
        ? rows.map((r) => ({
            ...r,
            taxFree: cashTaxation === 'NON_TAXABLE',
            // 이미 10% 규칙에 맞는 과세 세액(부가세 포함 견적을 나눈 값 등)은 그대로 둔다 — 받은 돈(합계)이 1원 달라지지 않게
            vatAmount:
              cashTaxation === 'TAXABLE' && (r.vatAmount ?? 0) > 0 && isValidVat(r.supplyAmount ?? 0, r.vatAmount ?? 0)
                ? (r.vatAmount ?? 0)
                : cashVatOf(r.supplyAmount ?? 0, cashTaxation),
          }))
        : rows,
    [isCash, rows, cashTaxation],
  );
  const contentRows = useMemo(() => effectiveRows.filter(rowHasContent), [effectiveRows]);
  const totals = useMemo(() => {
    const supply = effectiveRows.reduce((a, r) => a + (r.supplyAmount ?? 0), 0);
    const vat = effectiveRows.reduce((a, r) => a + (r.vatAmount ?? 0), 0);
    return { supply, vat, total: supply + vat };
  }, [effectiveRows]);

  // 저장 전에 고칠 것 — 화면 순서대로(첫 항목으로 포커스를 옮긴다)
  const problems = useMemo<Problem[]>(() => {
    const list: Problem[] = [];
    if (!isCash) {
      if (!buyerName.trim()) list.push({ field: 'buyerName', message: '상호(법인명)를 입력하세요.', target: 'buyerName' });
      if (!buyerBizNo.trim()) list.push({ field: 'buyerBizNo', message: '공급받는자 사업자등록번호를 입력하세요.', target: 'buyerBizNo' });
      else if (!isValidBizNo(buyerBizNo)) {
        list.push({ field: 'buyerBizNo', message: '사업자등록번호 검증번호가 맞지 않습니다.', target: 'buyerBizNo' });
      }
    } else {
      const err = cashIdentityError(cashUsage, cashIdentityType, cashIdentityNum);
      if (err) list.push({ field: 'cashIdentityNum', message: err, target: cashIdentityType === 'SELF' ? 'cashIdentityType' : 'cashIdentityNum' });
      if (buyerName.trim().length > CASH_NAME_MAX) {
        list.push({ field: 'buyerName', message: `고객명은 ${CASH_NAME_MAX}자 이하로 줄여 주세요.`, target: 'buyerName' });
      }
      if (legacyInferred && !legacyConfirmed) {
        list.push({ field: 'legacyConfirm', message: '예전 기록의 용도 · 식별번호 · 과세 구분을 확인했다고 체크하세요.', target: 'legacyConfirm' });
      }
    }
    if (buyerEmail.trim() && !isCash && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) {
      list.push({ field: 'buyerEmail', message: '수신 이메일 형식이 아닙니다.', target: 'buyerEmail' });
    }
    const firstUnnamed = rows.find((r) => (r.supplyAmount ?? 0) > 0 && !(r.name ?? '').trim());
    const badQty = rows.find((r) => !Number.isInteger(r.qty ?? 0) || (r.qty ?? 0) < 0 || (r.qty ?? 0) > QTY_MAX);
    const badPrice = rows.find((r) => !Number.isFinite(r.unitPrice ?? 0) || (r.unitPrice ?? 0) < 0);
    if (contentRows.length === 0 || totals.total <= 0) {
      list.push({ field: 'items', message: '품목과 금액을 입력하세요.', target: `row-name-${rows[0]?.key}` });
    }
    if (firstUnnamed) list.push({ field: 'items', message: '금액이 있는 품목의 이름을 입력하세요.', target: `row-name-${firstUnnamed.key}` });
    if (badQty) list.push({ field: 'items', message: '수량은 0 이상의 정수로 입력하세요.', target: `row-qty-${badQty.key}` });
    if (badPrice) list.push({ field: 'items', message: '단가는 0 이상으로 입력하세요.', target: `row-price-${badPrice.key}` });
    if (isCash && totals.total > CASH_MAX_TOTAL) {
      list.push({ field: 'items', message: `현금영수증 합계는 ${fmt(CASH_MAX_TOTAL)}원을 넘을 수 없습니다.`, target: `row-price-${rows[0]?.key}` });
    }
    if (!issueDate) list.push({ field: 'issueDate', message: isCash ? '거래일자를 입력하세요.' : '작성일자를 입력하세요.', target: 'issueDate' });
    if (memo.length > MEMO_MAX) list.push({ field: 'memo', message: `메모는 ${MEMO_MAX}자 이하로 줄여 주세요.`, target: 'memo' });
    return list;
  }, [
    isCash, buyerName, buyerBizNo, buyerEmail, cashUsage, cashIdentityType, cashIdentityNum, legacyInferred, legacyConfirmed, rows,
    contentRows.length, totals.total, issueDate, memo,
  ]);

  const fieldError = (f: FieldKey): string | null => {
    if (serverFieldError?.field === f) return serverFieldError.message;
    if (!showErrors) return null;
    return problems.find((p) => p.field === f)?.message ?? null;
  };

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        // 수량 · 단가를 바꿨을 때만 공급가액을 다시 계산한다 — 견적에서 온 고정 공급가액을 면세 전환만으로 바꾸지 않는다
        if ('qty' in patch || 'unitPrice' in patch) next.supplyAmount = Math.round((next.qty ?? 0) * (next.unitPrice ?? 0));
        if ('qty' in patch || 'unitPrice' in patch || 'taxFree' in patch) next.vatAmount = vatOf(next.supplyAmount ?? 0, next.taxFree);
        return next;
      }),
    );

  const changeDocType = (next: TaxInvoiceDocType) => {
    setDocType(next);
    setServerFieldError(null);
    // 사장님이 직접 고르지 않았으면 현금영수증은 영수(받은 대금), 세금계산서는 청구로 시작한다
    if (!payTypeTouched) setPayType(next === 'CASH' ? 'RECEIPT' : 'CLAIM');
  };

  const changeUsage = (usage: CashUsage) => {
    setCashUsage(usage);
    const nextType = identityTypeForUsage(usage, cashIdentityType);
    if (nextType !== cashIdentityType) {
      setCashIdentityType(nextType);
      setCashIdentityNum((v) => maskCashIdentityInput(nextType, v));
    }
    setServerFieldError(null);
  };

  const changeIdentityType = (type: CashIdentityType) => {
    setCashIdentityType(type);
    setCashIdentityNum((v) => (type === 'SELF' ? v : maskCashIdentityInput(type, v)));
    setServerFieldError(null);
  };

  const resetForm = () => {
    clearDraft();
    setDraftRestored(false);
    setDocType(presetDocType);
    setPayType(presetDocType === 'CASH' ? 'RECEIPT' : 'CLAIM');
    setPayTypeTouched(false);
    setCustomerId(presetCustomerId ?? '');
    setEstimateId(null);
    setIssueDate(todayIso());
    setBuyerName('');
    setBuyerBizNo('');
    setBuyerCeo('');
    setBuyerAddress('');
    setBuyerBizType('');
    setBuyerBizKind('');
    setBuyerEmail('');
    setBuyerPhone('');
    setCashUsage('DEDUCTION');
    setCashIdentityType('PHONE');
    setCashIdentityNum('');
    setCashTaxation('TAXABLE');
    setRows([newRow()]);
    setMemo('');
    setItemsLoaded(null);
    setPendingEstimate(null);
    setShowErrors(false);
    setServerError(null);
    setServerFieldError(null);
  };

  const canSubmit = !saving && !loadingEdit && !providerLocked && !loadError;

  const submit = useCallback(
    async (after: 'detail' | 'preview') => {
      if (inFlight.current || !canSubmit) return;
      setShowErrors(true);
      setServerFieldError(null);
      if (problems.length > 0) {
        focusTarget(problems[0].target);
        toast.error(`고칠 항목 ${problems.length}개 — ${problems[0].message}`);
        return;
      }
      inFlight.current = true;
      setSaving(after);
      setServerError(null);
      const identityNum = isCash ? normalizeCashIdentity(cashIdentityType, cashIdentityNum) : null;
      const body: TaxInvoiceSaveRequest = {
        id: editId ? Number(editId) : undefined,
        customerId: customerId ? Number(customerId) : null,
        estimateId,
        docType,
        payType,
        issueDate,
        buyerName: buyerName.trim() || null,
        // 현금영수증은 사업자번호로 식별할 때만 사업자번호를 함께 남긴다(예전 화면 · 목록 호환)
        buyerBizNo: isCash ? (cashIdentityType === 'BIZNO' ? formatBizNo(identityNum) : null) : formatBizNo(buyerBizNo),
        buyerCeo: isCash ? null : buyerCeo.trim() || null,
        buyerAddress: isCash ? null : buyerAddress.trim() || null,
        buyerBizType: isCash ? null : buyerBizType.trim() || null,
        buyerBizKind: isCash ? null : buyerBizKind.trim() || null,
        buyerEmail: isCash ? null : buyerEmail.trim() || null,
        buyerPhone: buyerPhone.trim() || null,
        supplyAmount: totals.supply,
        vatAmount: totals.vat,
        totalAmount: totals.total,
        items: contentRows.map(({ key: _k, taxFree: _t, ...rest }) => ({
          ...rest,
          name: (rest.name ?? '').trim(),
          spec: (rest.spec ?? '').trim() || null,
        })),
        memo: memo.trim() || null,
        cashUsage: isCash ? cashUsage : null,
        cashIdentityType: isCash ? cashIdentityType : null,
        cashIdentityNum: identityNum,
        cashTaxationType: isCash ? cashTaxation : null,
      };
      let ok = false;
      try {
        const res = await bossTaxInvoiceApi.save(body);
        if (res.success !== false && res.data?.id) {
          ok = true;
          const savedId = res.data.id;
          if (!editId) clearDraft();
          markListDirty(LIST_KEYS.taxInvoice);
          if (!mounted.current) return;
          toast.success(editId ? '수정했습니다.' : '저장했습니다. 아직 발급 전(미발급) 문서입니다.');
          router.replace(after === 'preview' ? `/boss/tax-invoice/${savedId}/print` : `/boss/tax-invoice/${savedId}`);
        } else {
          const msg = res.message || res.error || '저장하지 못했습니다.';
          if (!mounted.current) return;
          const field = fieldFromServerMessage(msg, docType);
          setServerError(`${msg} 입력한 내용은 그대로 두었습니다.`);
          if (field) {
            setServerFieldError({ field, message: msg });
            focusTarget(field === 'items' ? `row-name-${rows[0]?.key}` : FIELD_TARGET[field]);
          } else {
            serverErrorRef.current?.focus();
          }
        }
      } catch {
        if (mounted.current) setServerError('네트워크 오류로 저장 결과를 확인하지 못했습니다. 입력한 내용은 그대로 두었습니다. 목록에서 저장됐는지 확인한 뒤 다시 저장하세요.');
      } finally {
        // 저장에 성공하면 화면을 옮기는 동안에도 잠가 둔다(연타로 두 건이 생기지 않게)
        if (!ok) inFlight.current = false;
        if (mounted.current && !ok) setSaving(null);
      }
    },
    [
      canSubmit, problems, isCash, cashIdentityType, cashIdentityNum, editId, customerId, estimateId, docType, payType, issueDate,
      buyerName, buyerBizNo, buyerCeo, buyerAddress, buyerBizType, buyerBizKind, buyerEmail, buyerPhone, totals, contentRows, memo,
      cashUsage, cashTaxation, router, rows,
    ],
  );

  const handleHotkey = useCallback(() => void submit('detail'), [submit]);
  useSubmitHotkey(handleHotkey, canSubmit);

  if (loadingEdit) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (loadError) {
    return (
      <AlertBanner
        tone="bad"
        action={
          <ButtonLink href={editId ? `/boss/tax-invoice/${editId}` : '/boss/tax-invoice'} variant="secondary" size="sm">
            돌아가기
          </ButtonLink>
        }
      >
        {loadError}
      </AlertBanner>
    );
  }

  const locked = providerLocked || saving !== null;
  const identityOptions = CASH_IDENTITY_TYPES_BY_USAGE[cashUsage];
  const errClass = (f: FieldKey) => (fieldError(f) ? 'text-boss-error' : '');

  return (
    <div className="grid max-w-[1180px] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-4">
        {serverError && (
          <div ref={serverErrorRef} tabIndex={-1} className="outline-none">
            <AlertBanner tone="bad">{serverError}</AlertBanner>
          </div>
        )}
        {providerLocked && (
          <AlertBanner
            tone="warn"
            action={
              <ButtonLink href={`/boss/tax-invoice/${editId}`} variant="secondary" size="sm">
                상세로
              </ButtonLink>
            }
          >
            전자 발급 · 취소를 시도한 문서와 수정세금계산서(취소분)는 수정할 수 없습니다. 상세 화면에서 상태를 확인하세요.
          </AlertBanner>
        )}
        {draftRestored && (
          <AlertBanner
            tone="info"
            action={
              <Button variant="secondary" size="sm" onClick={resetForm}>
                새로 작성
              </Button>
            }
          >
            작성 중이던 내용을 불러왔습니다. 처음부터 쓰려면 새로 작성을 누르세요.
          </AlertBanner>
        )}
        {legacyInferred && isCash && (
          <AlertBanner tone="warn">
            예전에 저장한 현금영수증이라 용도 · 식별번호 · 과세 구분 중 비어 있는 값을 연락처 · 사업자번호 · 품목 세액으로 추정해 채웠습니다.
            아래 값을 확인하고 확인 체크를 해야 저장 · 발급할 수 있습니다.
          </AlertBanner>
        )}

        <fieldset disabled={locked} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
          {/* ── 1. 문서 종류 · 고객 ── */}
          <Panel kicker="01" title="문서 종류 · 고객">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel required>문서 종류</FieldLabel>
                <div role="radiogroup" aria-label="문서 종류" className="flex flex-col gap-2">
                  <RadioOption
                    checked={docType === 'TAX'}
                    onChange={() => changeDocType('TAX')}
                    label="세금계산서"
                    hint="사업자 고객"
                  />
                  <RadioOption
                    checked={docType === 'CASH'}
                    onChange={() => changeDocType('CASH')}
                    label="현금영수증"
                    hint="소득공제 · 지출증빙"
                  />
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-boss-text-secondary">
                  {isCash
                    ? '개인 고객은 소득공제용, 사업자 고객이 경비로 쓰려면 지출증빙용입니다. 바꿔도 적은 내용은 남습니다.'
                    : '인테리어 · 건설 · 상가 등 사업자 고객에게 발급합니다. 바꿔도 적은 내용은 남습니다.'}
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
                    setPendingEstimate(null);
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
                  고르면 그 고객의 견적 품목과 이전에 받아 둔 사업자 정보를 채웁니다. 이미 적은 칸은 덮어쓰지 않습니다.
                </p>
              </div>
            </div>
          </Panel>

          {/* ── 2. 공급받는자 / 현금영수증 정보 ── */}
          {isCash ? (
            <Panel kicker="02" title="현금영수증 정보">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel required>용도</FieldLabel>
                  <Segmented
                    ariaLabel="현금영수증 용도"
                    value={cashUsage}
                    onChange={changeUsage}
                    options={[
                      { key: 'DEDUCTION', label: '개인 소득공제' },
                      { key: 'EXPENSE', label: '사업자 지출증빙' },
                    ]}
                  />
                  <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
                    {cashUsage === 'DEDUCTION'
                      ? '개인 고객의 연말정산 소득공제용입니다. 휴대폰번호 또는 자진발급으로 발급합니다.'
                      : '사업자 고객의 경비(매입세액) 증빙용입니다. 사업자번호 또는 휴대폰번호로 발급합니다.'}
                  </p>
                </div>
                <div>
                  <FieldLabel required>식별 방법</FieldLabel>
                  <div id="cashIdentityType" tabIndex={-1} className="outline-none">
                    <Segmented
                      ariaLabel="식별 방법"
                      value={cashIdentityType}
                      onChange={changeIdentityType}
                      options={identityOptions.map((t) => ({ key: t, label: CASH_IDENTITY_LABEL[t] }))}
                    />
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
                    주민등록번호 · 카드번호는 받지 않습니다.
                  </p>
                </div>
                {cashIdentityType === 'SELF' ? (
                  <div className="md:col-span-2">
                    <FieldLabel>식별번호</FieldLabel>
                    <p className="boss-input flex items-center bg-boss-inset font-boss-head tabular-nums text-boss-text-secondary">
                      010-000-1234 (국세청 자진발급 번호)
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
                      고객이 번호를 알려 주지 않을 때 쓰는 국세청 지정 번호입니다. 소득공제용에만 쓸 수 있습니다.
                    </p>
                  </div>
                ) : (
                  <Field
                    id="cashIdentityNum"
                    className="md:col-span-2"
                    label={cashIdentityType === 'BIZNO' ? '고객 사업자등록번호' : '고객 휴대폰번호'}
                    required
                    value={cashIdentityNum}
                    onChange={(e) => {
                      setCashIdentityNum(maskCashIdentityInput(cashIdentityType, e.target.value));
                      if (serverFieldError?.field === 'cashIdentityNum') setServerFieldError(null);
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={cashIdentityType === 'BIZNO' ? '000-00-00000' : '010-0000-0000'}
                    aria-invalid={Boolean(fieldError('cashIdentityNum'))}
                    hint={
                      fieldError('cashIdentityNum') ? (
                        <span className="text-boss-error">{fieldError('cashIdentityNum')}</span>
                      ) : cashIdentityNum && !cashIdentityError(cashUsage, cashIdentityType, cashIdentityNum) ? (
                        <span className="text-boss-success">확인된 형식입니다 · {formatCashIdentity(cashIdentityType, cashIdentityNum)}</span>
                      ) : cashIdentityType === 'BIZNO' ? (
                        '고객 사업자등록증의 10자리 번호'
                      ) : (
                        '국내 휴대폰번호 10~11자리'
                      )
                    }
                    maxLength={13}
                    hideCounter
                  />
                )}
                <Field
                  id="buyerName"
                  label={cashUsage === 'EXPENSE' ? '고객명 · 상호 (선택)' : '고객명 (선택)'}
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (serverFieldError?.field === 'buyerName') setServerFieldError(null);
                  }}
                  placeholder={cashUsage === 'EXPENSE' ? 'OO인테리어' : '홍길동'}
                  maxLength={CASH_NAME_MAX}
                  aria-invalid={Boolean(fieldError('buyerName'))}
                  hint={
                    fieldError('buyerName') ? (
                      <span className="text-boss-error">{fieldError('buyerName')}</span>
                    ) : (
                      '몰라도 비워 두고 저장 · 발급할 수 있습니다. 적으면 목록 검색과 영수증에 표시됩니다.'
                    )
                  }
                />
                <Field
                  id="buyerPhone"
                  label="고객 연락처 (선택)"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  maxLength={20}
                  hint="문자로 보내기에 씁니다. 식별번호와 달라도 됩니다."
                />
                {legacyInferred && (
                  <div id="legacyConfirm" tabIndex={-1} className="border border-boss-warning/35 bg-boss-pill-warn px-3 py-2.5 outline-none md:col-span-2">
                    <CheckLine
                      checked={legacyConfirmed}
                      onChange={(v) => {
                        setLegacyConfirmed(v);
                        if (serverFieldError?.field === 'legacyConfirm') setServerFieldError(null);
                      }}
                    >
                      용도 · 식별번호와 아래 품목의 과세 구분({CASH_TAXATION_LABEL[cashTaxation]})을 확인했습니다
                    </CheckLine>
                    {fieldError('legacyConfirm') && <p className="mt-1 text-[12px] text-boss-error">{fieldError('legacyConfirm')}</p>}
                  </div>
                )}
              </div>
            </Panel>
          ) : (
            <Panel kicker="02" title="공급받는자 (사업자 정보)">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  id="buyerName"
                  label="상호(법인명)"
                  required
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (serverFieldError?.field === 'buyerName') setServerFieldError(null);
                  }}
                  placeholder="(주)OO인테리어"
                  maxLength={100}
                  aria-invalid={Boolean(fieldError('buyerName'))}
                  hint={fieldError('buyerName') ? <span className="text-boss-error">{fieldError('buyerName')}</span> : undefined}
                />
                <Field
                  id="buyerBizNo"
                  label="사업자등록번호"
                  required
                  value={buyerBizNo}
                  onChange={(e) => {
                    setBuyerBizNo(maskBizNo(e.target.value));
                    if (serverFieldError?.field === 'buyerBizNo') setServerFieldError(null);
                  }}
                  inputMode="numeric"
                  placeholder="000-00-00000"
                  aria-invalid={Boolean(fieldError('buyerBizNo'))}
                  hint={
                    fieldError('buyerBizNo') ? (
                      <span className="text-boss-error">{fieldError('buyerBizNo')}</span>
                    ) : buyerBizNo.trim() ? (
                      isValidBizNo(buyerBizNo) ? (
                        <span className="text-boss-success">확인된 형식입니다.</span>
                      ) : (
                        <span className="text-boss-error">검증번호가 맞지 않습니다. 사업자등록증의 번호를 다시 확인하세요.</span>
                      )
                    ) : (
                      '고객 사업자등록증의 10자리 번호'
                    )
                  }
                  maxLength={12}
                  hideCounter
                />
                <Field id="buyerCeo" label="대표자" value={buyerCeo} onChange={(e) => setBuyerCeo(e.target.value)} maxLength={100} />
                <Field
                  id="buyerEmail"
                  label="전자세금계산서 수신 이메일"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="tax@example.com"
                  aria-invalid={Boolean(fieldError('buyerEmail'))}
                  hint={
                    fieldError('buyerEmail') ? (
                      <span className="text-boss-error">{fieldError('buyerEmail')}</span>
                    ) : (
                      '전자 발급 시 이 주소로 계산서가 전송됩니다.'
                    )
                  }
                  maxLength={100}
                />
                <Field
                  id="buyerAddress"
                  label="사업장 주소"
                  className="md:col-span-2"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  maxLength={200}
                />
                <Field id="buyerBizType" label="업태" value={buyerBizType} onChange={(e) => setBuyerBizType(e.target.value)} placeholder="건설업" maxLength={50} />
                <Field id="buyerBizKind" label="종목" value={buyerBizKind} onChange={(e) => setBuyerBizKind(e.target.value)} placeholder="실내건축공사" maxLength={50} />
                <Field
                  id="buyerPhone"
                  label="담당자 연락처 (선택)"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  maxLength={20}
                  hint="문자로 보내기에 씁니다."
                />
              </div>
            </Panel>
          )}

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
            {pendingEstimate && (
              <div className="mb-3">
                <AlertBanner
                  tone="info"
                  action={
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setRows(pendingEstimate.rows);
                          setEstimateId(pendingEstimate.estimateId);
                          setPendingEstimate(null);
                        }}
                      >
                        견적 품목으로 바꾸기
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setPendingEstimate(null)}>
                        지금 품목 유지
                      </Button>
                    </div>
                  }
                >
                  이 고객의 견적 품목 {pendingEstimate.rows.length}건이 있습니다. 이미 적은 품목을 바꿀까요?
                </AlertBanner>
              </div>
            )}
            {fieldError('items') && (
              <p className={`mb-2 text-[12.5px] ${errClass('items')}`} role="alert">
                {fieldError('items')}
              </p>
            )}
            {isCash && (
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border border-boss-border bg-boss-bg px-3 py-2.5">
                <div>
                  <FieldLabel required>과세 구분 (문서 전체)</FieldLabel>
                  <Segmented
                    ariaLabel="과세 구분"
                    value={cashTaxation}
                    onChange={setCashTaxation}
                    options={[
                      { key: 'TAXABLE', label: '과세' },
                      { key: 'NON_TAXABLE', label: '비과세(면세)' },
                    ]}
                  />
                </div>
                <p className="min-w-[200px] flex-1 text-[12px] leading-relaxed text-boss-text-secondary">
                  현금영수증은 한 문서에 과세 · 비과세를 섞지 않습니다. 비과세는 세액 0원, 과세는 품목마다 공급가액의 10%(원 단위 반올림)이며 소액이면
                  과세여도 세액이 0원일 수 있습니다.
                </p>
              </div>
            )}
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
                    {!isCash && <th>면세</th>}
                    <th>
                      <span className="sr-only">행 삭제</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {effectiveRows.map((r, i) => (
                    <tr key={r.key}>
                      <td className="min-w-[160px]">
                        <input
                          id={`row-name-${r.key}`}
                          className="boss-input"
                          value={r.name ?? ''}
                          onChange={(e) => updateRow(r.key, { name: e.target.value })}
                          placeholder="도배 시공"
                          aria-label={`${i + 1}번 품목`}
                          maxLength={100}
                        />
                      </td>
                      <td className="min-w-[120px]">
                        <input
                          className="boss-input"
                          value={r.spec ?? ''}
                          onChange={(e) => updateRow(r.key, { spec: e.target.value })}
                          placeholder="84㎡ 실크"
                          aria-label={`${i + 1}번 규격`}
                          maxLength={50}
                        />
                      </td>
                      <td className="w-[90px]">
                        <input
                          id={`row-qty-${r.key}`}
                          className="boss-input text-right"
                          type="number"
                          min={0}
                          step={1}
                          value={r.qty ?? 0}
                          onChange={(e) => updateRow(r.key, { qty: e.target.value === '' ? 0 : Number(e.target.value) })}
                          aria-label={`${i + 1}번 수량`}
                        />
                      </td>
                      <td className="w-[140px]">
                        <input
                          id={`row-price-${r.key}`}
                          className="boss-input text-right"
                          type="number"
                          min={0}
                          step={1000}
                          value={r.unitPrice ?? 0}
                          onChange={(e) => updateRow(r.key, { unitPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                          aria-label={`${i + 1}번 단가`}
                        />
                      </td>
                      <td className="num text-boss-text">{fmt(r.supplyAmount)}</td>
                      <td className="num text-boss-text-secondary">{fmt(r.vatAmount)}</td>
                      {!isCash && (
                        <td>
                          <CheckLine checked={r.taxFree} onChange={(v) => updateRow(r.key, { taxFree: v })}>
                            <span className="sr-only">{i + 1}번 면세</span>
                          </CheckLine>
                        </td>
                      )}
                      <td className="text-right">
                        <button
                          type="button"
                          className="boss-btn boss-btn-sm boss-btn-ghost !text-boss-text-muted hover:!text-boss-error"
                          onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
                          aria-label={`${i + 1}번 행 삭제`}
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
              <MetricBox label={isCash ? `부가세 · ${CASH_TAXATION_LABEL[cashTaxation]}` : '세액 (10%)'} value={`${fmt(totals.vat)}원`} />
              <MetricBox label="합계" value={`${fmt(totals.total)}원`} />
            </div>
            <p className="mt-2 font-boss-head text-[13px] text-boss-text-secondary">{toKoreanAmountLabel(totals.total)}</p>
          </Panel>

          {/* ── 4. 작성일자 · 대금 · 메모 ── */}
          <Panel kicker="04" title={isCash ? '거래일자 · 대금' : '작성일자 · 영수/청구'}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="issueDate"
                label={isCash ? '거래일자' : '작성일자'}
                required
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                aria-invalid={Boolean(fieldError('issueDate'))}
                hint={
                  fieldError('issueDate') ? (
                    <span className="text-boss-error">{fieldError('issueDate')}</span>
                  ) : isCash ? (
                    issueDate && issueDate !== todayIso() ? (
                      <span className="text-boss-pill-warn-fg">
                        오늘(한국시간 {todayIso()})이 아닌 날짜라 전자 발급은 할 수 없고 기록으로만 저장됩니다. 발급할 때 날짜가 오늘로 몰래 바뀌지
                        않습니다.
                      </span>
                    ) : (
                      `실제 발급은 거래일자가 오늘(한국시간 ${todayIso()})인 문서만 됩니다. 지난 날짜는 기록으로만 저장됩니다.`
                    )
                  ) : (
                    '공급 시기와 작성일자를 확인해 주세요.'
                  )
                }
              />
              <div>
                <FieldLabel>{isCash ? '대금 수령' : '영수 / 청구'}</FieldLabel>
                <Segmented
                  ariaLabel={isCash ? '대금 수령' : '영수 청구 구분'}
                  value={payType}
                  onChange={(v) => {
                    setPayType(v);
                    setPayTypeTouched(true);
                  }}
                  options={
                    isCash
                      ? [
                          { key: 'RECEIPT', label: '받았음 (영수)' },
                          { key: 'CLAIM', label: '아직 안 받음' },
                        ]
                      : [
                          { key: 'CLAIM', label: '청구 (아직 안 받음)' },
                          { key: 'RECEIPT', label: '영수 (받았음)' },
                        ]
                  }
                />
                {isCash && payType === 'CLAIM' && (
                  <p className="mt-1 text-[12px] leading-relaxed text-boss-pill-warn-fg">
                    현금영수증은 받은 대금만 발급할 수 있습니다. 지금은 기록만 저장되고, 대금을 받은 뒤 영수로 바꿔야 발급할 수 있습니다.
                  </p>
                )}
              </div>
              <TextareaField
                id="memo"
                label="내부 메모 (서식에 나가지 않음)"
                className="md:col-span-2"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="현장명 · 담당자 · 요청 경위 등"
                rows={3}
                maxLength={MEMO_MAX}
                hint={fieldError('memo') ? <span className="text-boss-error">{fieldError('memo')}</span> : undefined}
              />
            </div>
          </Panel>
        </fieldset>

        {/* ── 하단 액션 ── */}
        <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-[12.5px] text-boss-text-secondary" aria-live="polite">
            {providerLocked
              ? '전자 발급 · 취소를 시도한 문서라 저장할 수 없습니다.'
              : saving
                ? '저장 중입니다…'
                : showErrors && problems.length > 0
                  ? `고칠 항목 ${problems.length}개`
                  : '저장하면 미발급(작성 완료) 문서로 보관됩니다. 발급은 상세에서 따로 합니다.'}{' '}
            <kbd className="ml-1 border border-boss-border px-1 font-boss-head text-[11px]">⌘↵</kbd>
          </span>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={editId ? `/boss/tax-invoice/${editId}` : '/boss/tax-invoice'} variant="secondary">
              취소
            </ButtonLink>
            <Button variant="secondary" icon={Eye} onClick={() => void submit('preview')} disabled={!canSubmit}>
              {saving === 'preview' ? '저장 중…' : '저장 후 미리보기'}
            </Button>
            <Button variant="primary" onClick={() => void submit('detail')} disabled={!canSubmit}>
              {saving === 'detail' ? '저장 중…' : editId ? '수정 저장' : '저장'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 우측 안내 ── */}
      <div className="flex flex-col gap-4">
        <Panel kicker="확인할 것" title={problems.length === 0 ? '저장할 수 있습니다' : `${problems.length}항목`}>
          {problems.length === 0 ? (
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              {isCash
                ? `${cashUsage === 'DEDUCTION' ? '소득공제용' : '지출증빙용'} · ${formatCashIdentity(cashIdentityType, cashIdentityType === 'SELF' ? CASH_SELF_ISSUE_NUMBER : cashIdentityNum)} · ${CASH_TAXATION_LABEL[cashTaxation]} · 합계 ${fmt(totals.total)}원`
                : `${buyerName || '공급받는자'} · 합계 ${fmt(totals.total)}원`}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {problems.map((p, i) => (
                <li key={`${p.target}-${i}`}>
                  <button
                    type="button"
                    className={`text-left text-[12.5px] leading-snug hover:underline ${showErrors ? 'text-boss-error' : 'text-boss-text-secondary'}`}
                    onClick={() => focusTarget(p.target)}
                  >
                    · {p.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel kicker="순서" title="작성부터 발급까지">
          <ol className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
            <li>
              <span className="font-semibold text-boss-text">1. 작성 · 저장</span> — 미발급(작성 완료) 문서로 보관됩니다.
            </li>
            <li>
              <span className="font-semibold text-boss-text">2. 미리보기 · PDF</span> — 실물 서식으로 확인하고 인쇄 · PDF로 보냅니다.
            </li>
            <li>
              <span className="font-semibold text-boss-text">3. 발급</span> — 전자 발급은 정식 오픈 후 상세에서 합니다. 지금은 홈택스에서
              발행한 뒤 승인번호를 기록하세요.
            </li>
          </ol>
        </Panel>
        <Panel kicker="참고" title="금액 계산">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            세액은 공급가액의 10%로 계산합니다(원 단위 반올림). 면세 품목은 세액이 0이 됩니다. 견적에서 불러온 공급가액은 면세를 바꿔도
            그대로 두고, 수량 · 단가를 바꿀 때만 다시 계산합니다. 합계는 서버가 공급가액 + 세액으로 다시 계산해 저장합니다.
            {isCash && ` 현금영수증은 과세 구분을 문서 전체에 적용하고, 한 건에 ${fmt(CASH_MAX_TOTAL)}원까지입니다.`}
          </p>
        </Panel>
      </div>
    </div>
  );
}
