'use client';

// 발급 권한 확인 신청서 — 사업자 정보 8칸 + 동의
//
// 저장은 "신청"이다. 승인 전에는 발급 권한이 없다는 것을 버튼 아래에서 분명히 말한다.
// 오류는 칸을 벗어날 때(blur) 또는 신청을 누른 뒤에 보이고, 신청을 누르면 첫 오류 칸으로 초점을 옮긴다.

import { useMemo, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { AlertBanner, Button, CheckLine, Field, Panel } from '@/components/boss/ui';
import { maskBizNo } from '@/lib/boss/bizno';
import {
  SUPPLIER_FIELDS,
  SUPPLIER_LABEL,
  SUPPLIER_MAX,
  formatSupplierPhone,
  validateSupplier,
  type SupplierField,
} from '@/lib/boss/taxInvoiceRegistration';
import type { TaxInvoiceSupplier } from '@/types/boss-taxinvoice';
import { Note } from './RegistrationParts';

const fieldId = (f: SupplierField) => `reg-supplier-${f}`;

const PLACEHOLDER: Record<SupplierField, string> = {
  bizNo: '000-00-00000',
  name: '도배르만 인테리어',
  ceo: '홍길동',
  address: '서울시 강남구 테헤란로 1, 2층',
  bizType: '건설업',
  bizKind: '실내건축공사업',
  email: 'tax@example.com',
  phone: '010-1234-5678',
};

const DEFAULT_HINT: Partial<Record<SupplierField, string>> = {
  bizNo: '사업자등록증의 10자리 번호',
  address: '사업자등록증에 적힌 사업장 주소',
  email: '전자세금계산서 · 연동 안내를 받을 주소',
};

const INPUT_PROPS: Partial<Record<SupplierField, InputHTMLAttributes<HTMLInputElement>>> = {
  bizNo: { inputMode: 'numeric', autoComplete: 'off' },
  name: { autoComplete: 'organization' },
  ceo: { autoComplete: 'name' },
  address: { autoComplete: 'street-address' },
  email: { type: 'email', inputMode: 'email', autoComplete: 'email', spellCheck: false },
  phone: { type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
};

/** 넓은 칸 — 2열 격자에서 한 줄을 다 쓴다 */
const WIDE: SupplierField[] = ['address', 'email'];

export interface SubmitFeedback {
  tone: 'bad' | 'warn';
  text: string;
}

export default function SupplierRegistrationForm({
  value,
  onChange,
  mode,
  prefillNote,
  serviceConfigured,
  submitting,
  feedback,
  onSubmit,
  onCancel,
}: {
  value: TaxInvoiceSupplier;
  onChange: (next: TaxInvoiceSupplier) => void;
  /** new: 첫 신청 · edit: 확인 전 신청 내용 고치기 · reapply: 반려된 신청을 고쳐 다시 신청 */
  mode: 'new' | 'edit' | 'reapply';
  prefillNote?: string | null;
  serviceConfigured: boolean;
  submitting: boolean;
  feedback: SubmitFeedback | null;
  onSubmit: (supplier: TaxInvoiceSupplier) => void;
  onCancel?: () => void;
}) {
  const [touched, setTouched] = useState<Partial<Record<SupplierField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [consent, setConsent] = useState(false);
  const consentRef = useRef<HTMLDivElement>(null);

  const errors = useMemo(() => validateSupplier(value), [value]);
  const errorFields = SUPPLIER_FIELDS.filter((f) => errors[f]);
  const visibleError = (f: SupplierField) => (attempted || touched[f] ? errors[f] : undefined);

  const set = (f: SupplierField, v: string) => onChange({ ...value, [f]: f === 'bizNo' ? maskBizNo(v) : v });

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
    onSubmit(value);
  };

  const hintFor = (f: SupplierField) => {
    const err = visibleError(f);
    if (err) {
      return (
        <span id={`${fieldId(f)}-msg`} className="text-boss-error">
          {err}
        </span>
      );
    }
    if (f === 'bizNo' && value.bizNo.trim() && !errors.bizNo) {
      return (
        <span id={`${fieldId(f)}-msg`} className="text-boss-success">
          검증번호까지 맞는 번호입니다.
        </span>
      );
    }
    const hint = DEFAULT_HINT[f];
    return hint ? <span id={`${fieldId(f)}-msg`}>{hint}</span> : undefined;
  };

  return (
    <Panel kicker={mode === 'new' ? '신청서' : mode === 'reapply' ? '반려 후 다시 신청' : '신청 내용 수정'} title="발급 권한 확인 신청">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-describedby="reg-supplier-desc">
        <p id="reg-supplier-desc" className="break-keep text-[13px] leading-relaxed text-boss-text-secondary">
          전자세금계산서의 공급자로 실릴 사업자 정보입니다. 사업자등록증과 똑같이 적어 주세요. 모든 칸이 필수입니다.
        </p>

        {prefillNote && <Note tone="info">{prefillNote}</Note>}
        {/* '준비 중' 안내는 화면 맨 위 띠 한 곳에서만 한다(2026-10-21) — 여기서는 지금 할 수 있는 것만 짧게 */}
        {!serviceConfigured && (
          <p className="break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">
            신청은 지금 해 둘 수 있어요. 다음 단계는 이 화면에서 이어 갑니다.
          </p>
        )}

        {attempted && errorFields.length > 0 && (
          <AlertBanner tone="bad">
            입력값을 확인하세요 — {errorFields.map((f) => SUPPLIER_LABEL[f]).join(', ')} ({errorFields.length}개)
          </AlertBanner>
        )}

        <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
          {SUPPLIER_FIELDS.map((f) => {
            const hint = hintFor(f);
            return (
              <Field
                key={f}
                id={fieldId(f)}
                label={SUPPLIER_LABEL[f]}
                required
                aria-required
                className={WIDE.includes(f) ? 'sm:col-span-2' : ''}
                value={value[f]}
                onChange={(e) => set(f, e.target.value)}
                onBlur={() => {
                  setTouched((t) => (t[f] ? t : { ...t, [f]: true }));
                  // 연락처는 칸을 벗어나면 010-1234-5678 모양으로(서버는 하이픈을 지우고 저장한다)
                  if (f === 'phone') {
                    const formatted = formatSupplierPhone(value.phone);
                    if (formatted !== value.phone) onChange({ ...value, phone: formatted });
                  }
                }}
                placeholder={PLACEHOLDER[f]}
                maxLength={SUPPLIER_MAX[f]}
                hideCounter
                disabled={submitting}
                aria-invalid={visibleError(f) ? true : undefined}
                aria-describedby={hint ? `${fieldId(f)}-msg` : undefined}
                hint={hint}
                {...INPUT_PROPS[f]}
              />
            );
          })}
        </div>

        <div ref={consentRef} className="border border-boss-border bg-boss-inset px-4 py-3">
          <CheckLine checked={consent} onChange={setConsent} disabled={submitting}>
            입력한 사업자 정보를 저장하고, 도배르만 운영팀에 전자세금계산서 발급 권한 확인을 신청하는 데 동의합니다.
          </CheckLine>
          {attempted && !consent && errorFields.length === 0 && (
            <p role="alert" className="mt-1.5 pl-6 text-[12px] text-boss-error">
              동의해야 신청할 수 있습니다.
            </p>
          )}
        </div>

        {feedback && <AlertBanner tone={feedback.tone}>{feedback.text}</AlertBanner>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-boss-border-row pt-4">
          <p className="min-w-0 flex-1 basis-[240px] break-keep text-[12px] leading-relaxed text-boss-text-secondary">
            신청은 승인 요청입니다. 저장해도 바로 발급 권한이 생기지 않으며, 운영팀 확인이 끝나야 다음 단계가 열립니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel} disabled={submitting}>
                취소
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting || undefined}>
              {submitting ? '신청 중…' : mode === 'new' ? '권한 확인 신청' : mode === 'reapply' ? '고친 내용으로 다시 신청' : '수정 내용으로 다시 신청'}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
