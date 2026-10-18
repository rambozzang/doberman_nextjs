'use client';

// 전자세금계산서 취소 — 상세 우측 전자 발급 패널 안의 "세금계산서 취소" 구역 · 대화상자, 원본 ↔ 수정분 연결 카드
//
// 흐름: 사유 · 적용 일자 고르기 → 서버 미리보기(팝빌 상태만 새로 읽음, 외부 변경 없음)
//       → 국세청 전송 전이면 발행취소, 전송 후면 전액을 차감하는 음수 수정세금계산서 1장 → 세 가지 확인 → 요청 1회
// 방식은 서버가 정한다. 화면은 미리보기를 원본과 다시 대조하고(taxInvoiceCancel.previewProblems) 어긋나면 막는다.
//
// 중복 방지
//   · 요청 전에 브라우저 저장소에 시도 기록을 남긴다(못 남기면 보내지 않는다). 응답을 받으면 지우고, 응답을 못 받으면 남겨 둔다.
//   · 남은 기록은 서버가 결과를 기록했거나 정착 시간(5분)이 지난 뒤 서버에서 읽은 문서로만 푼다 — 새로고침 · 다른 탭에도 남는다.
//   · 요청 중에는 닫기 · ESC · 배경 클릭을 막고, 창을 떠나려 하면 브라우저가 묻는다. 시도 뒤 상세를 다시 읽을 때까지 잠근다.
//   · 결과를 모르면(UNKNOWN · PROCESSING) 다시 취소 · 다시 발급 대신 "상태 다시 확인"만 연다.
// 출시 값이 꺼져 있으면 미리보기 조회도 취소 버튼도 없이 오픈 예정 안내만 보인다.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, FileMinus2, RefreshCw, X } from 'lucide-react';
import { bossTaxInvoiceApi, type TaxCancelCall } from '@/lib/api/boss/taxinvoice';
import { useElectronicTaxInvoiceOpen } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import {
  TAX_CANCEL_REASONS,
  TAX_CANCEL_REASON_GUIDE,
  TAX_CANCEL_SETTLE_MS,
  occurrenceDateError,
  previewBlockers,
  providerStateText,
  requestDateOf,
  taxCancelAttemptStore,
  taxCancelBlockReason,
} from '@/lib/boss/taxInvoiceCancel';
import {
  correctionReasonText,
  displayState,
  isoDateOf,
  kstToday,
  ntsLabel,
  originIssueDateText,
} from '@/lib/boss/taxInvoiceDocument';
import {
  MODIFY_CODE_LABEL,
  TAX_CANCEL_MODE_LABEL,
  TAX_CANCEL_MODIFY_CODE,
  TAX_CANCEL_REASON_LABEL,
  type TaxCancelReason,
  type TaxInvoice,
  type TaxInvoiceCancellationPreview,
} from '@/types/boss-taxinvoice';
import {
  AlertBanner,
  Button,
  ButtonLink,
  CheckLine,
  DataTable,
  DescRow,
  Field,
  Panel,
  RadioOption,
  Skeleton,
  Tag,
} from '@/components/boss/ui';

const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');
const won = (n?: number | null) => `${fmt(n)}원`;

