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
// 보관본은 주소의 문서 종류 · 고객과 맞을 때만 되살린다. 맞지 않으면 지우지 않고 따로 두어 "이어 쓰기"로 꺼낸다(2026-10-21).
// 품목 날짜는 작성일자를 따른다 — 새 품목 · 견적 품목은 작성일자, 작성일자를 바꾸면 다른 달인 품목 날짜도 작성일자로(2026-10-21).
// 고객을 고르면 지난 사업자 정보(프리필)를 먼저, 남은 빈 칸만 고객 기본 정보로 채운다. 다른 고객으로 바꾸면 앞 고객이 채운 칸은 비운다.
//
// ?id= 수정, ?customerId= 그 고객으로 시작, ?docType=CASH 현금영수증으로 시작.

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type InputHTMLAttributes } from 'react';
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
import { useIssuanceOpenFor } from '@/lib/boss/electronicTaxInvoiceLaunch';
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
  DOC_TYPE_LABEL,
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
  Panel,
  RadioOption,
  Segmented,
  Skeleton,
  TextareaField,
} from '@/components/boss/ui';
import { useSubmitHotkey } from '@/components/boss/layout/BossSearchContext';
import { useBossHeaderTitle } from '@/components/boss/layout/BossHeader';
import AmountBoxes from '@/components/boss/taxinvoice/AmountBoxes';

type Row = TaxInvoiceItem & {
  key: string;
  taxFree: boolean;
  /** 부가세 포함 단가 — '부가세 포함'으로 직접 넣은 줄만 있다(2026-10-17) */
  gross?: number | null;
  /** 견적 · 저장 문서에서 온 금액 — 수량 · 단가를 고치기 전까지 공급가액 · 세액을 그대로 쓴다 */
  fixed?: boolean;
};

/** 단가 입력 방식 — EX: 부가세 별도(공급가액), IN: 부가세 포함(받을 금액) */
type VatMode = 'EX' | 'IN';

/** 서버 검증과 같은 길이 */
const MEMO_MAX = 500;
/** 서버 qty 는 정수(Int) */
const QTY_MAX = 2_147_483_647;
const DRAFT_KEY = 'boss:tax-invoice:draft';
/** 주소의 문서 종류 · 고객과 맞지 않아 따로 둔 보관본 — "이어 쓰기"로 꺼낸다(2026-10-21) */
const PARKED_DRAFT_KEY = 'boss:tax-invoice:draft:other';
/** 현금영수증 고객명 — 선택 입력, 적으면 70자까지(팝빌 customerName · 서버 검증과 같다) */
const CASH_NAME_MAX = 70;

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');
// 새 문서 기본 날짜는 서버와 같은 한국시간 오늘
const todayIso = () => kstToday();
/** 같은 달인가 — yyyy-MM-dd 앞 7자리 */
const sameMonth = (a?: string | null, b?: string | null) => Boolean(a && b && a.slice(0, 7) === b.slice(0, 7));
let rowSeq = 0;
/**
 * [fixedKey] — 첫 화면의 빈 줄만 쓴다. 서버 그림과 브라우저 그림의 칸 id 가 같아야 한다(2026-10-17):
 * 전역 번호는 서버(요청마다 늘어남)와 브라우저가 달라 id 가 어긋났고, 그러면 '확인할 것'을 눌러도 그 칸으로 가지 못했다.
 */
const newRow = (init?: Partial<Row>, fixedKey?: string): Row => ({
  name: '',
  spec: '',
  qty: 1,
  unitPrice: 0,
  supplyAmount: 0,
  vatAmount: 0,
  date: todayIso(),
  taxFree: false,
  ...init,
  key: fixedKey ?? `r${++rowSeq}`,
});

// 10% 원 단위 반올림 — 0.1 곱셈은 이진 소수 오차가 있어 10으로 나눈다(정수 공급가액의 .5 는 정확히 올림)
const vatOf = (supply: number, taxFree: boolean) => (taxFree ? 0 : Math.round(supply / 10));

/**
 * 부가세 포함 금액으로 넣은 줄 → 공급가액 · 세액 · 공급가 기준 단가(2026-10-17).
 * 수량 × 포함 단가(받을 돈)는 그대로 지키고 견적 가져오기와 같은 규칙(splitVatInclusive)으로 나눈다.
 * 예: 550,000원 → 500,000 + 50,000. 예전엔 받은 돈을 단가에 넣으면 10%가 더 붙어 605,000원이 됐다.
 */
function fromGross(qty: number, gross: number, noVat: boolean) {
  const total = Math.round(qty * gross);
  const { supply, vat } = noVat ? { supply: total, vat: 0 } : splitVatInclusive(total);
  return { supplyAmount: supply, vatAmount: vat, unitPrice: qty > 0 ? Math.round(supply / qty) : 0 };
}

/** '부가세 포함' 칸에 보일 단가 — 직접 넣은 값, 없으면(견적 · 저장 금액) 합계 ÷ 수량 */
const grossOf = (r: Row) =>
  r.gross ?? ((r.qty ?? 0) > 0 ? Math.round(((r.supplyAmount ?? 0) + (r.vatAmount ?? 0)) / (r.qty ?? 1)) : 0);

/**
 * 숫자 칸(수량 · 단가) — 쉼표를 찍어 보여 주고, 누르면 전체를 골라 새로 친 숫자가 기존 값 앞에 붙지 않게 한다.
 * 예전엔 단가 칸의 기본값 0 왼쪽을 누르고 550000 을 치면 5,500,000 이 됐다(2026-10-17 점검).
 * [emptyWhenZero] 면 0 을 빈칸(흐린 0)으로 보인다.
 */
