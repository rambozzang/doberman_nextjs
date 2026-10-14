'use client';

// 서비스 연동 — 팝빌 연동 회원 가입 (권한 확인이 끝났고 미가입이 확인된 경우에만 화면에 나온다)
//
// 사업자 정보는 보내지 않는다 — 서버가 권한 확인된 사업자로만 가입한다.
// 아이디 · 비밀번호는 기존 로그인이 아니라 새로 만드는 값이다. 보내는 순간 화면 상태에서 비밀번호를 지우고,
// 어디에도(저장소 · 주소 · 기록) 남기지 않는다. 결과를 모르면 다시 보내지 않고 등록 상태부터 확인한다(화면 쪽 처리).

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { AlertBanner, Button, CheckLine, Field, Panel } from '@/components/boss/ui';
import { formatBizNo } from '@/lib/boss/bizno';
import { validateLinkCredentials, type LinkCredentials } from '@/lib/boss/taxInvoiceRegistration';
import type { TaxInvoiceSupplier } from '@/types/boss-taxinvoice';
import { Note } from './RegistrationParts';

const POPBILL_TERMS_URL = 'https://www.popbill.com/Policy/Agreement';
const POPBILL_PRIVACY_URL = 'https://www.popbill.com/Policy/Privacy';

type LinkField = keyof LinkCredentials;
const FIELD_ORDER: LinkField[] = ['memberId', 'password', 'passwordConfirm'];
const fieldId = (f: LinkField) => `reg-link-${f}`;

const DEFAULT_HINT: Record<LinkField, string> = {
  memberId: '영문 · 숫자 · 밑줄(_) · 하이픈(-) 6~50자',
  password: '영문 · 숫자 · 특수문자(~!@#$%^&*()_+)를 모두 넣어 8~20자',
  passwordConfirm: '같은 비밀번호를 한 번 더',
};

// 비밀번호 관리 도구가 도배르만 로그인 정보로 저장 · 자동 입력하지 않게 한다
const NO_MANAGER = { 'data-1p-ignore': 'true', 'data-lpignore': 'true', 'data-form-type': 'other' } as const;