function timeText(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ─────────────────────────────────────────────
// 우측 패널 안 — 원본 세금계산서의 취소 상태 · 진입
// ─────────────────────────────────────────────
export function TaxCancelSection({ invoice, reload }: { invoice: TaxInvoice; reload: () => Promise<TaxInvoice | null> }) {
  // 정식 오픈 여부는 서버가 정한다(2026-10-18)
  const issuanceOpen = useElectronicTaxInvoiceOpen();
  const [attemptAt, setAttemptAt] = useState<number | null>(null);
  // 시도 뒤 상세를 다시 읽을 때까지 잠근다(응답을 받았어도 화면의 문서는 아직 예전 값이다)
  const [awaitingReload, setAwaitingReload] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const id = invoice.id ?? null;
  const status = invoice.taxCancelStatus ?? null;

  // 서버에서 읽은 문서가 바뀔 때마다 시도 기록을 맞춘다(서버가 결과를 기록했으면 · 정착 시간이 지났으면 푼다)
  useEffect(() => {
    setAttemptAt(taxCancelAttemptStore.reconcile(invoice));
  }, [invoice]);

  // 같은 브라우저의 다른 탭이 시도 · 정리하면 따라간다
  useEffect(() => {
    if (id == null) return;
    const key = taxCancelAttemptStore.key(id);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setAttemptAt(taxCancelAttemptStore.read(id));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [id]);

  const recheck = async () => {
    if (rechecking) return;
    setRechecking(true);
    try {
      const fresh = await reload();
      // 다시 읽지 못했으면 결과를 모르는 상태 — 잠금 유지
      setAwaitingReload(fresh == null);
      if (fresh == null) toast.error('상세를 다시 읽지 못했습니다. 잠시 뒤 다시 확인하세요.');
    } finally {
      setRechecking(false);
    }
  };

  const onAttempted = async (result: TaxCancelCall) => {
    setDialogOpen(false);
    setLastError(result.kind === 'done' ? null : result.message);
    setAwaitingReload(true);
    if (id != null) setAttemptAt(taxCancelAttemptStore.read(id));
    const fresh = await reload();
    setAwaitingReload(fresh == null);
  };

  // ── 취소를 시도한 문서: 상태만 보여 준다(다시 취소 없음) ──
  if (status != null) {
    const linkId = invoice.taxCancelInvoiceId ?? null;
    return (
      <Section>
        {status === 'PROCESSING' || status === 'UNKNOWN' ? (
          <AlertBanner tone="warn">
            {status === 'UNKNOWN' ? '취소 결과를 확인하지 못했습니다.' : '취소를 처리하고 있습니다.'} 다시 취소하거나 다시 발급하지 말고 위의
            &lsquo;상태 다시 확인&rsquo;으로 같은 요청의 결과를 조회하세요.
          </AlertBanner>
        ) : status === 'CANCELED' ? (
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            국세청 전송 전에 발행을 취소했습니다(발행취소 완료). 이 세금계산서는 효력이 없고 발행 · 부가세 집계에서 빠집니다.
          </p>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            전액을 차감하는 수정세금계산서(취소분)를 발급했습니다(수정발급 완료). 이 원본은 그대로 남고, 원본과 수정분이 함께 신고 · 집계되어
            합계가 0원이 됩니다. 수정분의 국세청 전송은 수정분 상세에서 따로 확인하세요.
          </p>
        )}
        <dl className="mt-2">
          <DescRow label="방식" value={invoice.taxCancelMode ? TAX_CANCEL_MODE_LABEL[invoice.taxCancelMode] : '확인 중'} />
          <DescRow label="사유" value={invoice.taxCancelReason ? TAX_CANCEL_REASON_LABEL[invoice.taxCancelReason] : '-'} />
          <DescRow label="적용 일자" value={isoDateOf(invoice.taxCancelDate) || '-'} />
        </dl>
        {linkId != null && (
          <div className="mt-3">
            <ButtonLink href={`/boss/tax-invoice/${linkId}`} variant="secondary" size="sm" icon={FileMinus2}>
              수정분 보기
            </ButtonLink>
          </div>
        )}
      </Section>
    );
  }

  // ── 출시 전: 오픈 예정 안내만(조회 · 변경 버튼 없음) ──
  if (!issuanceOpen) {
    return (
      <Section right={<Tag tone="info">오픈 예정</Tag>}>
        <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
          발행취소(국세청 전송 전)와 전액 취소용 수정세금계산서(전송 후)는 정식 오픈 후 이용할 수 있습니다.
        </p>
      </Section>
    );
  }

  const pending = attemptAt != null || awaitingReload;
  const block = taxCancelBlockReason(invoice, attemptAt);

  return (
    <Section>
      {pending ? (
        <AlertBanner
          tone="warn"
          action={
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void recheck()} disabled={rechecking}>
              {rechecking ? '확인 중…' : '결과 확인'}
            </Button>
          }
        >
          취소 요청의 결과를 아직 확인하지 못했습니다{attemptAt != null ? `(요청 ${timeText(attemptAt)})` : ''}. 같은 문서를 다시 취소하지 마세요.
          서버에 결과가 기록되면 그 상태가 보이고, {Math.round(TAX_CANCEL_SETTLE_MS / 60_000)}분이 지나도록 서버 기록이 없으면 다시 요청할 수
          있습니다.
        </AlertBanner>
      ) : (
        <>
          {lastError && <AlertBanner tone="bad">취소하지 못했습니다: {lastError} 내용을 확인하고 미리보기부터 다시 진행하세요.</AlertBanner>}
          {block ? (
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">{block}</p>
          ) : (
            <>
              <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
                국세청 전송 전이면 발행취소, 전송이 끝났으면 전액을 차감하는 수정세금계산서(취소분) 1장을 발급합니다. 어느 쪽인지는 서버가 팝빌
                상태를 확인해 정하고, 진행 전에 미리보기로 보여 드립니다.
              </p>
              <div className="mt-2">
                <Button variant="secondary" size="sm" icon={FileMinus2} onClick={() => setDialogOpen(true)} className="!text-boss-error">
                  세금계산서 취소
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {dialogOpen && id != null && (
        <TaxCancelDialog invoice={invoice} onClose={() => setDialogOpen(false)} onAttempted={(r) => void onAttempted(r)} />
      )}
    </Section>
  );
}

function Section({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="border-t border-boss-border pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-semibold text-boss-text">세금계산서 취소</p>
        {right}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// 대화상자 — 사유 · 날짜 → 미리보기 · 확인 → 요청 1회
// ─────────────────────────────────────────────
type Asked = { reason: TaxCancelReason; requestDate: string | null };
const NO_CHECKS = { target: false, amounts: false, final: false };

function TaxCancelDialog({
  invoice,
  onClose,
  onAttempted,
}: {
  invoice: TaxInvoice;
  onClose: () => void;
  /** 요청을 보냈다(결과 무관) */
  onAttempted: (result: TaxCancelCall) => void;
}) {
  const id = invoice.id as number;
  const today = kstToday();
  const originDate = isoDateOf(invoice.issueDate);
  const [step, setStep] = useState<'reason' | 'preview'>('reason');
  const [reason, setReason] = useState<TaxCancelReason | null>(null);
  const [date, setDate] = useState('');
  const [dateTouched, setDateTouched] = useState(false);
  const [asked, setAsked] = useState<Asked | null>(null);
  const [preview, setPreview] = useState<TaxInvoiceCancellationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [checks, setChecks] = useState(NO_CHECKS);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const seq = useRef(0);

  const dateError = reason ? occurrenceDateError(reason, date, invoice.issueDate, today) : null;
  const guide = reason ? TAX_CANCEL_REASON_GUIDE[reason] : null;

  const loadPreview = useCallback(
    async (a: Asked) => {
      const my = ++seq.current;
      setStep('preview');
      setAsked(a);
      setLoading(true);
      setError(null);
      setSendError(null);
      setPreview(null);
      // 새 미리보기를 받으면 확인도 처음부터
      setChecks(NO_CHECKS);
      try {
        const res = await bossTaxInvoiceApi.taxCancelPreview(id, a.reason, a.requestDate);
        if (my !== seq.current) return;
        if (res.ok) setPreview(res.preview);
        else setError(res.message);
      } catch {
        if (my === seq.current) setError('네트워크 오류로 미리보기를 만들지 못했습니다.');
      } finally {
        if (my === seq.current) setLoading(false);
      }
    },
    [id],
  );

  const startPreview = () => {
    setDateTouched(true);
    if (!reason || dateError) return;
    void loadPreview({ reason, requestDate: requestDateOf(reason, date) });
  };

  const backToReason = () => {
    if (inFlight.current) return;
    // 늦게 오는 미리보기는 버린다
    seq.current += 1;
    setStep('reason');
    setPreview(null);
    setError(null);
    setLoading(false);
    setChecks(NO_CHECKS);
  };

  // ESC 로 닫기 — 요청 중에는 닫지 않는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !inFlight.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 요청 중에 창을 닫거나 새로고침하려 하면 브라우저가 묻는다(떠나도 시도 기록은 남는다)
  useEffect(() => {
    if (!sending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [sending]);

  const blockers = preview && asked ? previewBlockers(preview, { id, reason: asked.reason, requestDate: asked.requestDate }) : [];
  // 표시는 서버가 알려 준 방식대로, 진행은 준비(ready) · 막는 이유 없음 · 토큰이 모두 있을 때만
  const mode = preview?.mode ?? null;
  const blocked = !preview || !asked || !preview.ready || mode == null || blockers.length > 0 || !preview.previewToken;
  const allChecked = checks.target && checks.amounts && checks.final;
  const canSend = !blocked && allChecked && !sending && !loading;
  const isTest = preview?.isTest ?? false;

  const send = async () => {
    if (!preview || !asked || !canSend || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setSendError(null);
    // 보내기 전에 시도 기록 — 남기지 못하면 보내지 않는다(응답이 끊겼을 때 다시 누르는 것을 막을 수 없으므로)
    if (!taxCancelAttemptStore.mark(id)) {
      inFlight.current = false;
      setSending(false);
      setSendError('브라우저 저장소에 요청 기록을 남기지 못해 보내지 않았습니다. 저장소 차단(시크릿 창 등)을 풀고 다시 시도하세요.');
      return;
    }
    let result: TaxCancelCall;
    try {
      result = await bossTaxInvoiceApi.taxCancel(id, {
        confirmed: true,
        previewToken: preview.previewToken,
        reason: asked.reason,
        occurrenceDate: asked.requestDate,
      });
    } catch {
      result = { kind: 'lost', message: '취소 요청의 응답을 받지 못했습니다. 다시 요청하지 말고 상태를 확인하세요.' };
    }
    // 서버가 응답했으면 이후 조회가 진실 — 기록을 지운다. 응답을 못 받았으면 남겨 둔다
    if (result.kind !== 'lost') taxCancelAttemptStore.clear(id);
    markListDirty(LIST_KEYS.taxInvoice);
    if (result.kind === 'done') {
      const st = result.invoice.taxCancelStatus;
      if (st === 'CANCELED') toast.success(isTest ? '시험 환경에서 발행취소했습니다. 효력이 없는 문서입니다.' : '발행을 취소했습니다.');
      else if (st === 'CORRECTION_ISSUED') {
        toast.success(
          isTest ? '시험 환경에서 수정세금계산서(취소분)를 발급했습니다.' : '수정세금계산서(취소분)를 발급했습니다. 국세청 전송은 수정분 상세에서 확인하세요.',
        );
      } else toast('취소 결과를 확인하는 중입니다. 잠시 뒤 상태를 다시 확인하세요.', { icon: 'ℹ️' });
    } else if (result.kind === 'rejected') {
      toast.error(`${result.message} 결과를 다시 확인합니다.`);
    } else {
      toast.error(result.message);
    }
    setSending(false);
    // 잠금(inFlight)은 풀지 않는다 — 닫고 상세를 다시 읽어 결과를 본다
    onAttempted(result);
  };

  const inv = preview?.invoice ?? invoice;
  const corr = preview?.correction ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-boss-text/40" onClick={sending ? undefined : onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="세금계산서 취소"
        className="relative flex max-h-[92dvh] w-full max-w-[820px] flex-col border border-boss-error/35 bg-boss-surface shadow-boss-lg"
      >
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-boss-text">세금계산서 취소</p>
            <p className="mt-0.5 text-[12px] text-boss-text-secondary">
              {step === 'reason'
                ? '사유와 날짜를 고르면 서버가 팝빌 상태를 확인해 방법을 정합니다. 아직 아무것도 바뀌지 않았습니다.'
                : '아직 아무것도 취소 · 발급되지 않았습니다. 내용을 확인하고 세 가지를 체크해야 진행됩니다.'}
            </p>
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
          {step === 'reason' ? (
            <div className="flex flex-col gap-4">
              <dl className="border border-boss-border px-3 py-1">
                <DescRow label="원본 공급받는자" value={`${invoice.buyerName || '(상호 없음)'} · ${invoice.buyerBizNo || '-'}`} />
                <DescRow label="원본 작성일자" value={originDate || '-'} />
                <DescRow label="국세청 승인번호" value={invoice.approvalNo || '-'} />
                {/* 저장된 값이다 — 미리보기에서 팝빌 상태를 새로 읽어 방식을 정한다 */}
                <DescRow label="국세청 전송(저장된 값)" value={ntsLabel(invoice.ntsStatus)} />
                <DescRow label="원본 합계" value={won(invoice.totalAmount)} />
              </dl>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-[12px] font-semibold text-boss-text">취소 사유</legend>
                <div role="radiogroup" aria-label="취소 사유" className="flex flex-col gap-2">
                  {TAX_CANCEL_REASONS.map((r) => (
                    <RadioOption
                      key={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      label={r === 'CONTRACT_CANCEL' ? `${TAX_CANCEL_REASON_LABEL[r]} — 도배 공사 계약 해제` : TAX_CANCEL_REASON_LABEL[r]}
                      hint={`수정사유 ${TAX_CANCEL_MODIFY_CODE[r]}`}
                    />
                  ))}
                </div>
                {guide && <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">{guide.summary}</p>}
              </fieldset>

              {reason && guide?.dateLabel && (
                <div>
                  <Field
                    id="taxCancelDate"
                    label={guide.dateLabel}
                    required
                    type="date"
                    value={date}
                    min={originDate || undefined}
                    max={today}
                    onChange={(e) => setDate(e.target.value)}
                    onBlur={() => setDateTouched(true)}
                    aria-invalid={dateTouched && !!dateError}
                    aria-describedby={dateTouched && dateError ? 'taxCancelDate-error' : undefined}
                    hint={guide.dateHint}
                  />
                  {dateTouched && dateError && (
                    <p id="taxCancelDate-error" className="mt-1 text-[12px] text-boss-error">
                      {dateError}
                    </p>
                  )}
                </div>
              )}
              {reason === 'DUPLICATE' && guide && (
                <p className="text-[12px] leading-relaxed text-boss-text-secondary">{guide.dateHint}</p>
              )}

              <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
                전액 취소만 지원합니다. 일부 반품 · 공급가액 변동 · 기재사항 정정 · 영세율 전환은 여기서 처리하지 않으니 팝빌 또는 홈택스를 이용하세요.
                국세청 전송 전이면 고른 사유와 상관없이 발행취소로 처리됩니다.
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              <p className="text-[12.5px] text-boss-text-secondary">팝빌에서 문서 상태를 확인하고 있습니다…</p>
              <Skeleton className="h-10" />
              <Skeleton className="h-40" />
            </div>
          ) : error || !preview ? (
            <AlertBanner
              tone="bad"
              action={
                asked ? (
                  <Button variant="secondary" size="sm" onClick={() => void loadPreview(asked)}>
                    다시 시도
                  </Button>
                ) : undefined
              }
            >
              {error ?? '미리보기를 만들지 못했습니다.'}
            </AlertBanner>
          ) : (
            <div className="flex flex-col gap-4">
              {isTest ? (
                <AlertBanner tone="warn">시험 환경입니다. 국세청에 전송되지 않고 효력이 없으며, 발급 · 부가세 집계에서 빠집니다.</AlertBanner>
              ) : mode === 'CANCEL_ISSUE' ? (
                <AlertBanner tone="bad">실제 발행취소입니다. 취소하면 되돌릴 수 없습니다.</AlertBanner>
              ) : mode === 'CORRECTION' ? (
                <AlertBanner tone="bad">실제 발급입니다. 음수(-) 수정세금계산서가 국세청으로 전송되며 되돌리거나 다시 취소할 수 없습니다.</AlertBanner>
              ) : null}

              <dl className="grid gap-x-6 sm:grid-cols-2">
                <DescRow label="팝빌 상태(방금 확인)" value={providerStateText(preview.providerStateCode)} />
                <DescRow label="처리 방식" value={mode ? TAX_CANCEL_MODE_LABEL[mode] : '진행 불가'} />
              </dl>

              {blockers.length > 0 && (
                <div className="border border-boss-error/35 bg-boss-pill-bad px-4 py-3 text-[13px] text-boss-pill-bad-fg" role="alert">
                  <p className="font-semibold">진행할 수 없습니다.</p>
                  <ul className="mt-1.5 flex flex-col gap-0.5">
                    {blockers.map((m, i) => (
                      <li key={`${i}-${m}`}>· {m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {mode === 'CANCEL_ISSUE' && (
                <>
                  <p className="text-[13px] leading-relaxed text-boss-text">
                    아직 국세청으로 전송되지 않아 <strong>발행 자체를 취소</strong>합니다. 수정세금계산서는 만들지 않습니다. 취소 후 이 세금계산서는
                    &lsquo;발행취소 완료&rsquo;로 바뀌고 발행 · 부가세 집계에서 빠집니다.
                  </p>
                  <dl className="border border-boss-border px-3 py-1">
                    <DescRow label="공급받는자" value={`${inv.buyerName || '(상호 없음)'} · ${inv.buyerBizNo || '-'}`} />
                    <DescRow label="작성일자" value={isoDateOf(inv.issueDate) || '-'} />
                    <DescRow label="국세청 승인번호" value={inv.approvalNo || '-'} />
                    <DescRow label="합계(전액)" value={won(inv.totalAmount)} />
                  </dl>
                </>
              )}

              {mode === 'CORRECTION' && corr && (
                <>
                  <p className="text-[13px] leading-relaxed text-boss-text">
                    국세청 전송이 끝난 세금계산서는 지울 수 없어, 전액을 차감하는 <strong>음수(-) 수정세금계산서 1장</strong>을 새로 발급합니다. 원본은
                    그대로 남고, 발급되면 원본과 함께 신고 · 집계됩니다.
                  </p>
                  <DataTable>
                    <thead>
                      <tr>
                        <th>구분</th>
                        <th>작성일자</th>
                        <th className="num">공급가액</th>
                        <th className="num">세액</th>
                        <th className="num">합계</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-semibold text-boss-text">원본 (발급 완료)</td>
                        <td className="font-boss-head tabular-nums">{isoDateOf(inv.issueDate) || '-'}</td>
                        <td className="num">{fmt(inv.supplyAmount)}</td>
                        <td className="num">{fmt(inv.vatAmount)}</td>
                        <td className="num">{fmt(inv.totalAmount)}</td>
                      </tr>
                      <tr>
                        <td className="wrap font-semibold text-boss-text">
                          수정분(취소분) <span className="font-normal text-boss-text-muted">· 미발급 미리보기</span>
                        </td>
                        <td className="font-boss-head tabular-nums">{isoDateOf(corr.issueDate) || '-'}</td>
                        <td className="num">{fmt(corr.supplyAmount)}</td>
                        <td className="num">{fmt(corr.vatAmount)}</td>
                        <td className="num">{fmt(corr.totalAmount)}</td>
                      </tr>
                      <tr>
                        <td className="wrap text-boss-text-secondary">발급 후 예상 순합계</td>
                        <td className="text-boss-text-muted">예상</td>
                        <td className="num">{fmt(inv.supplyAmount + corr.supplyAmount)}</td>
                        <td className="num">{fmt(inv.vatAmount + corr.vatAmount)}</td>
                        <td className="num font-semibold">{fmt(inv.totalAmount + corr.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </DataTable>
                  <p className="-mt-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
                    순합계는 수정분이 발급된 뒤의 예상입니다. 발급이 확정되기 전에는 목록 · 집계에 수정분이 들어가지 않습니다. 작성일자가 다른 분기면
                    수정분은 그 분기에 음수로 반영됩니다.
                  </p>

                  <div className="border border-boss-border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-boss-text-secondary">미발급 수정분 미리보기</p>
                      <Tag tone="neutral">아직 발급 전</Tag>
                    </div>
                    <dl>
                      <DescRow
                        label="수정사유"
                        value={corr.modifyCode != null ? `${MODIFY_CODE_LABEL[corr.modifyCode] ?? '수정사유'}(${corr.modifyCode})` : '-'}
                      />
                      <DescRow label="작성일자(적용 일자)" value={isoDateOf(preview.occurrenceDate) || '-'} />
                      <DescRow label="당초 승인번호" value={corr.orgNtsConfirmNum || '-'} />
                      <DescRow label="당초 작성일자" value={originIssueDateText(corr)} />
                      <DescRow
                        label="공급자(발급 당시)"
                        value={preview.supplier ? `${preview.supplier.name} · ${preview.supplier.bizNo}` : '정보 없음'}
                      />
                      <DescRow label="공급받는자" value={`${corr.buyerName || '(상호 없음)'} · ${corr.buyerBizNo || '-'}`} />
                    </dl>
                  </div>

                  {corr.items.length > 0 && (
                    <DataTable>
                      <thead>
                        <tr>
                          <th>일자</th>
                          <th>품목</th>
                          <th className="num">수량</th>
                          <th className="num">공급가액</th>
                          <th className="num">세액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {corr.items.map((it, i) => (
                          <tr key={i}>
                            <td className="font-boss-head tabular-nums text-boss-text-secondary">{it.date ?? '-'}</td>
                            <td className="wrap text-boss-text">{it.name || '-'}</td>
                            <td className="num">{fmt(it.qty)}</td>
                            <td className="num">{fmt(it.supplyAmount)}</td>
                            <td className="num text-boss-text-secondary">{fmt(it.vatAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  )}
                </>
              )}

              {sendError && <AlertBanner tone="bad">{sendError}</AlertBanner>}

              {mode && (
                <fieldset className="flex flex-col gap-2 border border-boss-border bg-boss-bg p-4" disabled={blocked || sending}>
                  <legend className="px-1 text-[12px] font-semibold text-boss-text">최종 확인</legend>
                  <CheckLine checked={checks.target} onChange={(v) => setChecks((c) => ({ ...c, target: v }))} disabled={blocked || sending}>
                    {mode === 'CANCEL_ISSUE'
                      ? `취소할 원본이 맞습니다 — ${inv.buyerName || '(상호 없음)'} · ${isoDateOf(inv.issueDate) || '-'} · 승인번호 ${inv.approvalNo || '-'}`
                      : `수정사유와 작성일자가 맞습니다 — ${corr ? correctionReasonText(corr) : '-'} · ${isoDateOf(preview.occurrenceDate) || '-'}`}
                  </CheckLine>
                  <CheckLine checked={checks.amounts} onChange={(v) => setChecks((c) => ({ ...c, amounts: v }))} disabled={blocked || sending}>
                    {mode === 'CANCEL_ISSUE'
                      ? `수정세금계산서 없이 ${won(inv.totalAmount)} 전액의 발행을 취소합니다`
                      : `원본 ${won(inv.totalAmount)} · 수정분 ${won(corr?.totalAmount)} · 발급 후 예상 순합계 ${won(inv.totalAmount + (corr?.totalAmount ?? 0))}, 당초 승인번호 ${corr?.orgNtsConfirmNum || '-'}를 확인했습니다`}
                  </CheckLine>
                  <CheckLine checked={checks.final} onChange={(v) => setChecks((c) => ({ ...c, final: v }))} disabled={blocked || sending}>
                    {isTest
                      ? '시험 환경이며 효력이 없다는 것을 확인했습니다'
                      : mode === 'CANCEL_ISSUE'
                        ? '실제 발행취소이며 되돌릴 수 없다는 것을 확인했습니다'
                        : '실제 발급이며 국세청으로 전송되어 되돌릴 수 없다는 것을 확인했습니다'}
                  </CheckLine>
                </fieldset>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-boss-border px-5 py-3">
          <div className="flex flex-wrap gap-1">
            {step === 'preview' && (
              <>
                <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={backToReason} disabled={sending}>
                  사유 · 날짜 바꾸기
                </Button>
                {asked && (
                  <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void loadPreview(asked)} disabled={loading || sending}>
                    미리보기 새로 받기
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={sending}>
              닫기
            </Button>
            {step === 'reason' ? (
              <Button variant="primary" onClick={startPreview} disabled={!reason || (dateTouched && !!dateError)}>
                상태 확인 · 미리보기
              </Button>
            ) : (
              <Button variant={isTest ? 'primary' : 'danger'} onClick={() => void send()} disabled={!canSend}>
                {sending
                  ? '요청 중…'
                  : mode === 'CORRECTION'
                    ? isTest
                      ? '시험 수정발급'
                      : '수정세금계산서 발급'
                    : isTest
                      ? '시험 발행취소'
                      : '발행취소'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 상세 좌측 — 원본 ↔ 수정분 연결 카드(양방향 링크)
// ─────────────────────────────────────────────
export function TaxCancelLinkPanel({ invoice }: { invoice: TaxInvoice }) {
  const isCorrection = invoice.correctionOfInvoiceId != null;
  const linkedId = isCorrection ? (invoice.correctionOfInvoiceId ?? null) : (invoice.taxCancelInvoiceId ?? null);
  const [linked, setLinked] = useState<TaxInvoice | null>(null);
  const [failed, setFailed] = useState(false);

  // 연결 문서는 우리 서버에서만 읽는다(외부 조회 없음). 이 문서가 다시 읽히면(상태 확인 등) 연결 문서도 다시 읽는다
  useEffect(() => {
    if (linkedId == null) return;
    let alive = true;
    setFailed(false);
    (async () => {
      try {
        const res = await bossTaxInvoiceApi.get(linkedId);
        if (!alive) return;
        if (res.success !== false && res.data) setLinked(res.data);
        else setFailed(true);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [linkedId, invoice]);

  if (linkedId == null) return null;
  const ls = linked ? displayState(linked) : null;
  const loadingText = failed ? '불러오지 못함' : '불러오는 중…';

  if (isCorrection) {
    const canceled = invoice.status === 'CANCELED';
    return (
      <Panel
        kicker="수정세금계산서(취소분)"
        title={canceled ? '발행취소된 수정분입니다 — 원본을 차감하지 않습니다' : '원본 세금계산서를 전액 차감하는 음수 수정분입니다'}
        right={
          <ButtonLink href={`/boss/tax-invoice/${linkedId}`} variant="secondary" size="sm">
            원본 보기
          </ButtonLink>
        }
      >
        {canceled && (
          <div className="mb-2">
            <AlertBanner tone="bad">
              이 수정분은 팝빌에서 발행취소되어 효력이 없고 집계에서 빠집니다. 원본의 취소는 확정되지 않았습니다 — 원본에서 상태를 다시 확인하세요.
              이 수정분은 다시 발급 · 다시 취소할 수 없습니다.
            </AlertBanner>
          </div>
        )}
        <dl>
          <DescRow label="수정사유" value={correctionReasonText(invoice)} />
          <DescRow label="당초 승인번호" value={invoice.orgNtsConfirmNum || '확인 필요'} />
          <DescRow label="당초 작성일자(비고)" value={originIssueDateText(invoice)} />
          <DescRow label="원본 상태" value={ls ? <Tag tone={ls.tone}>{ls.label}</Tag> : loadingText} />
          <DescRow label="원본 합계" value={linked ? won(linked.totalAmount) : loadingText} />
        </dl>
        <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
          원본은 지워지지 않고 그대로 남습니다. 원본과 이 수정분을 함께 보관하고, 신고 · 집계에는 둘이 함께 들어갑니다. 이 수정분은 수정 · 삭제 ·
          다시 발급 · 다시 취소할 수 없습니다.
        </p>
      </Panel>
    );
  }

  const linkedCanceled = linked?.status === 'CANCELED';
  return (
    <Panel
      kicker="수정세금계산서(취소분) 연결"
      title="이 원본을 전액 차감하는 수정분이 따로 있습니다"
      right={
        <ButtonLink href={`/boss/tax-invoice/${linkedId}`} variant="secondary" size="sm" icon={FileMinus2}>
          수정분 보기
        </ButtonLink>
      }
    >
      {linkedCanceled && (
        <div className="mb-2">
          <AlertBanner tone="bad">
            연결된 수정분이 발행취소되어 원본을 차감하지 않습니다. 원본 금액은 그대로 집계됩니다. 다시 취소하지 말고 상태 다시 확인으로 결과를 확인하세요.
          </AlertBanner>
        </div>
      )}
      <dl>
        <DescRow label="수정분 상태" value={ls ? <Tag tone={ls.tone}>{ls.label}</Tag> : loadingText} />
        <DescRow label="수정분 국세청 전송" value={linked ? ntsLabel(linked.ntsStatus) : loadingText} />
        <DescRow label="수정사유" value={linked ? correctionReasonText(linked) : invoice.taxCancelReason ? TAX_CANCEL_REASON_LABEL[invoice.taxCancelReason] : '-'} />
        <DescRow label="수정분 작성일자" value={(linked && isoDateOf(linked.issueDate)) || isoDateOf(invoice.taxCancelDate) || '-'} />
        <DescRow label="수정분 합계" value={linked ? won(linked.totalAmount) : loadingText} />
      </dl>
      <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
        이 문서는 원본 그대로입니다. 수정분이 발급되면 원본과 함께 신고 · 집계되어 합계가 0원이 됩니다. 수정분 발급이 확정되기 전에는 집계에 들어가지
        않습니다.
      </p>
    </Panel>
  );
}