function AmountInput({
  value,
  onValue,
  emptyWhenZero = false,
  ...rest
}: {
  value: number;
  onValue: (next: number) => void;
  emptyWhenZero?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const ref = useRef<HTMLInputElement>(null);
  // 쉼표를 뺀 숫자 기준 커서 위치 — 쉼표가 늘거나 줄어도 커서가 끝으로 튀지 않게
  const caretDigits = useRef<number | null>(null);
  const selectOnMouseUp = useRef(false);
  const text = emptyWhenZero && value === 0 ? '' : value.toLocaleString('ko-KR');

  useLayoutEffect(() => {
    const el = ref.current;
    const digits = caretDigits.current;
    if (!el || digits == null || document.activeElement !== el) return;
    caretDigits.current = null;
    let pos = 0;
    let seen = 0;
    while (pos < el.value.length && seen < digits) {
      if (/\d/.test(el.value[pos])) seen += 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
  });

  return (
    <input
      ref={ref}
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        caretDigits.current = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, '').length;
        const digits = raw.replace(/\D/g, '').slice(0, 15);
        onValue(digits === '' ? 0 : Number(digits));
      }}
      onFocus={(e) => {
        const el = e.currentTarget;
        el.select();
        selectOnMouseUp.current = true;
        // iOS 는 포커스 직후 select() 를 무시해 한 번 더 고른다
        window.setTimeout(() => {
          if (document.activeElement === el) el.setSelectionRange(0, el.value.length);
        }, 0);
        rest.onFocus?.(e);
      }}
      onMouseUp={(e) => {
        // 누른 마우스를 뗄 때 선택이 풀리지 않게 — 첫 번째만
        if (selectOnMouseUp.current) {
          e.preventDefault();
          selectOnMouseUp.current = false;
        }
        rest.onMouseUp?.(e);
      }}
    />
  );
}

/**
 * 견적 품목 → 서식 행. 견적의 공급가액 · 세액이 있으면 그대로, 없으면 단가×수량으로 계산.
 * 부가세 포함 견적(수량×단가 = 공급가액+세액)은 합계를 지키며 공급가액 · 세액을 다시 나누고
 * 단가를 공급가 기준으로 바꾼다(2026-10-16) — 예전엔 "1 × 50,000 = 45,454" 로 찍히고 발급이 막혔다.
 * 품목 날짜는 견적 작성일이 아니라 이 문서의 작성일자[date]다(2026-10-21 — 다른 달 날짜가 서식에 찍혔다).
 */
function fromEstimateItem(it: BossEstimateItem, date: string): Row {
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
    date,
    taxFree,
    fixed: true,
  });
}

/** 견적의 0원 품목(단가 · 공급가액 · 세액 모두 0) — 가져올 때 뺀다. 모두 0원이면 빼지 않는다(2026-10-21) */
const isZeroEstimateItem = (it: BossEstimateItem) => !(it.unitPrice ?? 0) && !(it.supplyAmount ?? 0) && !(it.vatAmount ?? 0);

const rowHasContent = (r: Row) => Boolean((r.name ?? '').trim() || (r.spec ?? '').trim() || (r.supplyAmount ?? 0) > 0);

/**
 * 화면 · 저장에 쓰는 행 — 현금영수증은 문서 단위 과세 구분을 모든 품목에 적용한다(품목별 면세 선택은 세금계산서에서만).
 * 행 자체는 바꾸지 않아 세금계산서로 돌아가면 품목별 선택이 그대로 남는다.
 * '부가세 포함'으로 넣은 줄은 받을 돈(수량 × 포함 단가)을 지키며 과세 구분이 바뀌어도 다시 나눈다.
 */
function effectiveRowsOf(rows: Row[], isCash: boolean, cashTaxation: CashTaxationType, vatMode: VatMode): Row[] {
  return rows.map((r) => {
    const noVat = isCash ? cashTaxation === 'NON_TAXABLE' : r.taxFree;
    if (vatMode === 'IN' && r.gross != null && !r.fixed) {
      return { ...r, taxFree: noVat, ...fromGross(r.qty ?? 0, r.gross, noVat) };
    }
    if (!isCash) return r;
    return {
      ...r,
      taxFree: noVat,
      // 이미 10% 규칙에 맞는 과세 세액(부가세 포함 견적을 나눈 값 등)은 그대로 둔다 — 받은 돈(합계)이 1원 달라지지 않게
      vatAmount:
        cashTaxation === 'TAXABLE' && (r.vatAmount ?? 0) > 0 && isValidVat(r.supplyAmount ?? 0, r.vatAmount ?? 0)
          ? (r.vatAmount ?? 0)
          : cashVatOf(r.supplyAmount ?? 0, cashTaxation),
    };
  });
}

const totalOf = (rows: Row[]) => rows.reduce((a, r) => a + (r.supplyAmount ?? 0) + (r.vatAmount ?? 0), 0);

/**
 * 단가 입력 방식 바꾸기 — 직접 넣은 단가는 그 숫자를 새 방식으로 다시 읽는다(550,000 → 별도면 합계 605,000, 포함이면 550,000).
 * 견적 · 저장 문서에서 가져온 금액과 빈 줄은 그대로 두고 칸에 보이는 단가만 새 방식에 맞춘다(앱과 같다).
 */
function rowsForVatMode(rows: Row[], mode: VatMode, isCash: boolean, cashTaxation: CashTaxationType): Row[] {
  return rows.map((r) => {
    if (r.fixed) return r;
    if (mode === 'IN') {
      const gross = r.unitPrice ?? 0;
      if (gross <= 0) return { ...r, gross: null };
      return { ...r, gross, ...fromGross(r.qty ?? 0, gross, isCash ? cashTaxation === 'NON_TAXABLE' : r.taxFree) };
    }
    if (r.gross == null) return r;
    const unitPrice = r.gross;
    const supplyAmount = Math.round((r.qty ?? 0) * unitPrice);
    return { ...r, gross: null, unitPrice, supplyAmount, vatAmount: vatOf(supplyAmount, r.taxFree) };
  });
}

/** 부가세 포함으로 넣어 단가 × 수량이 공급가액과 나누어떨어지지 않는 줄 — 저장 단가는 원 단위로 반올림된다(2026-10-21) */
const unitPriceRounded = (r: Row, vatMode: VatMode) =>
  vatMode === 'IN' && (r.qty ?? 0) > 1 && (r.unitPrice ?? 0) * (r.qty ?? 0) !== (r.supplyAmount ?? 0);

