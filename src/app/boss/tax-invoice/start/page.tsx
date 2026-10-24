'use client';

// 전자 발급 시작하기 — 한 화면에 한 가지만 묻는 단계별 절차 (2026-10-25)
//
// 사장님 요청: "토스 · 카카오처럼 묻지도 따지지도 않고 페이지마다 시키는 것만 하면 끝나게."
// 위: 진행 막대(6칸) · 뒤로 · 닫기 / 가운데: 큰 제목 한 줄 + 칸 한두 개 / 아래: 큰 단추 하나.
// 서버 등록 단계로 "어디까지 왔는지"를 정하고(taxSetupFlow.anchorStep), 사업자 정보 · 팝빌 계정은 화면 안에서 한 칸씩 묻는다.
// 회사 정보가 없으면 같은 칸으로 회사를 만들고 이어서 신청한다. 신청 · 가입 결과를 모르면 다시 보내지 않고 다시 확인부터 한다
// (등록 화면 registration/page.tsx 와 같은 원칙). 한 화면에서 자세히 보는 기존 등록 화면은 그대로 두고 연결만 한다.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, CheckLine, Skeleton } from '@/components/boss/ui';
import { Note } from '@/components/boss/taxinvoice/RegistrationParts';
import { bossTaxInvoiceApi, type RegistrationCall } from '@/lib/api/boss/taxinvoice';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { maskBizNo, formatBizNo } from '@/lib/boss/bizno';
import { useElectronicTaxInvoiceLaunch } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { useBoundedRefresh } from '@/lib/boss/useBoundedRefresh';
import { TAX_SUBSCRIPTION_PRICE } from '@/lib/boss/taxInvoiceSubscription';
import {
  EMPTY_SUPPLIER,
  SUPPLIER_LABEL,
  SUPPLIER_MAX,
  effectiveStage,
  formatSupplierPhone,
  normalizeSupplier,
  supplierFormValue,
  supplierFromCompany,
  type LinkCredentials,
  type LinkErrors,
  type SupplierErrors,
  type SupplierField,
} from '@/lib/boss/taxInvoiceRegistration';
import {
  BIZ_KIND_CHOICES,
  BIZ_TYPE_CHOICES,
  STAGE_NAMES,
  SUPPLIER_STEPS,
  anchorStep,
  linkStepErrors,
  nextStep,
  passwordChecks,
  readChoice,
  saveChoice,
  stageIndex,
  suggestMemberId,
  supplierStepErrors,
  type SetupChoice,
  type SetupStep,
} from '@/lib/boss/taxSetupFlow';
import type { ElectronicRegistrationStatus, TaxInvoiceSubscriptionStatus, TaxInvoiceSupplier } from '@/types/boss-taxinvoice';

const POPBILL_TERMS_URL = 'https://www.popbill.com/Policy/Agreement';
const POPBILL_PRIVACY_URL = 'https://www.popbill.com/Policy/Privacy';
const LIST_HREF = '/boss/tax-invoice';

export default function TaxSetupPage() {
  const scope = useBossScope();
  // 로그인 확인 전 · 계정 바뀌는 중에는 사업자 정보를 그리지 않는다(공용 PC)
  if (!scope) return <Skeleton className="mx-auto h-80 w-full max-w-[560px]" />;
  return <SetupFlow key={scope} scope={scope} />;
}

type Feedback = { tone: 'bad' | 'warn' | 'ok'; text: string };

