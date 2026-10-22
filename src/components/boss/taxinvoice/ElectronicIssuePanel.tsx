'use client';

// 전자 발급(팝빌) — 세금계산서 · 현금영수증 상세 우측 패널 + 미리보기 · 최종 확인 · 현금영수증 취소 대화상자
//
// 발급 전: 설정 확인(GET config?docType=) → 미리보기(외부 전송 없음) → 네 가지 확인 → 발급
// 발급 후(대행사 관리 문서): 발급 · 국세청 전송 상태와 "상태 다시 확인"만. 정식 오픈 후에는
//   현금영수증 → 전액 취소(POST /electronic/cancel, 현금영수증 전용)
//   세금계산서 원본 → 세금계산서 취소(TaxCancelSection: 전송 전 발행취소 · 전송 후 전액 취소용 수정세금계산서)
//   수정세금계산서(취소분) → 상태 확인만(수정 · 삭제 · 다시 발급 · 다시 취소 없음)
//
// 중복 방지: 발급 · 취소 요청은 한 번만 보낸다(진행 중 잠금 + 시도 후 상세를 다시 읽을 때까지 잠금).
// 실패 · 불명이어도 자동으로 다시 보내지 않는다. 결과를 모르면 "상태 다시 확인"(같은 문서 키로 조회)만 연다.
// 정식 오픈 여부(서버가 정한다, useElectronicTaxInvoiceOpen)가 꺼져 있으면 설정 조회 · 발급 · 취소 대신 오픈 예정 안내를 보인다.

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Ban, ExternalLink, FileCheck2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { TAX_SUBSCRIPTION_FREE_USES, TAX_SUBSCRIPTION_PRICE, TAX_SUBSCRIPTION_WHERE } from '@/lib/boss/taxInvoiceSubscription';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { useIssuanceOpenFor } from '@/lib/boss/electronicTaxInvoiceLaunch';
import ElectronicLaunchNotice from './ElectronicLaunchNotice';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import { cashFieldsOf, cashIdentityError, cashVatMismatch, formatCashIdentity } from '@/lib/boss/taxInvoiceCash';
import {
  cashIdentityLine,
  cashIssuableToday,
  cashItemNameOf,
  cashTaxationOf,
  correctionReasonText,
  displayState,
  isoDateOf,
  kstToday,
  originIssueDateText,
} from '@/lib/boss/taxInvoiceDocument';
import { TaxCancelSection } from './TaxCancelSection';
import {
  CASH_CANCEL_REASON_LABEL,
  CASH_MAX_TOTAL,
  CASH_TAXATION_LABEL,
  CASH_USAGE_LONG_LABEL,
  DOC_TYPE_LABEL,
  NTS_STATUS_LABEL,
  PAY_TYPE_LABEL,
  PROVIDER_CANCEL_STATUS_LABEL,
  PROVIDER_STATUS_LABEL,
  isProviderManaged,
  isTaxCorrection,
  type CashCancelReason,
  type ElectronicConfig,
  type ElectronicPreview,
  type ProviderCancelStatus,
  type TaxInvoice,
  type TaxInvoiceNtsStatus,
  type TaxInvoiceProviderStatus,
  type TaxInvoiceSupplier,
} from '@/types/boss-taxinvoice';
import {
  AlertBanner,
  Button,
  ButtonLink,
  CheckLine,
  DataTable,
  DescRow,
  Panel,
  RadioOption,
  Skeleton,
  Tag,
  type StatusTone,
} from '@/components/boss/ui';

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');

export const PROVIDER_STATUS_TONE: Record<TaxInvoiceProviderStatus, StatusTone> = {
  PROCESSING: 'info',
  ISSUED: 'ok',
  UNKNOWN: 'warn',
  FAILED: 'bad',
};

export const NTS_STATUS_TONE: Record<TaxInvoiceNtsStatus, StatusTone> = {
  PENDING: 'info',
  SENT: 'ok',
  FAILED: 'bad',
};

export const CANCEL_STATUS_TONE: Record<ProviderCancelStatus, StatusTone> = {
  PROCESSING: 'info',
  UNKNOWN: 'warn',
  CANCELED: 'neutral',
};

/** 서버가 준 외부 주소는 https 만 연다 (javascript: 등 차단) */
export function safeHttpsUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * 팝업 차단을 피하려고 클릭 순간 빈 창을 먼저 열고, 주소를 받은 뒤 옮긴다.
 * 창을 못 열었으면 false — 호출한 쪽이 링크로 대신 보여 준다.
 */
export async function openExternal(fetchUrl: () => Promise<string | null>): Promise<{ opened: boolean; url: string | null }> {
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  const url = await fetchUrl();
  if (!url) {
    win?.close();
    return { opened: false, url: null };
  }
  if (win) {
    win.opener = null;
    win.location.href = url;
    return { opened: true, url };
  }
  return { opened: false, url };
}

/** 시험 · 실제 환경 표시 — 시험 발급은 효력이 없다 */
export function TestTag({ isTest }: { isTest?: boolean | null }) {
  if (isTest) return <Tag tone="warn">시험 발급 · 효력 없음</Tag>;
  return null;
}

const NtsValue = ({ nts }: { nts?: TaxInvoiceNtsStatus | null }) =>
  nts ? <Tag tone={NTS_STATUS_TONE[nts]}>{NTS_STATUS_LABEL[nts]}</Tag> : <span className="text-boss-text-muted">확인 전</span>;