/** 고객을 고르면 저절로 채우는 칸(지난 사업자 정보 · 고객 기본 정보) */
type AutoField = 'buyerName' | 'buyerBizNo' | 'buyerCeo' | 'buyerAddress' | 'buyerBizType' | 'buyerBizKind' | 'buyerEmail' | 'buyerPhone';
type AutoFilled = Partial<Record<AutoField, string>>;
const EMPTY_FIELDS: Record<AutoField, string> = {
  buyerName: '',
  buyerBizNo: '',
  buyerCeo: '',
  buyerAddress: '',
  buyerBizType: '',
  buyerBizKind: '',
  buyerEmail: '',
  buyerPhone: '',
};

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
  /** 예전 보관본에는 없다 */
  vatMode?: VatMode;
  rows: Row[];
  memo: string;
  /** 고객을 골라 저절로 채운 칸 — 다른 고객으로 바꿀 때 비운다(예전 보관본에는 없다) */
  autoFilled?: AutoFilled;
};

function readDraft(key = DRAFT_KEY): Draft | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && Array.isArray(d.rows) && (d.docType === 'TAX' || d.docType === 'CASH') ? d : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, d: Draft) {
  try {
    sessionStorage.setItem(key, JSON.stringify(d));
  } catch {
    // 저장소가 막혀 있으면 보관만 못 한다
  }
}

function removeDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // 저장소를 못 쓰면 보관본도 없다
  }
}

function clearDraft() {
  removeDraft(DRAFT_KEY);
}