function SetupFlow({ scope }: { scope: string }) {
  const router = useRouter();
  const { taxOpen, cashOpen } = useElectronicTaxInvoiceLaunch();
  const userId = BossAuthManager.getUserInfo()?.userId ?? null;

  const [status, setStatus] = useState<ElectronicRegistrationStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashReady, setCashReady] = useState(false);
  const [choice, setChoiceState] = useState<SetupChoice | null>(() => readChoice(userId));
  const [picked, setPicked] = useState<SetupChoice>('BOTH');
  const [step, setStep] = useState<SetupStep | null>(null);
  const history = useRef<SetupStep[]>([]);

  const [supplier, setSupplier] = useState<TaxInvoiceSupplier>({ ...EMPTY_SUPPLIER });
  const [errors, setErrors] = useState<SupplierErrors>({});
  const seeded = useRef(false);
  const [cred, setCred] = useState<LinkCredentials>({ memberId: '', password: '', passwordConfirm: '' });
  const [linkErrors, setLinkErrors] = useState<LinkErrors>({});
  const [consent, setConsent] = useState(false);
  const [linkConsent, setLinkConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [needsRecheck, setNeedsRecheck] = useState(false);
  const [certOpened, setCertOpened] = useState(false);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<TaxInvoiceSubscriptionStatus | null>(null);

  const mounted = useRef(false);
  const inFlight = useRef(false);
  const stepRef = useRef<SetupStep | null>(null);
  const choiceRef = useRef<SetupChoice | null>(choice);
  // 확인 화면에서 '고치기'로 들어온 칸은 '다음'을 누르면 확인 화면으로 바로 돌아간다
  const returnToConfirm = useRef(false);
  // 이번 화면에서 회사를 이미 만들었다 — 신청만 실패해 다시 눌러도 회사를 또 만들지 않는다
  const companyMade = useRef(false);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    choiceRef.current = choice;
  }, [choice]);

  const go = useCallback((next: SetupStep, remember = true) => {
    if (remember && stepRef.current) history.current.push(stepRef.current);
    stepRef.current = next;
    setStep(next);
    setFeedback(null);
    setErrors({});
    setLinkErrors({});
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  /** 신청서를 처음 한 번 채운다 — 신청한 내용 → 회사 정보 → 계정 연락처 */
  const seedSupplier = useCallback(
    async (s: ElectronicRegistrationStatus) => {
      if (seeded.current) return;
      let seed: TaxInvoiceSupplier | null = s.supplier;
      if (!seed && s.stage !== 'NEED_COMPANY') {
        const companyId = BossAuthManager.getUserInfo()?.companyId;
        if (companyId) {
          const company = await bossCompanyApi.get(companyId);
          if (company.success && company.data) seed = supplierFromCompany(company.data);
        }
      }
      if (!mounted.current || !isCurrentScope(scope) || seeded.current) return;
      const me = BossAuthManager.getUserInfo();
      const value = supplierFormValue(seed ?? { ...EMPTY_SUPPLIER, email: me?.email ?? '', phone: me?.phone ?? '' });
      if (!value.email && me?.email) value.email = me.email;
      if (!value.phone && me?.phone) value.phone = formatSupplierPhone(me.phone);
      seeded.current = true;
      setSupplier(value);
    },
    [scope],
  );

  /** 서버 단계를 다시 읽는다. jump = 지금 화면과 상관없이 서버 단계의 첫 화면으로 */
  const refresh = useCallback(
    async (jump = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      try {
        const result = await bossTaxInvoiceApi.registrationStatus();
        if (!mounted.current || !isCurrentScope(scope)) return;
        if (!result.ok) {
          setLoadError(result.message);
          return;
        }
        const s = result.status;
        setStatus(s);
        setLoadError(null);
        setNeedsRecheck(false);
        // 현금영수증은 공동인증서 없이 준비된다(서버 판정) — 팝빌 가입 뒤에만 의미가 있다
        let cash = false;
        if (s.stage === 'NEEDS_CERTIFICATE' || s.stage === 'READY') {
          const cfg = await bossTaxInvoiceApi.electronicConfig('CASH').catch(() => null);
          cash = !!(cfg?.success && cfg.data?.ready);
          if (!mounted.current || !isCurrentScope(scope)) return;
        }
        setCashReady(cash);
        const stage = effectiveStage(s);
        if (stage === 'NEED_COMPANY' || stage === 'NOT_REGISTERED' || stage === 'REJECTED' || stage === 'PENDING_VERIFICATION') {
          void seedSupplier(s);
        }
        const anchor = anchorStep(s, choiceRef.current, cash);
        const current = stepRef.current;
        // 심사 기다리는 중에 신청 내용을 고치고 있으면 그대로 둔다(창을 다시 눌러도 튕기지 않게)
        const editingWhilePending = anchor === 'pending' && current != null && stageIndex(current) === 1;
        // 서버 단계가 바뀌었으면(승인 · 가입 · 인증서) 그 단계 첫 화면으로. 같은 단계 안에서 칸을 채우는 중이면 그대로 둔다
        if (jump || !current || (stageIndex(current) !== stageIndex(anchor) && !editingWhilePending)) {
          history.current = [];
          returnToConfirm.current = false;
          stepRef.current = anchor;
          setStep(anchor);
          setFeedback(null);
        }
      } finally {
        inFlight.current = false;
        if (mounted.current) setLoading(false);
      }
    },
    [scope, seedSupplier],
  );

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      mounted.current = false;
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  // 심사 기다리는 동안 정해진 횟수만 다시 읽는다(등록 화면과 같은 도구)
  useBoundedRefresh({ enabled: step === 'pending' && !busy, run: () => refresh(), refreshOnResume: false });

  // 끝난 화면에서는 무료 기간을 보여 준다
  useEffect(() => {
    if (step !== 'doneTax' && step !== 'doneCash') return;
    let alive = true;
    void bossTaxInvoiceApi.electronicSubscription().then((r) => {
      if (alive && isCurrentScope(scope) && r.success && r.data) setSubscription(r.data);
    });
    return () => {
      alive = false;
    };
  }, [step, scope]);

  const back = () => {
    returnToConfirm.current = false;
    const prev = history.current.pop();
    if (prev) {
      setStep(prev);
      setFeedback(null);
    } else {
      router.push(LIST_HREF);
    }
  };

  const chooseAndGo = (c: SetupChoice) => {
    saveChoice(userId, c);
    setChoiceState(c);
    choiceRef.current = c;
  };

  const updateSupplier = (field: SupplierField, value: string) => {
    setSupplier((s) => ({ ...s, [field]: field === 'bizNo' ? maskBizNo(value) : value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  /** 사업자 정보 한 화면 '다음' */
  const nextSupplier = () => {
    if (!step) return;
    const errs = supplierStepErrors(step, supplier);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (returnToConfirm.current) {
      returnToConfirm.current = false;
      go('confirm', false);
      history.current = history.current.filter((h) => h !== 'confirm');
      return;
    }
    const n = nextStep(step);
    if (n) go(n);
  };

  const finish = (result: RegistrationCall, action: '신청' | '가입') => {
    if (!isCurrentScope(scope)) return;
    if (result.ok) {
      setStatus(result.status);
      setNeedsRecheck(false);
      history.current = [];
      void refresh(true);
      return;
    }
    // 가입은 결과를 모르면 다시 보내면 안 된다(팝빌에 두 번 갈 수 있다) — 다시 확인부터
    const uncertain = action === '가입' || result.failure === 'network' || result.failure === 'unconfirmed';
    setNeedsRecheck(uncertain);
    setFeedback({
      tone: uncertain ? 'warn' : 'bad',
      text: uncertain
        ? `${result.message} ${action} 결과를 확인하지 못했어요. 아래 '다시 확인'을 눌러 주세요.`
        : `${result.message} 입력한 내용은 그대로 있어요. 고친 뒤 다시 눌러 주세요.`,
    });
  };

  /** 신청 — 회사 정보가 없으면 같은 칸으로 회사를 먼저 만든다 */
  const submit = async () => {
    if (inFlight.current || !status || needsRecheck) return;
    const errs = supplierStepErrors('confirm', supplier);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFeedback({ tone: 'bad', text: '빠진 칸이 있어요. 해당 줄의 고치기를 눌러 채워 주세요.' });
      return;
    }
    if (!consent) {
      setFeedback({ tone: 'bad', text: '아래 동의에 체크해야 신청할 수 있어요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const value = normalizeSupplier(supplier);
      if (status.stage === 'NEED_COMPANY' && !companyMade.current) {
        const created = await bossCompanyApi.create({
          name: value.name,
          owner: value.ceo,
          bizno: value.bizNo,
          phone: value.phone,
          email: value.email,
          address1: value.address,
          type: value.bizType,
          kind: value.bizKind,
        });
        if (!isCurrentScope(scope)) return;
        if (!created.success || !created.data?.id) {
          setFeedback({ tone: 'bad', text: created.error || created.message || '회사 정보를 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.' });
          return;
        }
        companyMade.current = true;
        const cached = BossAuthManager.getUserInfo();
        if (cached) BossAuthManager.setUserInfo({ ...cached, companyId: created.data.id });
      }
      const result = await bossTaxInvoiceApi.submitRegistration({ supplier: value, consent: true });
      if (mounted.current) finish(result, '신청');
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const nextLink = () => {
    if (!step) return;
    const errs = linkStepErrors(step, cred);
    if (Object.keys(errs).length) {
      setLinkErrors(errs);
      return;
    }
    const n = nextStep(step);
    if (n) go(n);
  };

  const link = async () => {
    if (inFlight.current || needsRecheck || status?.stage !== 'VERIFIED' || status.memberLinked !== false) return;
    const errs = linkStepErrors('linkConfirm', cred);
    if (Object.keys(errs).length) {
      setLinkErrors(errs);
      setFeedback({ tone: 'bad', text: '아이디나 비밀번호를 다시 확인해 주세요. 뒤로 가서 고칠 수 있어요.' });
      return;
    }
    if (!linkConsent) {
      setFeedback({ tone: 'bad', text: '아래 동의에 체크해야 계정을 만들 수 있어요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFeedback(null);
    const { memberId, password } = cred;
    // 보내는 순간 비밀번호를 화면 상태에서 지운다(저장 · 기록 금지)
    setCred({ memberId, password: '', passwordConfirm: '' });
    try {
      const result = await bossTaxInvoiceApi.linkMember({ memberId, password, consent: true });
      if (mounted.current) finish(result, '가입');
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const openCertificate = async () => {
    if (inFlight.current || status?.memberLinked !== true) return;
    inFlight.current = true;
    setBusy(true);
    setFeedback(null);
    const popup = window.open('', '_blank');
    if (popup) popup.opener = null;
    try {
      const result = await bossTaxInvoiceApi.certificateUrl();
      if (!isCurrentScope(scope)) throw new Error('scope');
      const raw = result.success && result.data?.url ? result.data.url : null;
      const url = raw ? new URL(raw) : null;
      if (!url || url.protocol !== 'https:') throw new Error('certificate-url');
      if (popup) popup.location.href = url.href;
      if (mounted.current) {
        setCertUrl(url.href);
        setCertOpened(true);
      }
    } catch {
      popup?.close();
      if (mounted.current) setFeedback({ tone: 'bad', text: '인증서 등록 화면을 열지 못했어요. 잠시 뒤 다시 눌러 주세요.' });
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  /** 인증서 등록을 마쳤다고 누름 — 서버가 확인하면 끝 화면으로 간다 */
  const checkCertificate = async () => {
    await refresh(true);
    if (mounted.current && stepRef.current === 'certificate') {
      setFeedback({
        tone: 'warn',
        text: '아직 인증서가 확인되지 않았어요. 팝빌 화면에서 등록을 끝까지 마쳤는지 확인하고 다시 눌러 주세요.',
      });
    }
  };

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(done);
    } catch {
      toast.error('복사하지 못했어요. 직접 적어 두세요.');
    }
  };

  const memberIdSuggestion = useMemo(() => suggestMemberId(status?.supplier?.bizNo ?? supplier.bizNo), [status?.supplier?.bizNo, supplier.bizNo]);
  useEffect(() => {
    if (step === 'linkId' && !cred.memberId && memberIdSuggestion) setCred((c) => ({ ...c, memberId: memberIdSuggestion }));
  }, [step, cred.memberId, memberIdSuggestion]);

  // ───────── 화면 ─────────

  if (!step) {
    return (
      <Shell stage={0} onBack={back}>
        {loadError ? (
          <>
            <Title>지금은 상태를 불러오지 못했어요</Title>
            <Note tone="warn">{loadError}</Note>
            <Bottom>
              <Big onClick={() => void refresh(true)} disabled={loading}>{loading ? '확인 중…' : '다시 시도'}</Big>
            </Bottom>
          </>
        ) : (
          <Skeleton className="h-72" />
        )}
      </Shell>
    );
  }

  const stage = stageIndex(step);
  const rejected = status ? effectiveStage(status) === 'REJECTED' : false;
  const recheck = needsRecheck ? (
    <Button variant="secondary" className="w-full" disabled={loading} onClick={() => void refresh(true)}>
      {loading ? '확인 중…' : '다시 확인'}
    </Button>
  ) : null;

  const supplierInput = (field: SupplierField, opts: { placeholder?: string; inputMode?: 'numeric' | 'email' | 'tel'; autoComplete?: string } = {}) => (
    <BigField
      key={field}
      id={`setup-${field}`}
      label={SUPPLIER_LABEL[field]}
      value={supplier[field]}
      maxLength={SUPPLIER_MAX[field]}
      error={errors[field]}
      placeholder={opts.placeholder}
      inputMode={opts.inputMode}
      autoComplete={opts.autoComplete ?? 'off'}
      onChange={(v) => updateSupplier(field, v)}
      onEnter={nextSupplier}
    />
  );

  let screen: ReactNode;
  switch (step) {
    case 'intro':
      screen = (
        <>
          <Title sub="처음 한 번만 하면 돼요. 회사 정보로 미리 채워 둘게요.">{'전자세금계산서 · 현금영수증\n화면이 시키는 대로만 하면 돼요'}</Title>
          <ol className="flex flex-col gap-3">
            {[
              ['사업자 정보 확인', '회사 정보로 미리 채워 둬요. 맞는지만 보세요.'],
              ['도배르만 확인 기다리기', '확인되면 알림으로 알려 드려요.'],
              ['발급용 팝빌 계정 만들기', '아이디 · 비밀번호만 정하면 돼요.'],
              ['공동인증서 등록', '세금계산서만 필요해요. 현금영수증은 없어도 돼요.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3 border border-boss-border bg-boss-surface px-4 py-3">
                <span className="grid h-7 w-7 flex-none place-items-center bg-boss-primary text-[13px] font-semibold text-boss-bg">{i + 1}</span>
                <span className="min-w-0">
                  <b className="block text-[15px] text-boss-text">{t}</b>
                  <span className="text-[13px] text-boss-text-secondary">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="break-keep text-[13px] leading-relaxed text-boss-text-secondary">
            준비물: 사업자등록증 · (세금계산서) 사업자용 공동인증서. 공동인증서를 등록한 날부터 1개월 무료예요.
          </p>
          <Bottom>
            <Big onClick={() => go('choose')}>시작하기</Big>
          </Bottom>
        </>
      );
      break;

    case 'choose':
      screen = (
        <>
          <Title sub="나중에 바꿀 수 있어요.">무엇을 발급하실 건가요?</Title>
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="발급할 문서">
            {(
              [
                ['BOTH', '세금계산서 · 현금영수증 둘 다', '공동인증서 등록까지 해요 (추천)'],
                ['CASH', '현금영수증만', '공동인증서 없이 바로 쓸 수 있어요'],
              ] as const
            ).map(([value, t, d]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={picked === value}
                onClick={() => setPicked(value)}
                className={`flex items-center gap-3 border px-4 py-4 text-left transition-colors ${
                  picked === value ? 'border-boss-primary bg-boss-primary/5' : 'border-boss-border bg-boss-surface'
                }`}
              >
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-full border-2 ${
                    picked === value ? 'border-boss-primary bg-boss-primary text-boss-bg' : 'border-boss-border-hover'
                  }`}
                >
                  {picked === value && <Check size={14} strokeWidth={3} />}
                </span>
                <span>
                  <b className="block text-[16px] text-boss-text">{t}</b>
                  <span className="text-[13px] text-boss-text-secondary">{d}</span>
                </span>
              </button>
            ))}
          </div>
          <Bottom>
            <Big
              onClick={() => {
                chooseAndGo(picked);
                const n = nextStep('choose');
                if (n) go(n);
              }}
            >
              다음
            </Big>
          </Bottom>
        </>
      );
      break;

    case 'bizno':
      screen = (
        <>
          {rejected && status?.reviewReason && (
            <Note tone="bad">
              <b>지난 신청이 반려됐어요</b>
              <span className="mt-1 block whitespace-pre-wrap">{status.reviewReason}</span>
              <span className="mt-1 block">아래 내용을 고쳐 다시 신청해 주세요.</span>
            </Note>
          )}
          <Title sub="사업자등록증에 있는 10자리 번호예요.">사업자등록번호를 확인해 주세요</Title>
          {supplierInput('bizNo', { placeholder: '000-00-00000', inputMode: 'numeric' })}
          <Bottom>
            <Big onClick={nextSupplier}>{supplier.bizNo ? '맞아요' : '다음'}</Big>
          </Bottom>
        </>
      );
      break;

    case 'names':
      screen = (
        <>
          <Title sub="사업자등록증에 적힌 그대로예요.">상호와 대표자 이름이 맞나요?</Title>
          {supplierInput('name', { placeholder: '예) 한빛도배' })}
          {supplierInput('ceo', { placeholder: '예) 홍길동' })}
          <Bottom>
            <Big onClick={nextSupplier}>{supplier.name && supplier.ceo ? '맞아요' : '다음'}</Big>
          </Bottom>
        </>
      );
      break;

    case 'address':
      screen = (
        <>
          <Title sub="사업자등록증의 사업장 주소와 같게 적어 주세요.">사업장 주소를 확인해 주세요</Title>
          {supplierInput('address', { placeholder: '예) 경기도 화성시 동탄대로 1, 101호' })}
          <Bottom>
            <Big onClick={nextSupplier}>{supplier.address ? '맞아요' : '다음'}</Big>
          </Bottom>
        </>
      );
      break;

    case 'business':
      screen = (
        <>
          <Title sub="사업자등록증에 적힌 대로가 가장 좋아요. 잘 모르면 아래에서 누르세요.">업태와 종목을 알려 주세요</Title>
          {supplierInput('bizType', { placeholder: '예) 건설업' })}
          <Chips values={BIZ_TYPE_CHOICES} onPick={(v) => updateSupplier('bizType', v)} current={supplier.bizType} />
          {supplierInput('bizKind', { placeholder: '예) 도배공사' })}
          <Chips values={BIZ_KIND_CHOICES} onPick={(v) => updateSupplier('bizKind', v)} current={supplier.bizKind} />
          <Bottom>
            <Big onClick={nextSupplier}>다음</Big>
          </Bottom>
        </>
      );
      break;

    case 'contact':
      screen = (
        <>
          <Title sub="발급 결과와 안내를 받을 곳이에요.">이메일과 연락처를 확인해 주세요</Title>
          {supplierInput('email', { placeholder: 'tax@example.com', inputMode: 'email', autoComplete: 'email' })}
          {supplierInput('phone', { placeholder: '010-1234-5678', inputMode: 'tel', autoComplete: 'tel' })}
          <Bottom>
            <Big onClick={nextSupplier}>다음</Big>
          </Bottom>
        </>
      );
      break;

    case 'confirm': {
      const editStep = (field: SupplierField) => SUPPLIER_STEPS.find((s) => s.fields.includes(field))?.step ?? 'bizno';
      const rows: SupplierField[] = ['bizNo', 'name', 'ceo', 'address', 'bizType', 'bizKind', 'email', 'phone'];
      screen = (
        <>
          <Title sub={status?.stage === 'NEED_COMPANY' ? '이 정보로 회사 정보도 함께 등록해요.' : '틀린 곳이 있으면 고치기를 누르세요.'}>
            이대로 신청할까요?
          </Title>
          <dl className="divide-y divide-boss-border-row border border-boss-border bg-boss-surface">
            {rows.map((f) => (
              <div key={f} className="flex items-start gap-3 px-4 py-3">
                <dt className="w-24 flex-none text-[13px] text-boss-text-secondary">{SUPPLIER_LABEL[f]}</dt>
                <dd className="min-w-0 flex-1 break-all text-[14.5px] text-boss-text">
                  {f === 'bizNo' ? formatBizNo(supplier.bizNo) : supplier[f] || <span className="text-boss-error">비어 있어요</span>}
                  {errors[f] && <span className="mt-0.5 block text-[12px] text-boss-error">{errors[f]}</span>}
                </dd>
                <button
                  type="button"
                  className="flex-none text-[13px] font-semibold text-boss-primary"
                  onClick={() => {
                    returnToConfirm.current = true;
                    go(editStep(f));
                  }}
                >
                  고치기
                </button>
              </div>
            ))}
          </dl>
          <div className="border border-boss-border bg-boss-inset px-4 py-3">
            <CheckLine checked={consent} onChange={setConsent} disabled={busy}>
              입력한 사업자 정보를 저장하고, 도배르만 운영팀에 전자세금계산서 발급 권한 확인을 신청하는 데 동의합니다.
            </CheckLine>
          </div>
          <p className="break-keep text-[13px] leading-relaxed text-boss-text-secondary">
            신청하면 도배르만이 사업자 정보를 확인해요. 확인되면 다음 단계가 열려요.
          </p>
          <Bottom>
            {recheck}
            <Big onClick={() => void submit()} disabled={busy || needsRecheck}>{busy ? '신청하는 중…' : '신청하기'}</Big>
          </Bottom>
        </>
      );
      break;
    }

    case 'pending':
      screen = (
        <>
          <Done />
          <Title sub="도배르만이 사업자 정보를 확인하고 있어요. 확인이 끝나면 알림으로 알려 드려요. 이 화면은 닫으셔도 돼요.">
            신청을 받았어요
          </Title>
          {status?.submittedAt && <p className="text-[13px] text-boss-text-secondary">신청 시각 {status.submittedAt.replace('T', ' ').slice(0, 16)}</p>}
          <Bottom>
            <Big onClick={() => router.push(LIST_HREF)}>확인했어요</Big>
            <Button variant="secondary" className="w-full" disabled={loading} onClick={() => void refresh(true)}>
              {loading ? '확인 중…' : '확인됐는지 다시 보기'}
            </Button>
            <button type="button" className="text-[13px] text-boss-text-secondary underline" onClick={() => go('bizno')}>
              신청 내용 고치기
            </button>
          </Bottom>
        </>
      );
      break;

    case 'linkId':
      screen = (
        <>
          <Title sub="전자 발급은 국세청과 연결된 팝빌을 통해 해요. 처음 한 번만 계정을 만들면 돼요.">발급용 팝빌 아이디를 정해요</Title>
          <BigField
            id="setup-memberId"
            label="팝빌 아이디"
            value={cred.memberId}
            maxLength={50}
            error={linkErrors.memberId}
            hint="영문 · 숫자 6~50자예요. 채워 둔 그대로 써도 돼요."
            autoComplete="off"
            onChange={(v) => {
              setCred((c) => ({ ...c, memberId: v.trim() }));
              setLinkErrors({});
            }}
            onEnter={nextLink}
          />
          <Bottom>
            <Big onClick={nextLink}>다음</Big>
          </Bottom>
        </>
      );
      break;

    case 'linkPassword':
      screen = (
        <>
          <Title sub="도배르만 비밀번호와 달라도 돼요.">팝빌 비밀번호를 정해요</Title>
          <BigField
            id="setup-password"
            label="비밀번호"
            type="password"
            value={cred.password}
            maxLength={20}
            error={linkErrors.password}
            autoComplete="new-password"
            onChange={(v) => {
              setCred((c) => ({ ...c, password: v }));
              setLinkErrors({});
            }}
          />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {passwordChecks(cred.password).map((c) => (
              <li key={c.label} className={`inline-flex items-center gap-1 ${c.ok && cred.password ? 'text-boss-success' : 'text-boss-text-muted'}`}>
                <Check size={13} strokeWidth={2.5} aria-hidden />
                {c.label}
              </li>
            ))}
          </ul>
          <BigField
            id="setup-password2"
            label="비밀번호 한 번 더"
            type="password"
            value={cred.passwordConfirm}
            maxLength={20}
            error={linkErrors.passwordConfirm}
            autoComplete="new-password"
            onChange={(v) => {
              setCred((c) => ({ ...c, passwordConfirm: v }));
              setLinkErrors({});
            }}
            onEnter={nextLink}
          />
          <Bottom>
            <Big onClick={nextLink}>다음</Big>
          </Bottom>
        </>
      );
      break;

    case 'linkConfirm':
      screen = (
        <>
          <Title sub="공동인증서를 등록하거나 팝빌에 직접 들어갈 때 필요해요. 도배르만은 비밀번호를 저장하지 않아요.">
            {'아이디와 비밀번호를\n꼭 적어 두세요'}
          </Title>
          <div className="flex items-center gap-3 border border-boss-border bg-boss-surface px-4 py-4">
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] text-boss-text-secondary">팝빌 아이디</span>
              <b className="block break-all text-[18px] text-boss-text">{cred.memberId}</b>
              <span className="mt-1 block text-[12.5px] text-boss-text-secondary">비밀번호: 방금 정한 것</span>
            </span>
            <Button variant="secondary" size="sm" icon={Copy} onClick={() => void copy(cred.memberId, '아이디를 복사했어요.')}>
              복사
            </Button>
          </div>
          <div className="flex flex-col gap-2 border border-boss-border bg-boss-inset px-4 py-3">
            <CheckLine checked={linkConsent} onChange={setLinkConsent} disabled={busy}>
              팝빌 연동회원 가입과, 권한 확인된 사업자 정보(상호 · 사업자번호 · 대표자 · 주소 · 업태 · 종목) 및 담당자 정보(이메일 ·
              연락처)를 팝빌에 제공하는 데 동의합니다.
            </CheckLine>
            <p className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-[12.5px]">
              <a href={POPBILL_TERMS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-boss-primary">
                팝빌 이용약관 <ExternalLink aria-hidden size={12} strokeWidth={1.75} />
              </a>
              <a href={POPBILL_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-boss-primary">
                팝빌 개인정보 처리방침 <ExternalLink aria-hidden size={12} strokeWidth={1.75} />
              </a>
            </p>
          </div>
          <Bottom>
            {recheck}
            <Big onClick={() => void link()} disabled={busy || needsRecheck || !cred.password}>
              {busy ? '만드는 중…' : '팝빌 계정 만들기'}
            </Big>
            {!cred.password && !needsRecheck && (
              <p className="text-center text-[12.5px] text-boss-text-secondary">비밀번호를 다시 넣으려면 뒤로 가세요.</p>
            )}
          </Bottom>
        </>
      );
      break;

    case 'linkUnknown':
      screen = (
        <>
          <Title sub="잠시 뒤 다시 확인해 주세요. 계속되면 도배르만 고객센터에 알려 주세요.">팝빌 계정 확인이 잠시 안 돼요</Title>
          <Bottom>
            <Big onClick={() => void refresh(true)} disabled={loading}>{loading ? '확인 중…' : '다시 확인'}</Big>
          </Bottom>
        </>
      );
      break;

    case 'notConfigured':
      screen = (
        <>
          <Title sub="사업자 확인은 끝났어요. 도배르만이 발급 연결을 마치면 알려 드려요.">발급 연결을 준비하고 있어요</Title>
          <Bottom>
            <Big onClick={() => router.push(LIST_HREF)}>확인했어요</Big>
            <Button variant="secondary" className="w-full" disabled={loading} onClick={() => void refresh(true)}>
              다시 확인
            </Button>
          </Bottom>
        </>
      );
      break;

    case 'certificate':
      screen = (
        <>
          <Title sub="세금계산서에 전자 서명할 때 쓰는 인증서예요. 등록한 날부터 1개월 무료예요.">{'마지막이에요!\n공동인증서를 등록해요'}</Title>
          <div className="flex flex-col gap-2 border border-boss-border bg-boss-surface px-4 py-3 text-[14px] leading-relaxed text-boss-text">
            <p>
              <b>필요한 인증서</b> — 사업자용 공동인증서(전자세금계산서용 또는 사업자 범용). 개인 은행용 · 금융인증서는 안 돼요.
            </p>
            <p>
              <b>인증서가 있는 기기에서</b> — 인증서가 다른 컴퓨터에 있으면, 그 컴퓨터에서 boss.doberman.kr 에 로그인해 이 화면(세금계산서 →
              전자 발급 시작하기)을 여세요.
            </p>
            <p>팝빌 화면이 아이디 · 비밀번호를 물으면 앞에서 만든 팝빌 아이디로 들어가세요.</p>
          </div>
          {certOpened && <Note tone="ok">팝빌 등록 화면을 새 창으로 열었어요. 등록을 마치고 이 화면으로 돌아와 아래 단추를 누르세요.</Note>}
          {certUrl && (
            <a href={certUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-boss-primary underline">
              새 창이 안 열렸으면 여기를 누르세요
            </a>
          )}
          <Bottom>
            {certOpened ? (
              <>
                <Big onClick={() => void checkCertificate()} disabled={loading}>{loading ? '확인 중…' : '등록을 마쳤어요'}</Big>
                <Button variant="secondary" className="w-full" disabled={busy} onClick={() => void openCertificate()}>
                  등록 화면 다시 열기
                </Button>
              </>
            ) : (
              <Big onClick={() => void openCertificate()} disabled={busy}>{busy ? '여는 중…' : '인증서 등록 화면 열기'}</Big>
            )}
            {cashReady && (
              <button
                type="button"
                className="text-[13px] text-boss-text-secondary underline"
                onClick={() => {
                  chooseAndGo('CASH');
                  go('doneCash');
                }}
              >
                인증서는 나중에, 현금영수증부터 쓸게요
              </button>
            )}
          </Bottom>
        </>
      );
      break;

    case 'doneTax':
    case 'doneCash': {
      const cashOnly = step === 'doneCash';
      const free = subscription?.reason === 'FREE_PERIOD' && subscription.freeUntil ? `${subscription.freeUntil.slice(0, 10)}까지 무료예요.` : null;
      screen = (
        <>
          <Done />
          <Title
            sub={
              cashOnly
                ? `첫 현금영수증을 발급한 날부터 1개월 무료예요. 그 뒤에는 앱에서 구독(${TAX_SUBSCRIPTION_PRICE})하면 계속 쓸 수 있어요.`
                : `${free ?? '공동인증서를 등록한 날부터 1개월 무료예요.'} 그 뒤에는 앱에서 구독(${TAX_SUBSCRIPTION_PRICE})하면 계속 쓸 수 있어요.`
            }
          >
            {cashOnly ? '현금영수증은\n바로 쓸 수 있어요' : '준비 끝!\n이제 바로 발급할 수 있어요'}
          </Title>
          <Bottom>
            {!cashOnly &&
              (taxOpen ? (
                <Big onClick={() => router.push('/boss/tax-invoice/new')}>전자세금계산서 쓰기</Big>
              ) : (
                <Note>전자세금계산서 발급은 곧 열려요. 열리면 알려 드려요.</Note>
              ))}
            {cashOpen ? (
              cashOnly ? (
                <Big onClick={() => router.push('/boss/tax-invoice/new?docType=CASH')}>현금영수증 쓰기</Big>
              ) : (
                <Button variant="secondary" className="w-full" onClick={() => router.push('/boss/tax-invoice/new?docType=CASH')}>
                  현금영수증 쓰기
                </Button>
              )
            ) : (
              <Note>현금영수증 발급은 곧 열려요.</Note>
            )}
            {cashOnly && (
              <button
                type="button"
                className="text-[13px] text-boss-text-secondary underline"
                onClick={() => {
                  chooseAndGo('BOTH');
                  go('certificate');
                }}
              >
                세금계산서도 쓰려면 — 공동인증서 등록
              </button>
            )}
            <Link href={LIST_HREF} className="text-center text-[13px] text-boss-text-secondary underline">
              목록으로
            </Link>
          </Bottom>
        </>
      );
      break;
    }
  }

  return (
    <Shell stage={stage} onBack={back}>
      {screen}
      {feedback && (
        <div className="mt-4">
          <Note tone={feedback.tone} live>{feedback.text}</Note>
        </div>
      )}
    </Shell>
  );
}

// ───────── 화면 조각 ─────────

/** 위: 뒤로 · 진행 막대(6칸) · 닫기. 가운데 좁은 기둥(휴대폰 폭) */
function Shell({ stage, onBack, children }: { stage: number; onBack: () => void; children: ReactNode }) {
  return (
    <div className="boss-touch mx-auto flex w-full max-w-[560px] flex-col pb-6">
      <div className="flex items-center gap-3 pb-5">
        <button type="button" onClick={onBack} aria-label="뒤로" className="grid h-10 w-10 flex-none place-items-center text-boss-text">
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <div className="flex flex-1 gap-1" aria-label={`${stage + 1}/${STAGE_NAMES.length} 단계 · ${STAGE_NAMES[stage]}`}>
          {STAGE_NAMES.map((n, i) => (
            <span key={n} className={`h-1.5 flex-1 ${i <= stage ? 'bg-boss-primary' : 'bg-boss-border'}`} />
          ))}
        </div>
        <Link href={LIST_HREF} aria-label="닫기" className="grid h-10 w-10 flex-none place-items-center text-boss-text-secondary">
          <X size={22} strokeWidth={1.75} />
        </Link>
      </div>
      <p className="boss-kicker mb-1">
        {stage + 1} / {STAGE_NAMES.length} · {STAGE_NAMES[stage]}
      </p>
      <div className="flex flex-col gap-4">{children}</div>
      <p className="mt-8 text-center text-[12.5px] text-boss-text-secondary">
        한 화면에서 모두 보려면{' '}
        <Link href="/boss/tax-invoice/registration" className="font-semibold text-boss-primary underline">
          발급 서비스 등록
        </Link>
      </p>
    </div>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-2">
      <h1 className="whitespace-pre-line break-keep font-boss-head text-[25px] font-semibold leading-snug tracking-[-0.015em] text-boss-text sm:text-[28px]">
        {children}
      </h1>
      {sub && <p className="mt-2 break-keep text-[14.5px] leading-relaxed text-boss-text-secondary">{sub}</p>}
    </div>
  );
}

/** 아래 큰 단추 자리 — 휴대폰에서는 화면 아래(하단 메뉴 56px 바로 위)에 붙는다 */
function Bottom({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] -mx-1 mt-4 flex flex-col gap-2 bg-boss-bg px-1 pb-3 pt-3 lg:bottom-0">
      {children}
    </div>
  );
}

function Big({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="primary" className="h-[52px] w-full !text-[16.5px]" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

function Done() {
  return (
    <span className="grid h-14 w-14 place-items-center rounded-full bg-boss-success text-boss-bg" aria-hidden>
      <Check size={30} strokeWidth={3} />
    </span>
  );
}

function BigField({
  id,
  label,
  value,
  onChange,
  onEnter,
  error,
  hint,
  type = 'text',
  maxLength,
  placeholder,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  error?: string;
  hint?: string;
  type?: 'text' | 'password';
  maxLength?: number;
  placeholder?: string;
  inputMode?: 'numeric' | 'email' | 'tel';
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="boss-label !text-[13.5px]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        className={`boss-input !h-[52px] !text-[17px] ${error ? '!border-boss-error' : ''}`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-boss-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-boss-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** 누르면 칸이 채워지는 보기 */
function Chips({ values, onPick, current }: { values: string[]; onPick: (v: string) => void; current: string }) {
  return (
    <div className="-mt-2 flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className={`min-h-[36px] border px-3 text-[13.5px] ${
            current === v ? 'border-boss-primary bg-boss-primary/10 font-semibold text-boss-primary' : 'border-boss-border bg-boss-surface text-boss-text'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