export default function PopbillLinkForm({
  supplier,
  submitting,
  feedback,
  onSubmit,
}: {
  supplier: TaxInvoiceSupplier | null;
  submitting: boolean;
  feedback: { tone: 'bad' | 'warn'; text: string } | null;
  onSubmit: (memberId: string, password: string) => void;
}) {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<LinkField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const consentRef = useRef<HTMLDivElement>(null);

  const errors = useMemo(
    () => validateLinkCredentials({ memberId, password, passwordConfirm }),
    [memberId, password, passwordConfirm],
  );
  const errorFields = FIELD_ORDER.filter((f) => errors[f]);
  const visibleError = (f: LinkField) => (attempted || touched[f] ? errors[f] : undefined);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAttempted(true);
    if (errorFields.length > 0) {
      document.getElementById(fieldId(errorFields[0]))?.focus();
      return;
    }
    if (!consent) {
      consentRef.current?.querySelector('input')?.focus();
      return;
    }
    const pw = password;
    // 보내는 즉시 비밀번호를 화면 상태에서 지운다 — 실패하면 다시 입력받는다
    setPassword('');
    setPasswordConfirm('');
    setReveal(false);
    setAttempted(false);
    setTouched((t) => ({ memberId: t.memberId }));
    onSubmit(memberId, pw);
  };

  const hint = (f: LinkField) => {
    const err = visibleError(f);
    return (
      <span id={`${fieldId(f)}-msg`} className={err ? 'text-boss-error' : undefined}>
        {err ?? DEFAULT_HINT[f]}
      </span>
    );
  };

  const common = (f: LinkField) => ({
    id: fieldId(f),
    required: true,
    'aria-required': true,
    hideCounter: true,
    disabled: submitting,
    spellCheck: false,
    autoCapitalize: 'none',
    autoCorrect: 'off',
    onBlur: () => setTouched((t) => (t[f] ? t : { ...t, [f]: true })),
    'aria-invalid': visibleError(f) ? true : undefined,
    'aria-describedby': `${fieldId(f)}-msg`,
    hint: hint(f),
    ...NO_MANAGER,
  });

  return (
    <Panel kicker="3단계 · 서비스 연동" title="팝빌 연동 회원 가입">
      <form noValidate autoComplete="off" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="break-keep text-[13px] leading-relaxed text-boss-text-secondary">
          전자세금계산서는 발급 대행 서비스인 팝빌을 통해 발급합니다. 권한 확인이 끝난 사업자로 팝빌 연동 회원을
          새로 만듭니다. 도배르만 로그인 정보가 아니라, 팝빌에서 쓸 <b className="font-semibold text-boss-text">새 아이디 · 비밀번호</b>를
          정해 주세요.
        </p>

        {supplier && (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border border-boss-border bg-boss-inset px-4 py-3 text-[13px]">
            <span className="boss-mono-label">가입할 사업자</span>
            <span className="min-w-0 break-words font-semibold text-boss-text">
              {supplier.name} · <span className="font-boss-head tabular-nums">{formatBizNo(supplier.bizNo)}</span>
            </span>
          </div>
        )}

        {attempted && errorFields.length > 0 && (
          <AlertBanner tone="bad">입력값을 확인하세요 ({errorFields.length}개)</AlertBanner>
        )}

        <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
          <Field
            {...common('memberId')}
            label="새 팝빌 아이디"
            className="sm:col-span-2"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            maxLength={50}
            placeholder="mycompany_tax"
          />
          <Field
            {...common('password')}
            label="새 비밀번호"
            type={reveal ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={20}
          />
          <Field
            {...common('passwordConfirm')}
            label="새 비밀번호 확인"
            type={reveal ? 'text' : 'password'}
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            maxLength={20}
          />
          <div className="sm:col-span-2">
            <CheckLine checked={reveal} onChange={setReveal} disabled={submitting}>
              비밀번호 보이기
            </CheckLine>
          </div>
        </div>

        <Note tone="info">
          아이디 · 비밀번호는 팝빌 가입 요청에만 쓰고 도배르만에 저장하거나 기록하지 않습니다. 팝빌 사이트에 직접 로그인할 때
          필요하니 따로 보관해 두세요.
        </Note>

        <div ref={consentRef} className="flex flex-col gap-2 border border-boss-border bg-boss-inset px-4 py-3">
          <CheckLine checked={consent} onChange={setConsent} disabled={submitting}>
            팝빌 연동회원 가입과, 권한 확인된 사업자 정보(상호 · 사업자번호 · 대표자 · 주소 · 업태 · 종목) 및 담당자 정보(이메일 ·
            연락처)를 팝빌에 제공하는 데 동의합니다.
          </CheckLine>
          <p className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-[12.5px]">
            <a
              href={POPBILL_TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-boss-primary underline-offset-2 hover:underline"
            >
              팝빌 이용약관 <ExternalLink aria-hidden size={12} strokeWidth={1.75} />
              <span className="sr-only">(새 창)</span>
            </a>
            <a
              href={POPBILL_PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-boss-primary underline-offset-2 hover:underline"
            >
              팝빌 개인정보 처리방침 <ExternalLink aria-hidden size={12} strokeWidth={1.75} />
              <span className="sr-only">(새 창)</span>
            </a>
          </p>
          {attempted && !consent && errorFields.length === 0 && (
            <p role="alert" className="pl-6 text-[12px] text-boss-error">
              동의해야 가입할 수 있습니다.
            </p>
          )}
        </div>

        {feedback && <AlertBanner tone={feedback.tone}>{feedback.text}</AlertBanner>}

        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3 border-t border-boss-border-row pt-4">
          <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? '가입 요청 중…' : '팝빌 연동 회원 가입'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