/** 현금영수증 발급 전 화면에서 미리 막을 것 — 서버 미리보기도 막지만 이유를 먼저 보여 준다 */
function cashPreflightIssues(inv: TaxInvoice): string[] {
  if (inv.docType !== 'CASH') return [];
  const issues: string[] = [];
  const c = cashFieldsOf(inv);
  if (c.inferred || c.taxation == null) {
    issues.push('예전 기록이라 용도 · 식별번호 · 과세 구분이 저장돼 있지 않습니다. 수정 화면에서 확인 후 저장하세요.');
  } else {
    const err = cashIdentityError(c.usage, c.identityType, c.identityNum);
    if (err) issues.push(err);
    const bad = cashVatMismatch(inv.items ?? [], c.taxation);
    if (bad != null) issues.push(`${bad}번 품목 세액이 과세 구분(${CASH_TAXATION_LABEL[c.taxation]})과 맞지 않습니다. 수정 화면에서 다시 저장하세요.`);
  }
  if (inv.payType !== 'RECEIPT') issues.push('현금영수증은 받은 대금만 발급할 수 있습니다. 대금을 받은 뒤 수정 화면에서 영수로 바꾸세요.');
  if (!cashIssuableToday(inv)) {
    issues.push(
      `현금영수증은 거래일자가 오늘(한국시간 ${kstToday()})인 문서만 발급할 수 있습니다. 지난 날짜 문서는 기록으로만 보관됩니다(날짜를 몰래 오늘로 바꿔 발급하지 않습니다).`,
    );
  }
  if (inv.totalAmount > CASH_MAX_TOTAL) issues.push(`현금영수증 합계는 ${fmt(CASH_MAX_TOTAL)}원을 넘을 수 없습니다.`);
  return issues;
}

export default function ElectronicIssuePanel({
  invoice,
  onUpdated,
  reload,
}: {
  invoice: TaxInvoice;
  /** sync · 취소 결과 등 서버가 돌려준 최신 문서 */
  onUpdated: (inv: TaxInvoice) => void;
  /** 상세를 다시 읽는다. 읽지 못하면 null */
  reload: () => Promise<TaxInvoice | null>;
}) {
  // 이 문서를 지금 전자로 발급할 수 있는지 — 현금영수증은 따로 연다(2026-10-21)
  const issuanceOpen = useIssuanceOpenFor(invoice.docType);
  // 대행사가 관리하는 문서는 상태 확인(현금영수증은 취소 포함)만 — 출시 값과 상관없이 먼저 보여 준다
  if (isProviderManaged(invoice)) {
    return <ProviderStatusPanel invoice={invoice} onUpdated={onUpdated} reload={reload} />;
  }
  // 오픈 전에는 설정 API 호출과 발급 · 인증서 등록 대신 안내를 보여 준다
  if (!issuanceOpen) return <ElectronicLaunchNotice docType={invoice.docType} />;
  // 홈택스에서 수기로 발행 완료 표시했거나 취소한 건은 전자 발급 대상이 아니다
  if (invoice.status !== 'REQUESTED') return null;
  return <IssueReadyPanel invoice={invoice} reload={reload} />;
}