const draftIsEmpty = (d: Draft) =>
  !d.customerId && !d.buyerName.trim() && !d.buyerBizNo.trim() && !d.cashIdentityNum.trim() && !d.memo.trim() && !d.rows.some(rowHasContent);

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
  // 단가 입력 방식 — 현금영수증은 받은 돈 그대로(부가세 포함), 세금계산서는 공급가액(부가세 별도)으로 시작한다(앱과 같다)
  const [vatMode, setVatMode] = useState<VatMode>(presetDocType === 'CASH' ? 'IN' : 'EX');
  const [rows, setRows] = useState<Row[]>(() => [newRow(undefined, 'r0')]);
  const [memo, setMemo] = useState('');
  const [itemsLoaded, setItemsLoaded] = useState<string | null>(null);
  // 이미 적은 품목이 있으면 견적 품목으로 바로 덮지 않고 묻는다. skipped = 뺀 0원 품목 수
  const [pendingEstimate, setPendingEstimate] = useState<{ rows: Row[]; estimateId: number | null; skipped: number } | null>(null);
  // 견적에서 가져올 때 뺀 0원 품목 수 — 품목 칸 위에 한 줄로 알린다
  const [skippedZero, setSkippedZero] = useState(0);
  // 단가 입력 방식을 바꿔 합계가 바뀌었을 때 한 줄 안내(2026-10-21)
  const [vatNotice, setVatNotice] = useState<string | null>(null);
  // 주소의 문서 종류 · 고객과 맞지 않아 따로 둔 보관본 — "이어 쓰기"로 꺼낸다
  const [otherDraft, setOtherDraft] = useState<Draft | null>(null);
  // 전자 발급한 문서는 고칠 수 없다 — 서버도 막지만 화면에서 먼저 닫는다
  const [providerLocked, setProviderLocked] = useState(false);
  // 예전 현금영수증 기록 — 용도 · 식별번호를 추정해 채웠다
  const [legacyInferred, setLegacyInferred] = useState(false);
  const [legacyConfirmed, setLegacyConfirmed] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftReady, setDraftReady] = useState(Boolean(editId));

  const inFlight = useRef(false);
  // 새 문서 저장 중복 방지 키 — 이 화면에서 처음 만든 값을 다시 저장할 때도 그대로 쓴다.
  // 응답이 끊겨 다시 저장해도 서버가 앞서 만든 문서를 돌려줘 같은 거래가 두 건이 되지 않는다(2026-10-16).
  const requestKey = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`,
  );
  const mounted = useRef(true);
  // 늦게 온 견적 품목이 이미 적은 품목을 덮지 않았는지 볼 때 쓴다
  const rowsRef = useRef<Row[]>(rows);
  // 견적에서 가져와 아직 손대지 않은 품목 — 다른 고객으로 바꾸면 비운다
  const autoRows = useRef<Row[] | null>(null);
  // 늦게 온 견적 품목의 날짜를 지금 작성일자로
  const issueDateRef = useRef(issueDate);
  // 고객을 골라 저절로 채운 칸 · 채우기 직전 칸 값(effect 안에서 최신 값을 읽으려고 둔다)
  const autoFilled = useRef<AutoFilled>({});
  const fieldsRef = useRef<Record<AutoField, string>>({ ...EMPTY_FIELDS });
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

  useEffect(() => {
    issueDateRef.current = issueDate;
  }, [issueDate]);

  // 아래 채우기 effect 보다 먼저 둔다 — 같은 그림에서 최신 칸 값을 먼저 적어 둔다
  useEffect(() => {
    fieldsRef.current = { buyerName, buyerBizNo, buyerCeo, buyerAddress, buyerBizType, buyerBizKind, buyerEmail, buyerPhone };
  }, [buyerName, buyerBizNo, buyerCeo, buyerAddress, buyerBizType, buyerBizKind, buyerEmail, buyerPhone]);

  const setAutoField = useCallback((key: AutoField, value: string) => {
    switch (key) {
      case 'buyerName':
        setBuyerName(value);
        break;
      case 'buyerBizNo':
        setBuyerBizNo(value);
        break;
      case 'buyerCeo':
        setBuyerCeo(value);
        break;
      case 'buyerAddress':
        setBuyerAddress(value);
        break;
      case 'buyerBizType':
        setBuyerBizType(value);
        break;
      case 'buyerBizKind':
        setBuyerBizKind(value);
        break;
      case 'buyerEmail':
        setBuyerEmail(value);
        break;
      case 'buyerPhone':
        setBuyerPhone(value);
        break;
    }
  }, []);

  /** 비어 있는 칸만 채우고, 채운 값을 적어 둔다(다른 고객으로 바꿀 때 비우려고) */
  const fillEmpty = useCallback(
    (key: AutoField, value: string | null | undefined) => {
      const v = (value ?? '').trim();
      if (!v || fieldsRef.current[key].trim()) return;
      fieldsRef.current = { ...fieldsRef.current, [key]: v };
      autoFilled.current = { ...autoFilled.current, [key]: v };
      setAutoField(key, v);
    },
    [setAutoField],
  );

  /** 앞 고객이 채운 칸 중 사장님이 고치지 않은 칸을 비운다 */
  const clearAutoFilled = useCallback(() => {
    const filled = autoFilled.current;
    autoFilled.current = {};
    (Object.keys(filled) as AutoField[]).forEach((key) => {
      if (fieldsRef.current[key] !== filled[key]) return;
      fieldsRef.current = { ...fieldsRef.current, [key]: '' };
      setAutoField(key, '');
    });
  }, [setAutoField]);

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

  /** 보관본을 칸에 넣는다 — 처음 열 때 · '이어 쓰기' */
  const applyDraft = useCallback((d: Draft) => {
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
    setVatMode(d.vatMode === 'IN' || d.vatMode === 'EX' ? d.vatMode : 'EX');
    setRows(d.rows.length ? d.rows.map((r) => newRow({ ...r })) : [newRow({ date: d.issueDate || todayIso() })]);
    setMemo(d.memo);
    // 되살린 품목을 견적 품목으로 덮지 않게
    setItemsLoaded(d.customerId || null);
    setPendingEstimate(null);
    setSkippedZero(0);
    setVatNotice(null);
    autoRows.current = null;
    autoFilled.current = { ...(d.autoFilled ?? {}) };
    setDraftRestored(true);
  }, []);

  /** 빈 양식 — 주소의 문서 종류 · 고객으로(보관본은 건드리지 않는다) */
  const applyBlank = useCallback(() => {
    const today = todayIso();
    setDocType(presetDocType);
    setPayType(presetDocType === 'CASH' ? 'RECEIPT' : 'CLAIM');
    setPayTypeTouched(false);
    setCustomerId(presetCustomerId ?? '');
    setEstimateId(null);
    setIssueDate(today);
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
    setVatMode(presetDocType === 'CASH' ? 'IN' : 'EX');
    setRows([newRow({ date: today })]);
    setMemo('');
    setItemsLoaded(null);
    setPendingEstimate(null);
    setSkippedZero(0);
    setVatNotice(null);
    autoRows.current = null;
    autoFilled.current = {};
    setDraftRestored(false);
  }, [presetDocType, presetCustomerId]);

  // 새 문서 — 이 탭에 보관해 둔 작성본을 되살린다.
  // 주소의 문서 종류(?docType=CASH 등) · 고객과 맞는 보관본만 되살리고, 맞지 않는 보관본은 지우지 않고 따로 두어
  // 위에 "작성 중이던 세금계산서가 있어요 — 이어 쓰기"로 알린다(2026-10-21 — 현금영수증 작성을 눌러도 세금계산서 보관본이 열렸다).
  useEffect(() => {
    if (editId) return;
    const main = readDraft(DRAFT_KEY);
    const parked = readDraft(PARKED_DRAFT_KEY);
    const fits = (d: Draft) => d.docType === presetDocType && (!presetCustomerId || presetCustomerId === d.customerId);
    let other: Draft | null;
    if (main && fits(main)) {
      applyDraft(main);
      other = parked;
    } else if (parked && fits(parked)) {
      applyDraft(parked);
      other = main;
    } else {
      applyBlank();
      other = main ?? parked;
    }
    // 지금 칸(DRAFT_KEY)은 이 화면의 작성본이 쓴다 — 맞지 않는 보관본은 따로 둔 칸으로 옮겨 지킨다
    if (other) writeDraft(PARKED_DRAFT_KEY, other);
    else removeDraft(PARKED_DRAFT_KEY);
    setOtherDraft(other);
    setDraftReady(true);
  }, [editId, presetCustomerId, presetDocType, applyDraft, applyBlank]);

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
          // 저장된 단가는 공급가액 기준이라 '부가세 별도'로 보여 준다. 저장된 금액은 수량 · 단가를 고치기 전까지 그대로다
          setVatMode('EX');
          // 날짜가 없는 품목은 작성일자로(2026-10-21 — 예전엔 오늘 날짜가 들어가 작성일자와 달이 어긋날 수 있었다)
          const docDate = d.issueDate ?? todayIso();
          setRows(
            items.length > 0
              // 세액 0원이 과세로도 맞는 소액(공급가 9원 이하)은 면세로 짐작하지 않는다(2026-10-16)
              ? items.map((it) =>
                  newRow({ ...it, date: it.date || docDate, fixed: true, taxFree: (it.vatAmount ?? 0) === 0 && !isValidVat(it.supplyAmount ?? 0, 0) }),
                )
              : [
                  newRow({
                    supplyAmount: d.supplyAmount,
                    vatAmount: d.vatAmount,
                    name: d.itemSummary ?? '',
                    date: docDate,
                    fixed: true,
                    taxFree: d.vatAmount === 0 && !isValidVat(d.supplyAmount, 0),
                  }),
                ],
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

  // 고객 선택 → 견적 품목 · 지난 사업자 정보(프리필). 이미 읽은 고객이면 건너뛴다
  // 프리필을 먼저 비어 있는 칸에 넣는다 — 예전엔 고객 기본 정보(이름 · 주소)가 먼저 들어가 프리필 상호 · 주소가 못 들어갔다(2026-10-21)
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
          // 0원 품목(단가 · 공급가액 · 세액 모두 0)은 뺀다 — 모두 0원이면 빼지 않는다
          const nonZero = itemsRes.data.filter((it) => !isZeroEstimateItem(it));
          const picked = nonZero.length > 0 ? nonZero : itemsRes.data;
          const skipped = itemsRes.data.length - picked.length;
          const next = picked.map((it) => fromEstimateItem(it, issueDateRef.current || todayIso()));
          const nextEstimateId = itemsRes.data[0].estimateId ?? null;
          if (rowsRef.current.some(rowHasContent)) {
            setPendingEstimate({ rows: next, estimateId: nextEstimateId, skipped });
          } else {
            autoRows.current = next;
            setRows(next);
            setEstimateId(nextEstimateId);
            setSkippedZero(skipped);
            toast.success(`견적 품목 ${next.length}건을 불러왔습니다.${skipped > 0 ? ` 0원 품목 ${skipped}건은 뺐습니다.` : ''}`);
          }
        }
        const p = prefillRes.success !== false ? prefillRes.data : null;
        if (p) {
          fillEmpty('buyerName', p.buyerName);
          fillEmpty('buyerBizNo', p.buyerBizNo ? maskBizNo(p.buyerBizNo) : '');
          fillEmpty('buyerCeo', p.buyerCeo);
          fillEmpty('buyerAddress', p.buyerAddress);
          fillEmpty('buyerBizType', p.buyerBizType);
          fillEmpty('buyerBizKind', p.buyerBizKind);
          fillEmpty('buyerEmail', p.buyerEmail);
          fillEmpty('buyerPhone', p.buyerPhone);
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
  }, [customerId, itemsLoaded, draftReady, fillEmpty]);

  // 고객 기본 정보(이름 · 전화 · 주소) — 프리필을 읽은 뒤 남은 빈 칸만 채운다.
  // 이미 값이 있으면(프리필 · 보관본 · 수정 모드 · 직접 입력) 덮어쓰지 않는다
  useEffect(() => {
    if (!customerId || itemsLoaded !== customerId) return;
    const customer = customers.find((c) => String(c.id) === customerId);
    if (!customer) return;
    fillEmpty('buyerName', customer.name);
    fillEmpty('buyerPhone', customer.phone);
    fillEmpty('buyerAddress', [customer.address1, customer.address2].filter(Boolean).join(' '));
  }, [customerId, customers, itemsLoaded, fillEmpty]);

  // 지금 칸 값 그대로의 작성본
  const currentDraft = useMemo<Draft>(
    () => ({
      docType, payType, payTypeTouched, customerId, estimateId, issueDate, buyerName, buyerBizNo, buyerCeo, buyerAddress,
      buyerBizType, buyerBizKind, buyerEmail, buyerPhone, cashUsage, cashIdentityType, cashIdentityNum, cashTaxation, vatMode, rows, memo,
    }),
    [
      docType, payType, payTypeTouched, customerId, estimateId, issueDate, buyerName, buyerBizNo, buyerCeo, buyerAddress,
      buyerBizType, buyerBizKind, buyerEmail, buyerPhone, cashUsage, cashIdentityType, cashIdentityNum, cashTaxation, vatMode, rows, memo,
    ],
  );

  // 새 문서 작성본 보관 — 입력이 바뀔 때마다
  useEffect(() => {
    if (editId || !draftReady) return;
    if (draftIsEmpty(currentDraft)) removeDraft(DRAFT_KEY);
    else writeDraft(DRAFT_KEY, { ...currentDraft, autoFilled: autoFilled.current });
  }, [editId, draftReady, currentDraft]);

  const isCash = docType === 'CASH';
  // 이 문서 종류의 전자 발급이 열렸는지 — '작성부터 발급까지' 3단계 문장을 고른다(현금영수증은 따로 연다)
  const issuanceOpenForDoc = useIssuanceOpenFor(docType);
  const effectiveRows = useMemo(() => effectiveRowsOf(rows, isCash, cashTaxation, vatMode), [isCash, rows, cashTaxation, vatMode]);
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

  /** 품목 한 줄 고치기 — [price] 는 칸에 넣은 단가(입력 방식에 따라 부가세 별도 · 포함) */
  const updateRow = (key: string, patch: Partial<Row> & { price?: number }) => {
    setVatNotice(null);
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const { price, ...rest } = patch;
        const next: Row = { ...r, ...rest };
        const amountTouched = 'qty' in patch || price !== undefined;
        // 수량 · 단가를 고치면 더는 가져온 금액이 아니다
        if (amountTouched) next.fixed = false;
        if (vatMode === 'IN' && (amountTouched || ('taxFree' in patch && r.gross != null && !r.fixed))) {
          // 부가세 포함 — 수량 × 포함 단가(받을 돈)를 공급가액 · 세액으로 나눈다. 가져온 금액을 고치면 그 금액의 포함 단가에서 이어 간다
          const gross = price ?? grossOf(r);
          const noVat = isCash ? cashTaxation === 'NON_TAXABLE' : next.taxFree;
          return { ...next, gross, ...fromGross(next.qty ?? 0, gross, noVat) };
        }
        if (price !== undefined) {
          next.unitPrice = price;
          next.gross = null;
        }
        // 수량 · 단가를 바꿨을 때만 공급가액을 다시 계산한다 — 견적에서 온 고정 공급가액을 면세 전환만으로 바꾸지 않는다
        if (amountTouched) next.supplyAmount = Math.round((next.qty ?? 0) * (next.unitPrice ?? 0));
        if (amountTouched || 'taxFree' in patch) next.vatAmount = vatOf(next.supplyAmount ?? 0, next.taxFree);
        return next;
      }),
    );
  };

  /**
   * 단가 입력 방식 바꾸기(규칙은 rowsForVatMode). 넣은 숫자는 그대로이고 뜻만 바뀌어 합계가 달라질 수 있어
   * 바뀐 합계를 한 줄로 알린다(2026-10-21 — 3 × 600,000 별도 1,980,000 → 포함으로 바꾸면 조용히 1,800,000 이 됐다).
   */
  const changeVatMode = (mode: VatMode) => {
    if (mode === vatMode) return;
    const next = rowsForVatMode(rows, mode, isCash, cashTaxation);
    const before = totalOf(effectiveRowsOf(rows, isCash, cashTaxation, vatMode));
    const after = totalOf(effectiveRowsOf(next, isCash, cashTaxation, mode));
    if (autoRows.current === rows) autoRows.current = next;
    setVatMode(mode);
    setRows(next);
    setVatNotice(before !== after ? `합계가 ${fmt(before)}원 → ${fmt(after)}원으로 바뀌었습니다.` : null);
  };

  /**
   * 작성일자 바꾸기 — 품목 날짜는 작성일자를 따른다(2026-10-21, 서버도 막는다).
   * 작성일자와 같던 품목 날짜는 함께 옮기고, 작성일자와 다른 달인 품목 날짜는 작성일자로 맞춘다.
   */
  const changeIssueDate = (next: string) => {
    const prev = issueDate;
    setIssueDate(next);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return;
    const moved = rows.map((r) => (r.date === prev || !sameMonth(r.date, next) ? { ...r, date: next } : r));
    if (autoRows.current === rows) autoRows.current = moved;
    setRows(moved);
  };

  /** 고객 바꾸기 — 앞 고객이 채운 칸 · 앞 고객 견적에서 가져와 손대지 않은 품목은 비우고 새 고객 것을 읽는다 */
  const changeCustomer = (next: string) => {
    clearAutoFilled();
    if (autoRows.current && autoRows.current === rowsRef.current) setRows([newRow({ date: issueDate || todayIso() })]);
    autoRows.current = null;
    setEstimateId(null);
    setSkippedZero(0);
    setCustomerId(next);
    setItemsLoaded(null);
    setPendingEstimate(null);
  };

  /** 따로 둔 보관본 이어 쓰기 — 지금 적던 내용이 있으면 그 자리에 바꿔 둔다(어느 쪽도 지우지 않는다) */
  const resumeOtherDraft = () => {
    if (!otherDraft) return;
    const current: Draft = { ...currentDraft, autoFilled: autoFilled.current };
    applyDraft(otherDraft);
    if (draftIsEmpty(current)) {
      removeDraft(PARKED_DRAFT_KEY);
      setOtherDraft(null);
    } else {
      const parked = current;
      writeDraft(PARKED_DRAFT_KEY, parked);
      setOtherDraft(parked);
    }
    setShowErrors(false);
    setServerError(null);
    setServerFieldError(null);
  };

  const discardOtherDraft = () => {
    removeDraft(PARKED_DRAFT_KEY);
    setOtherDraft(null);
  };

  // 품목을 더하면 새 줄의 품목 칸으로 바로 옮긴다. 새 품목 날짜는 작성일자
  const focusRowKey = useRef<string | null>(null);
  const addRow = () => {
    const r = newRow({ date: issueDate || todayIso() });
    focusRowKey.current = r.key;
    setRows((rs) => [...rs, r]);
  };
  useEffect(() => {
    const k = focusRowKey.current;
    if (!k) return;
    focusRowKey.current = null;
    focusTarget(`row-name-${k}`);
  }, [rows]);

  const changeDocType = (next: TaxInvoiceDocType) => {
    setDocType(next);
    setServerFieldError(null);
    // 아직 금액을 넣지 않았으면 문서 종류의 기본 입력 방식으로(넣은 금액이 몰래 바뀌지 않게)
    if (rows.every((r) => !r.fixed && !(r.unitPrice ?? 0) && !(r.gross ?? 0))) setVatMode(next === 'CASH' ? 'IN' : 'EX');
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

  // 새로 작성 — 지금 보관본만 지운다(따로 둔 보관본은 남는다)
  const resetForm = () => {
    clearDraft();
    applyBlank();
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
        items: contentRows.map(({ key: _k, taxFree: _t, gross: _g, fixed: _f, ...rest }) => ({
          ...rest,
          // 품목 날짜는 작성일자와 같은 달로 — 예전 보관본 · 견적 날짜가 다른 달이면 작성일자로(서버도 막는다)
          date: sameMonth(rest.date, issueDate) ? rest.date : issueDate,
          name: (rest.name ?? '').trim(),
          spec: (rest.spec ?? '').trim() || null,
        })),
        memo: memo.trim() || null,
        cashUsage: isCash ? cashUsage : null,
        cashIdentityType: isCash ? cashIdentityType : null,
        cashIdentityNum: identityNum,
        cashTaxationType: isCash ? cashTaxation : null,
        ...(editId ? {} : { clientRequestKey: requestKey.current }),
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
  // 수정 화면 머리 제목 — 문서를 읽으면 '세금계산서 수정' · '현금영수증 수정'(2026-10-21 — 예전엔 수정인데도 '작성')
  useBossHeaderTitle(editId && !loadingEdit && !loadError ? `${DOC_TYPE_LABEL[docType]} 수정` : null, '저장한 내용을 고칩니다. 저장은 발급이 아닙니다.');
  // 저장 단축키 표시 — 서버 그림과 맞추려고 그린 뒤 정한다
  const [hotkeyLabel, setHotkeyLabel] = useState<string | null>(null);
  useEffect(() => {
    setHotkeyLabel(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘ Enter' : 'Ctrl + Enter');
  }, []);

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

  // 확인할 것(누르면 그 칸으로) — 넓은 화면은 오른쪽, 휴대폰 · 태블릿은 저장 단추 바로 위(2026-10-21 — 저장 단추 아래에 있어 지나쳐야 보였다)
  const checklist = (className: string) => (
    <Panel className={className} kicker="확인할 것" title={problems.length === 0 ? '저장할 수 있습니다' : `${problems.length}항목`}>
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
                className={`boss-touch-link text-left text-[12.5px] leading-snug hover:underline ${showErrors ? 'text-boss-error' : 'text-boss-text-secondary'}`}
                onClick={() => focusTarget(p.target)}
              >
                · {p.message}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  return (
    <div className="boss-touch boss-tax grid max-w-[1180px] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
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
        {otherDraft && !editId && (
          <AlertBanner
            tone="info"
            action={
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={resumeOtherDraft}>
                  이어 쓰기
                </Button>
                <Button variant="secondary" size="sm" onClick={discardOtherDraft}>
                  버리기
                </Button>
              </div>
            }
          >
            작성 중이던 {DOC_TYPE_LABEL[otherDraft.docType]}
            {otherDraft.buyerName.trim() ? `(${otherDraft.buyerName.trim()})` : ''}
            {otherDraft.docType === 'CASH' ? '이' : '가'} 있어요. 이어 쓰려면 이어 쓰기를 누르세요.
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
                  onChange={(e) => changeCustomer(e.target.value)}
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
                  고르면 그 고객의 견적 품목과 이전에 받아 둔 사업자 정보를 채웁니다. 이미 적은 칸은 덮어쓰지 않고, 다른 고객으로 바꾸면 앞 고객 정보는 지웁니다.
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
              <Button variant="secondary" size="sm" icon={Plus} onClick={addRow} className="hidden md:inline-flex">
                품목 추가
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
                          // 기다리는 동안 작성일자를 바꿨을 수 있다 — 품목 날짜는 지금 작성일자로
                          const next = pendingEstimate.rows.map((r) => ({ ...r, date: issueDate || todayIso() }));
                          autoRows.current = next;
                          setRows(next);
                          setEstimateId(pendingEstimate.estimateId);
                          setSkippedZero(pendingEstimate.skipped);
                          setVatNotice(null);
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
                  이 고객의 견적 품목 {pendingEstimate.rows.length}건이 있습니다
                  {pendingEstimate.skipped > 0 ? `(0원 품목 ${pendingEstimate.skipped}건은 뺐습니다)` : ''}. 이미 적은 품목을 바꿀까요?
                </AlertBanner>
              </div>
            )}
            {skippedZero > 0 && (
              <p role="status" className="mb-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
                견적의 0원 품목 {skippedZero}건은 뺐습니다.
              </p>
            )}
            {fieldError('items') && (
              <p className={`mb-2 text-[12.5px] ${errClass('items')}`} role="alert">
                {fieldError('items')}
              </p>
            )}
            {/* 단가 입력 방식 · 과세 구분 — 받기로 한 금액(부가세 포함)을 계산 없이 그대로 넣을 수 있게(2026-10-17) */}
            <div className="mb-3 flex flex-col gap-3 border border-boss-border bg-boss-bg px-3 py-3 md:flex-row md:flex-wrap md:items-start md:gap-x-6">
              <div>
                <FieldLabel>단가 입력</FieldLabel>
                <Segmented
                  ariaLabel="단가 입력 방식"
                  value={vatMode}
                  onChange={changeVatMode}
                  options={[
                    { key: 'EX', label: '부가세 별도' },
                    { key: 'IN', label: '부가세 포함' },
                  ]}
                />
                <p id="vat-mode-hint" className="mt-1.5 max-w-[440px] text-[12.5px] leading-relaxed text-boss-text-secondary">
                  {vatMode === 'IN'
                    ? '받을 금액(부가세 포함)을 단가에 넣으면 공급가액과 세액으로 나눠 드립니다.'
                    : '부가세를 뺀 금액을 단가에 넣으면 세액(10%)을 더해 드립니다.'}
                </p>
                {vatNotice && (
                  <p role="status" className="mt-1 max-w-[440px] text-[12.5px] font-semibold leading-relaxed text-boss-pill-warn-fg">
                    {vatNotice}
                  </p>
                )}
              </div>
              {isCash && (
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
                  <p className="mt-1.5 max-w-[440px] text-[12.5px] leading-relaxed text-boss-text-secondary">
                    현금영수증 한 장은 과세나 비과세 하나로만 씁니다. 비과세는 세액이 0원입니다.
                  </p>
                </div>
              )}
            </div>
            {/* 넓은 화면은 표, 휴대폰은 품목마다 카드(boss-table-stack) — 칸은 하나만 그려 id 가 겹치지 않는다.
                relative: 숨긴 읽기 도우미 글자가 바깥 카드 기준으로 자리를 잡아 휴대폰 화면을 옆으로 넓히던 문제(2026-10-17) */}
            <div className="boss-scroll relative overflow-x-auto">
              <table className="boss-table boss-table-stack">
                <thead>
                  <tr>
                    <th>품목</th>
                    <th>규격</th>
                    <th className="num">수량</th>
                    <th className="num">{vatMode === 'IN' ? '단가 (부가세 포함)' : '단가 (부가세 별도)'}</th>
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
                      <td className="stack-name md:min-w-[150px]" data-label={effectiveRows.length > 1 ? `품목 ${i + 1}` : '품목'}>
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
                      <td className="stack-spec md:min-w-[104px]" data-label="규격 (선택)">
                        <input
                          className="boss-input"
                          value={r.spec ?? ''}
                          onChange={(e) => updateRow(r.key, { spec: e.target.value })}
                          placeholder="84㎡ 실크"
                          aria-label={`${i + 1}번 규격`}
                          maxLength={50}
                        />
                      </td>
                      <td className="stack-qty md:w-[76px] md:min-w-[68px]" data-label="수량">
                        <AmountInput
                          id={`row-qty-${r.key}`}
                          className="boss-input text-right tabular-nums"
                          value={r.qty ?? 0}
                          onValue={(n) => updateRow(r.key, { qty: n })}
                          aria-label={`${i + 1}번 수량`}
                        />
                      </td>
                      <td className="stack-price md:w-[136px] md:min-w-[124px]" data-label={vatMode === 'IN' ? '단가 (부가세 포함)' : '단가 (부가세 별도)'}>
                        <AmountInput
                          id={`row-price-${r.key}`}
                          className="boss-input text-right tabular-nums"
                          value={vatMode === 'IN' ? grossOf(r) : (r.unitPrice ?? 0)}
                          onValue={(n) => updateRow(r.key, { price: n })}
                          emptyWhenZero
                          placeholder="0"
                          aria-label={`${i + 1}번 단가 (${vatMode === 'IN' ? '부가세 포함' : '부가세 별도'})`}
                          aria-describedby="vat-mode-hint"
                        />
                        {/* 휴대폰 카드 — 품목 바로 아래. 넓은 화면은 표 아래 한 줄로 모아 쓴다 */}
                        {unitPriceRounded(r, vatMode) && (
                          <p className="mt-1 text-[12px] leading-snug text-boss-text-secondary md:hidden">단가는 원 단위로 반올림해 적힙니다.</p>
                        )}
                      </td>
                      <td className="stack-supply num text-boss-text" data-label="공급가액">
                        {fmt(r.supplyAmount)}
                      </td>
                      <td className="stack-vat num text-boss-text-secondary" data-label="세액">
                        {fmt(r.vatAmount)}
                      </td>
                      {!isCash && (
                        <td className="stack-free">
                          <CheckLine checked={r.taxFree} onChange={(v) => updateRow(r.key, { taxFree: v })}>
                            <span className="md:sr-only">면세</span>
                            <span className="sr-only">{i + 1}번 면세</span>
                          </CheckLine>
                        </td>
                      )}
                      <td className="stack-del text-right">
                        <button
                          type="button"
                          className="boss-btn boss-btn-sm boss-btn-ghost !text-boss-text-muted hover:!text-boss-error"
                          onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
                          aria-label={`${i + 1}번 행 삭제`}
                          disabled={rows.length <= 1}
                        >
                          <Trash2 size={13} />
                          <span className="md:hidden">삭제</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 부가세 포함 + 수량 여러 개 — 서식의 단가 × 수량이 공급가액과 1원 다를 수 있다(2026-10-21) */}
              {effectiveRows.some((r) => unitPriceRounded(r, vatMode)) && (
                <p className="mt-2 hidden text-[12px] leading-relaxed text-boss-text-secondary md:block">
                  {effectiveRows
                    .map((r, i) => (unitPriceRounded(r, vatMode) ? `${i + 1}번` : null))
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  품목: 단가는 원 단위로 반올림해 적힙니다(서식의 단가 × 수량이 공급가액과 1원 다를 수 있어요).
                </p>
              )}
              {/* 면세 거래는 세금계산서가 아니라 계산서 대상 — 저장 · 서식은 되지만 전자 발급은 막힌다(2026-10-16) */}
              {!isCash && rows.some((r) => r.taxFree && rowHasContent(r)) && (
                <p role="note" className="mt-2 text-[12.5px] leading-relaxed text-boss-error">
                  면세 품목이 있어 세금계산서 전자 발급을 할 수 없습니다. 면세 거래는 세금계산서가 아니라 계산서로 발급해야 합니다.
                </p>
              )}
            </div>
            <Button variant="secondary" icon={Plus} onClick={addRow} className="mt-3 min-h-[44px] w-full md:hidden">
              품목 추가
            </Button>
            {/* 휴대폰은 세로 줄(왼쪽 이름 · 오른쪽 금액) — 세 칸이면 1억 원대 끝자리가 가려졌다(2026-10-21) */}
            <div className="mt-4">
              <AmountBoxes
                rowsOnPhone
                columns="sm:grid-cols-3"
                items={[
                  { label: '공급가액', value: `${fmt(totals.supply)}원` },
                  { label: isCash ? `부가세 · ${CASH_TAXATION_LABEL[cashTaxation]}` : '세액 (10%)', value: `${fmt(totals.vat)}원` },
                  { label: '합계', value: `${fmt(totals.total)}원` },
                ]}
              />
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
                onChange={(e) => changeIssueDate(e.target.value)}
                aria-invalid={Boolean(fieldError('issueDate'))}
                hint={
                  fieldError('issueDate') ? (
                    <span className="text-boss-error">{fieldError('issueDate')}</span>
                  ) : isCash ? (
                    issueDate && issueDate !== todayIso() ? (
                      <span className="text-boss-pill-warn-fg">
                        오늘({todayIso()})이 아닌 날짜라 전자 발급은 할 수 없고 기록으로만 저장됩니다.
                      </span>
                    ) : (
                      `전자 발급은 거래일자가 오늘(${todayIso()})인 문서만 됩니다. 지난 날짜는 기록으로만 저장됩니다.`
                    )
                  ) : (
                    '공급 시기와 작성일자를 확인해 주세요. 품목 날짜는 작성일자를 따릅니다.'
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

        {checklist('lg:hidden')}

        {/* ── 하단 액션 ── */}
        <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-[12.5px] text-boss-text-secondary" aria-live="polite">
            {providerLocked
              ? '전자 발급 · 취소를 시도한 문서라 저장할 수 없습니다.'
              : saving
                ? '저장 중입니다…'
                : showErrors && problems.length > 0
                  ? `고칠 항목 ${problems.length}개`
                  : '저장하면 미발급(작성 완료) 문서로 보관됩니다. 발급은 상세에서 따로 합니다.'}
            {/* 단축키는 자판이 있는 넓은 화면에서만 — 맥은 ⌘, 그 밖은 Ctrl */}
            {hotkeyLabel && (
              <kbd className="ml-2 hidden border border-boss-border px-1 font-boss-head text-[11px] md:inline">{hotkeyLabel}</kbd>
            )}
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
        {checklist('hidden lg:block')}
        <Panel kicker="순서" title="작성부터 발급까지">
          <ol className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
            <li>
              <span className="font-semibold text-boss-text">1. 작성 · 저장</span> — 미발급(작성 완료) 문서로 보관됩니다.
            </li>
            <li>
              <span className="font-semibold text-boss-text">2. 미리보기 · PDF</span> — 실물 서식으로 확인하고 인쇄 · PDF로 보냅니다.
            </li>
            {/* 문서 종류별 오픈 값을 따른다(2026-10-21 — 오픈 전에도 '상세에서 전자 발급'이라고 써서 상세의 '곧 오픈'과 맞지 않았다) */}
            <li>
              <span className="font-semibold text-boss-text">3. 발급</span> —{' '}
              {issuanceOpenForDoc
                ? '상세 화면에서 전자 발급합니다. 홈택스에서 직접 발급했다면 상세에서 승인번호를 적어 둡니다.'
                : '지금은 홈택스에서 발급한 뒤 상세에서 승인번호를 적어 둡니다 — 전자 발급은 곧 열립니다.'}
            </li>
          </ol>
        </Panel>
        <Panel kicker="참고" title="금액 계산">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            &lsquo;부가세 별도&rsquo;는 단가에 세액(10%)을 더하고, &lsquo;부가세 포함&rsquo;은 넣은 금액을 공급가액과 세액으로 나눕니다.
            {!isCash && ' 면세 품목은 세액이 0원입니다.'} 견적에서 불러온 금액은 수량 · 단가를 고칠 때만 다시 계산합니다.
            {isCash && ` 현금영수증은 한 건에 ${fmt(CASH_MAX_TOTAL)}원까지입니다.`}
          </p>
        </Panel>
      </div>
    </div>
  );
}