// ─────────────────────────────────────────────
// 발급 후 — 상태 확인 · (현금영수증) 전액 취소
// ─────────────────────────────────────────────
function ProviderStatusPanel({
  invoice,
  onUpdated,
  reload,
}: {
  invoice: TaxInvoice;
  onUpdated: (inv: TaxInvoice) => void;
  reload: () => Promise<TaxInvoice | null>;
}) {
  // 이 문서를 지금 전자로 발급할 수 있는지 — 현금영수증은 따로 연다(2026-10-21)
  const issuanceOpen = useIssuanceOpenFor(invoice.docType);
  const [syncing, setSyncing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  // 취소를 한 번 시도했으면 결과를 다시 읽어 확인할 때까지 잠근다
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const syncing$ = useRef(false);
  const isCash = invoice.docType === 'CASH';
  const correction = isTaxCorrection(invoice);
  const ps = invoice.providerStatus ?? null;
  const cancel = invoice.providerCancelStatus ?? null;
  const docLabel = correction ? '수정세금계산서(취소분)' : DOC_TYPE_LABEL[invoice.docType];
  // 세금계산서는 발행취소 · 수정발급 상태까지 담은 상태 이름을 쓴다
  const ds = displayState(invoice);

  const sync = async () => {
    if (!invoice.id || syncing$.current) return;
    syncing$.current = true;
    setSyncing(true);
    try {
      const res = await bossTaxInvoiceApi.electronicSync(invoice.id);
      if (res.success !== false && res.data) {
        onUpdated(res.data);
        setCancelPending(false);
        markListDirty(LIST_KEYS.taxInvoice);
        toast.success('발급 · 취소 · 국세청 전송 상태를 새로 받았습니다.');
      } else {
        toast.error(res.message || res.error || '상태를 확인하지 못했습니다. 잠시 뒤 다시 확인하세요.');
      }
    } catch {
      toast.error('네트워크 오류로 상태를 확인하지 못했습니다.');
    } finally {
      syncing$.current = false;
      setSyncing(false);
    }
  };

  const view = async () => {
    if (!invoice.id || opening) return;
    setOpening(true);
    setFallbackUrl(null);
    try {
      const { opened, url } = await openExternal(async () => {
        const res = await bossTaxInvoiceApi.electronicView(invoice.id!);
        if (res.success !== false && res.data) return safeHttpsUrl(res.data.url);
        toast.error(res.message || res.error || '원본 보기 주소를 받지 못했습니다.');
        return null;
      });
      if (!opened && url) setFallbackUrl(url);
    } catch {
      toast.error('네트워크 오류로 원본을 열지 못했습니다.');
    } finally {
      setOpening(false);
    }
  };

  const recheckAfterCancel = async () => {
    const fresh = await reload();
    // 다시 읽지 못했으면 결과를 모르는 상태 — 잠금 유지
    setCancelPending(fresh == null);
  };

  const onCancelAttempted = async (message: string | null) => {
    setCancelOpen(false);
    setCancelError(message);
    setCancelPending(true);
    await recheckAfterCancel();
  };

  const cancelUnsettled = cancel === 'UNKNOWN' || cancel === 'PROCESSING';
  const canCancel =
    isCash && ps === 'ISSUED' && cancel == null && !cancelPending && issuanceOpen && invoice.id != null;

  return (
    <Panel
      kicker={`${docLabel} · 전자 발급`}
      title={!isCash ? ds.label : cancel ? PROVIDER_CANCEL_STATUS_LABEL[cancel] : ps ? PROVIDER_STATUS_LABEL[ps] : '상태 미확인'}
      right={
        !isCash ? (
          <Tag tone={ds.tone}>{ds.label}</Tag>
        ) : cancel ? (
          <Tag tone={CANCEL_STATUS_TONE[cancel]}>{PROVIDER_CANCEL_STATUS_LABEL[cancel]}</Tag>
        ) : ps ? (
          <Tag tone={PROVIDER_STATUS_TONE[ps]}>{PROVIDER_STATUS_LABEL[ps]}</Tag>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        {invoice.providerIsTest && (
          <AlertBanner tone="warn">
            시험 환경에서 발급한 문서입니다. 국세청에 전송되지 않으며 효력이 없고, 발급 · 부가세 집계에서 빠집니다.
          </AlertBanner>
        )}
        {(ps === 'UNKNOWN' || ps === 'PROCESSING' || ps == null) && (
          <AlertBanner tone="warn">
            발급 결과를 아직 확정하지 못했습니다. 중복 발급을 막기 위해 다시 발급할 수 없습니다. 잠시 뒤 &lsquo;상태 다시 확인&rsquo;을 눌러
            주세요.
          </AlertBanner>
        )}
        {ps === 'FAILED' && (
          <AlertBanner tone="bad">
            발급에 실패했습니다{invoice.providerError ? `: ${invoice.providerError}` : '.'} 중복 발급을 막기 위해 이 문서는 다시 발급할 수 없고,
            같은 내용으로 새 문서를 만들어 발급하는 것도 피해 주세요. 상태를 다시 확인한 뒤에도 실패라면 관리자에게 문의하거나 팝빌에서 실제
            발급 여부를 먼저 확인하세요.
          </AlertBanner>
        )}
        {(cancelUnsettled || cancelPending) && (
          <AlertBanner
            tone="warn"
            action={
              cancelPending ? (
                <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void recheckAfterCancel()}>
                  결과 확인
                </Button>
              ) : undefined
            }
          >
            취소 결과를 아직 확인하지 못했습니다. 다시 취소하지 말고 &lsquo;상태 다시 확인&rsquo;으로 같은 요청의 결과를 조회하세요.
          </AlertBanner>
        )}
        {!cancelPending && cancelError && cancel == null && (
          <AlertBanner tone="bad">취소하지 못했습니다: {cancelError}</AlertBanner>
        )}
        {invoice.providerError && ps !== 'FAILED' && (
          <p className="text-[12.5px] leading-relaxed text-boss-error">대행사 메시지: {invoice.providerError}</p>
        )}

        <dl>
          <DescRow label="발급 대행" value="팝빌" />
          <DescRow label="환경" value={invoice.providerIsTest ? '시험' : '실제'} />
          <DescRow label={isCash ? '원거래 국세청 전송' : '국세청 전송'} value={<NtsValue nts={invoice.ntsStatus} />} />
          <DescRow label={isCash ? '승인번호' : '국세청 승인번호'} value={invoice.approvalNo || '-'} />
          {correction && (
            <>
              <DescRow label="수정사유" value={correctionReasonText(invoice)} />
              <DescRow label="당초 승인번호" value={invoice.orgNtsConfirmNum || '확인 필요'} />
              <DescRow label="당초 작성일자" value={originIssueDateText(invoice)} />
            </>
          )}
          {isCash && <DescRow label="승인 거래일자" value={isoDateOf(invoice.providerTradeDate) || '-'} />}
          <DescRow label="발급 일시" value={(invoice.issuedAt ?? '').slice(0, 16).replace('T', ' ') || '-'} />
          {isCash && cancel && (
            <>
              <DescRow label="취소 상태" value={<Tag tone={CANCEL_STATUS_TONE[cancel]}>{PROVIDER_CANCEL_STATUS_LABEL[cancel]}</Tag>} />
              <DescRow label="취소 승인번호" value={invoice.providerCancelApprovalNo || '-'} />
              {/* 원거래가 전송 완료여도 취소 거래는 따로 전송된다 */}
              <DescRow label="취소 거래 국세청 전송" value={<NtsValue nts={invoice.providerCancelNtsStatus} />} />
            </>
          )}
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void sync()} disabled={syncing}>
            {syncing ? '확인 중…' : '상태 다시 확인'}
          </Button>
          {ps === 'ISSUED' && (
            <Button variant="secondary" size="sm" icon={ExternalLink} onClick={() => void view()} disabled={opening}>
              {/* 세금계산서는 '원본(원래 문서)'과 헷갈리지 않게 팝빌 문서 보기로 부른다 */}
              {opening ? '여는 중…' : isCash ? '원본 보기' : '팝빌에서 보기'}
            </Button>
          )}
          {canCancel && (
            <Button variant="secondary" size="sm" icon={Ban} onClick={() => setCancelOpen(true)} className="!text-boss-error">
              전액 취소
            </Button>
          )}
        </div>
        {fallbackUrl && (
          <p className="text-[12px] text-boss-text-secondary">
            팝업이 막혔습니다.{' '}
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-boss-primary hover:underline">
              원본 열기
            </a>
          </p>
        )}
        {!isCash && !correction && <TaxCancelSection invoice={invoice} reload={reload} />}
        <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
          {isCash
            ? issuanceOpen
              ? '현금영수증은 전액 취소만 지원합니다(부분 취소 없음). 취소는 승인된 원거래를 기준으로 서버가 처리합니다. 수정 · 삭제는 할 수 없습니다.'
              : '현금영수증 취소는 정식 오픈 후 이용할 수 있습니다. 전자 발급한 문서는 여기서 수정 · 삭제할 수 없습니다.'
            : correction
              ? '수정세금계산서(취소분)는 수정 · 삭제 · 다시 발급 · 다시 취소할 수 없습니다. 원본과 함께 보관하세요.'
              : '전자 발급한 세금계산서는 여기서 수정 · 삭제할 수 없습니다. 취소는 전액만 됩니다(발행취소 또는 수정세금계산서). 일부 반품 · 공급가액 변동 · 기재사항 정정 · 영세율 전환은 팝빌 또는 홈택스에서 처리하세요.'}
        </p>
      </div>

      {cancelOpen && invoice.id != null && (
        <CancelDialog invoice={invoice} onClose={() => setCancelOpen(false)} onAttempted={(msg) => void onCancelAttempted(msg)} />
      )}
    </Panel>
  );
}

// ─────────────────────────────────────────────
// 현금영수증 전액 취소 — 사유 · 확인 체크 후 한 번만 보낸다
// ─────────────────────────────────────────────
function CancelDialog({
  invoice,
  onClose,
  onAttempted,
}: {
  invoice: TaxInvoice;
  onClose: () => void;
  /** 취소 요청을 보냈다(성공 · 실패 무관). 실패 메시지가 있으면 함께 */
  onAttempted: (errorMessage: string | null) => void;
}) {
  const [reason, setReason] = useState<CashCancelReason | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const id = cashIdentityLine(invoice);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !inFlight.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = async () => {
    if (!reason || !confirmed || inFlight.current || invoice.id == null) return;
    inFlight.current = true;
    setSending(true);
    let message: string | null = null;
    try {
      const res = await bossTaxInvoiceApi.electronicCancel(invoice.id, reason);
      if (res.success !== false && res.data) {
        const cs = res.data.providerCancelStatus;
        if (cs === 'CANCELED') toast.success('현금영수증을 전액 취소했습니다.');
        else toast('취소 결과를 확인하는 중입니다. 잠시 뒤 상태를 다시 확인하세요.', { icon: 'ℹ️' });
      } else {
        message = res.message || res.error || '취소 요청이 처리되지 않았습니다.';
        toast.error(`${message} 결과를 다시 확인합니다.`);
      }
    } catch {
      message = '네트워크 오류로 취소 결과를 받지 못했습니다.';
      toast.error(message);
    } finally {
      markListDirty(LIST_KEYS.taxInvoice);
      setSending(false);
      // 잠금은 풀지 않는다 — 닫고 상세를 다시 읽어 결과를 본다
      onAttempted(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-boss-text/40" onClick={sending ? undefined : onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="현금영수증 전액 취소"
        className="relative flex max-h-[92dvh] w-full max-w-[520px] flex-col border border-boss-error/35 bg-boss-surface shadow-boss-lg"
      >
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-boss-text">현금영수증 전액 취소</p>
            <p className="mt-0.5 text-[12px] text-boss-text-secondary">부분 취소는 지원하지 않습니다. 취소하면 되돌릴 수 없습니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center text-boss-text-muted hover:bg-boss-hover hover:text-boss-text disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>
        <div className="boss-scroll min-h-0 flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-4">
            {invoice.providerIsTest ? (
              <AlertBanner tone="warn">시험 환경 문서의 취소입니다. 국세청에 전송되지 않습니다.</AlertBanner>
            ) : (
              <AlertBanner tone="bad">실제 취소입니다. 원거래 금액 전액이 취소되고 국세청으로 취소 거래가 전송됩니다.</AlertBanner>
            )}
            <dl>
              <DescRow label="원 승인번호" value={invoice.approvalNo || '-'} />
              <DescRow label="원 거래일자" value={isoDateOf(invoice.providerTradeDate) || '-'} />
              <DescRow label="용도 · 식별" value={`${id.usage} · ${id.masked}`} />
              <DescRow label="취소 금액(전액)" value={`${fmt(invoice.totalAmount)}원`} />
            </dl>
            <p className="text-[12px] leading-relaxed text-boss-text-secondary">
              취소 거래일자 · 원거래 정보는 서버가 승인된 원본을 기준으로 정합니다.
            </p>
            <fieldset className="flex flex-col gap-2" disabled={sending}>
              <legend className="mb-1 text-[12px] font-semibold text-boss-text">취소 사유</legend>
              <div role="radiogroup" aria-label="취소 사유" className="flex flex-col gap-2">
                {(Object.keys(CASH_CANCEL_REASON_LABEL) as CashCancelReason[]).map((r) => (
                  <RadioOption key={r} checked={reason === r} onChange={() => setReason(r)} label={CASH_CANCEL_REASON_LABEL[r]} />
                ))}
              </div>
            </fieldset>
            <CheckLine checked={confirmed} onChange={setConfirmed} disabled={sending}>
              {fmt(invoice.totalAmount)}원 전액이 취소되며 되돌릴 수 없다는 것을 확인했습니다
            </CheckLine>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-boss-border px-5 py-3">
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            닫기
          </Button>
          <Button variant="danger" onClick={() => void send()} disabled={!reason || !confirmed || sending}>
            {sending ? '취소 요청 중…' : '전액 취소'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 발급 전 — 설정 확인 · 인증서 등록(세금계산서) · 미리보기
// ─────────────────────────────────────────────
function IssueReadyPanel({ invoice, reload }: { invoice: TaxInvoice; reload: () => Promise<TaxInvoice | null> }) {
  const [config, setConfig] = useState<ElectronicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certOpening, setCertOpening] = useState(false);
  const [certFallback, setCertFallback] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // 발급을 한 번 시도했으면 상세를 다시 읽어 결과를 확인할 때까지 버튼을 잠근다
  const [attemptPending, setAttemptPending] = useState(false);
  const [lastIssueError, setLastIssueError] = useState<string | null>(null);
  const seq = useRef(0);
  const docType = invoice.docType;
  const isCash = docType === 'CASH';
  const docLabel = DOC_TYPE_LABEL[docType];

  const loadConfig = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await bossTaxInvoiceApi.electronicConfig(docType);
      if (my !== seq.current) return;
      if (res.success !== false && res.data) setConfig(res.data);
      else {
        setConfig(null);
        setError(res.message || res.error || '전자 발급 설정을 불러오지 못했습니다.');
      }
    } catch {
      if (my !== seq.current) return;
      setConfig(null);
      setError('네트워크 오류로 전자 발급 설정을 불러오지 못했습니다.');
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [docType]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const openCertificate = async () => {
    if (certOpening) return;
    setCertOpening(true);
    setCertFallback(null);
    try {
      const { opened, url } = await openExternal(async () => {
        const res = await bossTaxInvoiceApi.certificateUrl();
        if (res.success !== false && res.data) return safeHttpsUrl(res.data.url);
        toast.error(res.message || res.error || '인증서 등록 화면 주소를 받지 못했습니다.');
        return null;
      });
      if (!opened && url) setCertFallback(url);
      if (opened) toast('인증서를 등록한 뒤 이 화면에서 설정 다시 확인을 누르세요.', { icon: 'ℹ️' });
    } catch {
      toast.error('네트워크 오류로 인증서 등록 화면을 열지 못했습니다.');
    } finally {
      setCertOpening(false);
    }
  };

  const recheckAfterAttempt = async () => {
    const fresh = await reload();
    // 다시 읽지 못했으면 결과를 모르는 상태 — 잠금 유지
    setAttemptPending(fresh == null);
  };

  const onAttempted = async (message: string | null, noResponse = false) => {
    setLastIssueError(message);
    setAttemptPending(true);
    // 응답을 못 받았으면 서버가 아직 처리 중일 수 있다 — 곧바로 다시 읽어 잠금을 풀지 않는다(2026-10-16).
    // 예전엔 바로 다시 읽어 '미발급'으로 보이면 '발급하지 못했습니다'로 안내해, 같은 내용으로 새 문서를 발급할 수 있었다.
    if (noResponse) return;
    await recheckAfterAttempt();
  };

  const supplier = config?.supplier ?? null;
  const preflight = cashPreflightIssues(invoice);
  // 미리보기는 외부로 아무것도 보내지 않으니 설정이 덜 끝나도 열어 둔다 — 무엇이 빠졌는지 issues 로 보인다.
  // 발급은 대화상자에서 preview.ready · issues(그리고 현금영수증 사전 점검)로 막는다.
  const canPreview = !!config?.enabled && !attemptPending;

  return (
    <Panel
      kicker={`${docLabel} · 전자 발급`}
      title="바로 발급"
      right={config ? <Tag tone={config.isTest ? 'warn' : 'info'}>{config.isTest ? '시험 환경' : '실제 발급'}</Tag> : undefined}
    >
      {loading && !config ? (
        <Skeleton className="h-24" />
      ) : error ? (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="secondary" size="sm" onClick={() => void loadConfig()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      ) : config && !config.enabled ? (
        <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
          {docLabel} 전자 발급을 쓰지 않는 상태입니다{config.reason ? ` (${config.reason})` : ''}. 홈택스에서 발급한 뒤 승인번호를 남겨 주세요.
        </p>
      ) : config ? (
        <div className="flex flex-col gap-3">
          {attemptPending && (
            <AlertBanner
              tone="warn"
              action={
                <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void recheckAfterAttempt()}>
                  결과 확인
                </Button>
              }
            >
              {lastIssueError ? `${lastIssueError} ` : ''}발급 결과를 확인하지 못했습니다. 중복 발급을 막기 위해 결과를 확인할 때까지 다시 발급할 수 없습니다.
            </AlertBanner>
          )}
          {!attemptPending && lastIssueError && (
            <AlertBanner tone="bad">발급하지 못했습니다: {lastIssueError} 내용을 확인하고 미리보기부터 다시 진행하세요.</AlertBanner>
          )}

          {!config.ready && (
            <AlertBanner
              tone="warn"
              action={
                <ButtonLink href="/boss/tax-invoice/registration" variant="secondary" size="sm">
                  발급 서비스 등록
                </ButtonLink>
              }
            >
              {docLabel} 발급 준비가 끝나지 않았습니다{config.reason ? `: ${config.reason}` : '.'} 미리보기로 내용은 확인할 수 있지만, 준비를
              마쳐야 발급할 수 있습니다.
            </AlertBanner>
          )}
          {preflight.length > 0 && (
            <AlertBanner tone="warn">
              발급 전에 고칠 것: {preflight.join(' ')}
            </AlertBanner>
          )}

          <dl>
            <DescRow label={isCash ? '가맹점(공급자)' : '공급자'} value={supplier ? `${supplier.name} · ${supplier.bizNo}` : '미등록'} />
            <DescRow label="대표자" value={supplier?.ceo || '-'} />
            {!isCash && <DescRow label="수신 이메일(공급자)" value={supplier?.email || '-'} />}
            {!isCash && <DescRow label="인증서 만료" value={config.certificateExpiresAt?.slice(0, 10) || '미등록'} />}
          </dl>

          {config.isTest && (
            <p className="text-[12px] leading-relaxed text-boss-pill-warn-fg">
              지금은 시험 환경입니다. 발급해도 국세청에 전송되지 않고 효력이 없으며, 부가세 집계에서 빠집니다.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" icon={FileCheck2} onClick={() => setPreviewOpen(true)} disabled={!canPreview}>
              {config.ready && preflight.length === 0 ? '미리보기 · 발급' : '미리보기'}
            </Button>
            {!isCash && (
              <Button variant="secondary" size="sm" icon={ShieldCheck} onClick={() => void openCertificate()} disabled={certOpening}>
                {/* 이미 등록한 사장님에게는 갱신 · 관리 단추다(2026-10-22 준비 완료 화면 점검) */}
                {certOpening ? '여는 중…' : config.certificateExpiresAt ? '인증서 관리' : '인증서 등록'}
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void loadConfig()} disabled={loading}>
              설정 다시 확인
            </Button>
          </div>
          {certFallback && (
            <p className="text-[12px] text-boss-text-secondary">
              팝업이 막혔습니다.{' '}
              <a href={certFallback} target="_blank" rel="noopener noreferrer" className="font-semibold text-boss-primary hover:underline">
                인증서 등록 화면 열기
              </a>
            </p>
          )}
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            {/* 준비를 마친 사장님에게 준비 전 안내를 보이지 않는다(2026-10-22) */}
            {isCash
              ? config.ready
                ? '현금영수증 발급 준비가 끝났습니다. 공동인증서는 필요 없습니다.'
                : '현금영수증은 공동인증서 없이 발급 서비스 연동이 끝나면 발급할 수 있습니다. 준비 상태는 서버가 판단합니다.'
              : config.certificateExpiresAt
                ? config.certificateExpiresAt.slice(0, 10) < kstToday()
                  ? `공동인증서가 만료되었습니다(${config.certificateExpiresAt.slice(0, 10)}). '인증서 관리'에서 새 인증서를 등록해 주세요.`
                  : `공동인증서가 등록되어 있습니다(${config.certificateExpiresAt.slice(0, 10)}까지). 갱신할 때만 '인증서 관리'를 눌러 주세요.`
                : '인증서 등록은 팝빌 회원으로 가입된 사업자만 할 수 있습니다. 가입은 자동으로 되지 않습니다.'}
          </p>
        </div>
      ) : null}

      {previewOpen && invoice.id != null && (
        <PreviewDialog
          invoiceId={invoice.id}
          preflight={preflight}
          onClose={() => setPreviewOpen(false)}
          onAttempted={(msg, noResponse) => {
            setPreviewOpen(false);
            void onAttempted(msg, noResponse);
          }}
        />
      )}
    </Panel>
  );
}

// ─────────────────────────────────────────────
// 미리보기 · 최종 확인 — 열 때마다 새 미리보기를 받는다
// ─────────────────────────────────────────────
function PreviewDialog({
  invoiceId,
  preflight,
  onClose,
  onAttempted,
}: {
  invoiceId: number;
  /** 화면이 미리 찾은 발급 불가 이유(현금영수증) */
  preflight: string[];
  onClose: () => void;
  /** 발급 요청을 보냈다(성공 · 실패 무관). 실패 메시지가 있으면 함께 */
  onAttempted: (errorMessage: string | null, noResponse?: boolean) => void;
}) {
  const [preview, setPreview] = useState<ElectronicPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState({ buyer: false, date: false, total: false, env: false });
  const [issuing, setIssuing] = useState(false);
  const inFlight = useRef(false);
  const seq = useRef(0);

  const loadPreview = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    setPreview(null);
    // 새 미리보기를 받으면 확인도 처음부터
    setChecks({ buyer: false, date: false, total: false, env: false });
    try {
      const res = await bossTaxInvoiceApi.electronicPreview(invoiceId);
      if (my !== seq.current) return;
      if (res.success !== false && res.data) setPreview(res.data);
      else setError(res.message || res.error || '미리보기를 만들지 못했습니다.');
    } catch {
      if (my === seq.current) setError('네트워크 오류로 미리보기를 만들지 못했습니다.');
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  // ESC 로 닫기 — 발급 중에는 닫지 않는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !inFlight.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const inv = preview?.invoice;
  const isCash = inv?.docType === 'CASH';
  const isTest = preview?.isTest ?? false;
  const blockers = preview ? [...(preview.ready ? [] : preview.issues.length === 0 ? ['발급 준비(공급자 · 연동)가 끝나지 않았습니다.'] : []), ...preview.issues, ...preflight] : [];
  const allChecked = checks.buyer && checks.date && checks.total && checks.env;
  const blocked = !preview || !preview.ready || blockers.length > 0 || !preview.previewToken;
  const canIssue = !blocked && allChecked && !issuing && !loading;
  const docLabel = inv ? DOC_TYPE_LABEL[inv.docType] : '문서';

  const issue = async () => {
    if (!preview || !canIssue || inFlight.current) return;
    inFlight.current = true;
    setIssuing(true);
    let message: string | null = null;
    let noResponse = false;
    try {
      const res = await bossTaxInvoiceApi.electronicIssue(invoiceId, preview.previewToken);
      if (res.success !== false && res.data) {
        const ps = res.data.providerStatus;
        if (ps === 'ISSUED') {
          toast.success(preview.isTest ? '시험 발급했습니다. 효력이 없는 문서입니다.' : `${docLabel}를 발급했습니다.`);
        } else if (ps === 'FAILED') {
          toast.error(res.data.providerError || '발급에 실패했습니다.');
        } else {
          toast('발급 결과를 확인하는 중입니다. 잠시 뒤 상태를 다시 확인하세요.', { icon: 'ℹ️' });
        }
      } else if ('network' in res && res.network) {
        noResponse = true;
        message = '응답을 받지 못했습니다. 발급이 진행 중일 수 있으니 1~2분 뒤 「결과 확인」을 눌러 주세요. 같은 내용으로 새 문서를 만들어 발급하지 마세요.';
        toast.error(message);
      } else {
        message = res.message || res.error || '발급 요청이 처리되지 않았습니다.';
        toast.error(`${message} 결과를 다시 확인합니다.`);
      }
    } catch {
      noResponse = true;
      message = '네트워크 오류로 발급 결과를 받지 못했습니다. 1~2분 뒤 「결과 확인」을 눌러 주세요.';
      toast.error(message);
    } finally {
      markListDirty(LIST_KEYS.taxInvoice);
      setIssuing(false);
      // 잠금은 풀지 않는다 — 대화상자를 닫고 상세를 다시 읽어 결과를 본다(응답이 없었으면 사장님이 잠시 뒤 확인)
      onAttempted(message, noResponse);
    }
  };

  const cash = inv && isCash ? cashFieldsOf(inv) : null;
  const buyerLine = inv
    ? isCash && cash
      ? `${CASH_USAGE_LONG_LABEL[cash.usage]} · ${formatCashIdentity(cash.identityType, cash.identityNum)}`
      : `${inv.buyerName || '(상호 없음)'} · ${inv.buyerBizNo || '-'}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-boss-text/40" onClick={issuing ? undefined : onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${docLabel} 발급 미리보기`}
        className="relative flex max-h-[92dvh] w-full max-w-[820px] flex-col border border-boss-border bg-boss-surface shadow-boss-lg"
      >
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-boss-text">{docLabel} 발급 미리보기</p>
            <p className="mt-0.5 text-[12px] text-boss-text-secondary">
              아직 아무것도 발급되지 않았습니다. 내용을 확인하고 네 가지를 체크해야 발급할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={issuing}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center text-boss-text-muted hover:bg-boss-hover hover:text-boss-text disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="boss-scroll min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-40" />
            </div>
          ) : error || !preview || !inv ? (
            <AlertBanner
              tone="bad"
              action={
                <Button variant="secondary" size="sm" onClick={() => void loadPreview()}>
                  다시 시도
                </Button>
              }
            >
              {error ?? '미리보기를 만들지 못했습니다.'}
            </AlertBanner>
          ) : (
            <div className="flex flex-col gap-4">
              {isTest ? (
                <AlertBanner tone="warn">시험 환경 발급입니다. 국세청에 전송되지 않고 효력이 없으며, 부가세 집계에서 빠집니다.</AlertBanner>
              ) : (
                <AlertBanner tone="bad">실제 발급입니다. 발급하면 국세청으로 전송되며 이 화면에서 되돌리거나 수정할 수 없습니다.</AlertBanner>
              )}

              {blockers.length > 0 && (
                <div className="border border-boss-error/35 bg-boss-pill-bad px-4 py-3 text-[13px] text-boss-pill-bad-fg" role="alert">
                  <p className="font-semibold">발급할 수 없습니다 — 아래 문제를 먼저 해결하세요.</p>
                  <ul className="mt-1.5 flex flex-col gap-0.5">
                    {blockers.map((m, i) => (
                      <li key={`${i}-${m}`}>· {m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 무료 1개월이 끝났다 — 결제는 앱에서만 한다(2026-10-17). 구독 뒤 미리보기를 다시 열면 바로 발급할 수 있다 */}
              {preview.subscriptionRequired && (
                <div className="border border-boss-warning/35 bg-boss-pill-warn px-4 py-3 text-[13px] leading-relaxed text-boss-pill-warn-fg">
                  <p className="font-semibold">구독하면 바로 이어서 발급할 수 있습니다 ({TAX_SUBSCRIPTION_PRICE})</p>
                  <p className="mt-1">{TAX_SUBSCRIPTION_WHERE.replace('이 화면에서 다시 확인을 누르세요', '이 미리보기를 다시 여세요')}</p>
                  <p className="mt-1">{TAX_SUBSCRIPTION_FREE_USES}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <PartyBlock title={isCash ? '가맹점(공급자)' : '공급자'} supplier={preview.supplier} />
                <div className="border border-boss-border p-3">
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-boss-text-secondary">{isCash ? '고객' : '공급받는자'}</p>
                  {isCash && cash ? (
                    <dl>
                      <DescRow label="용도" value={CASH_USAGE_LONG_LABEL[cash.usage]} />
                      <DescRow label="식별번호" value={formatCashIdentity(cash.identityType, cash.identityNum) || '-'} />
                      <DescRow label="고객명" value={inv.buyerName || '-'} />
                      <DescRow label="과세 구분" value={cashTaxationOf(inv)} />
                      <DescRow label="전송 품목명" value={cashItemNameOf(inv).name} />
                    </dl>
                  ) : (
                    <dl>
                      <DescRow label="상호" value={inv.buyerName || '-'} />
                      <DescRow label="사업자번호" value={inv.buyerBizNo || '-'} />
                      <DescRow label="대표자" value={inv.buyerCeo || '-'} />
                      <DescRow label="주소" value={inv.buyerAddress || '-'} />
                      <DescRow label="업태 / 종목" value={[inv.buyerBizType, inv.buyerBizKind].filter(Boolean).join(' / ') || '-'} />
                      <DescRow label="수신 이메일" value={inv.buyerEmail || '-'} />
                    </dl>
                  )}
                </div>
              </div>

              <dl className="grid gap-x-6 sm:grid-cols-2">
                <DescRow label={isCash ? '거래일자(작성 기준)' : '작성일자'} value={inv.issueDate || '미정'} />
                <DescRow label={isCash ? '대금' : '영수 / 청구'} value={isCash ? (inv.payType === 'RECEIPT' ? '받음(영수)' : '아직 안 받음') : PAY_TYPE_LABEL[inv.payType]} />
                <DescRow label="공급가액" value={`${fmt(inv.supplyAmount)}원`} />
                <DescRow label={isCash ? '부가세' : '세액'} value={`${fmt(inv.vatAmount)}원`} />
              </dl>
              <p className="font-boss-head text-[22px] font-semibold tabular-nums text-boss-text">합계 {fmt(inv.totalAmount)}원</p>

              {inv.items.length > 0 && (
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
                    {inv.items.map((it, i) => (
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

              <fieldset className="flex flex-col gap-2 border border-boss-border bg-boss-bg p-4" disabled={blocked || issuing}>
                <legend className="px-1 text-[12px] font-semibold text-boss-text">최종 확인</legend>
                <CheckLine checked={checks.buyer} onChange={(v) => setChecks((c) => ({ ...c, buyer: v }))} disabled={blocked || issuing}>
                  {isCash ? '고객 식별번호가 맞습니다' : '받는 사업자가 맞습니다'} — {buyerLine}
                </CheckLine>
                <CheckLine checked={checks.date} onChange={(v) => setChecks((c) => ({ ...c, date: v }))} disabled={blocked || issuing}>
                  {isCash ? '거래일자가 맞습니다' : '작성일자가 맞습니다'} — {inv.issueDate || '미정'}
                </CheckLine>
                <CheckLine checked={checks.total} onChange={(v) => setChecks((c) => ({ ...c, total: v }))} disabled={blocked || issuing}>
                  합계금액이 맞습니다 — {fmt(inv.totalAmount)}원
                </CheckLine>
                <CheckLine checked={checks.env} onChange={(v) => setChecks((c) => ({ ...c, env: v }))} disabled={blocked || issuing}>
                  {isTest
                    ? '시험 환경 발급이며 효력이 없다는 것을 확인했습니다'
                    : '실제 발급이며 국세청으로 전송되어 되돌릴 수 없다는 것을 확인했습니다'}
                </CheckLine>
              </fieldset>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-boss-border px-5 py-3">
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void loadPreview()} disabled={loading || issuing}>
            미리보기 새로 받기
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={issuing}>
              닫기
            </Button>
            <Button variant={isTest ? 'primary' : 'danger'} onClick={() => void issue()} disabled={!canIssue}>
              {issuing ? '발급 중…' : isTest ? '시험 발급' : '실제 발급'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyBlock({ title, supplier }: { title: string; supplier: TaxInvoiceSupplier | null }) {
  return (
    <div className="border border-boss-border p-3">
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-boss-text-secondary">{title}</p>
      {supplier ? (
        <dl>
          <DescRow label="상호" value={supplier.name || '-'} />
          <DescRow label="사업자번호" value={supplier.bizNo || '-'} />
          <DescRow label="대표자" value={supplier.ceo || '-'} />
          <DescRow label="주소" value={supplier.address || '-'} />
          <DescRow label="업태 / 종목" value={[supplier.bizType, supplier.bizKind].filter(Boolean).join(' / ') || '-'} />
          <DescRow label="이메일" value={supplier.email || '-'} />
        </dl>
      ) : (
        <p className="text-[13px] text-boss-error">공급자 정보가 없습니다. 발급 서비스 등록을 먼저 마치세요.</p>
      )}
    </div>
  );
}
