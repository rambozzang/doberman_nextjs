'use client';

// 휴대폰 본인인증 — Industry 패턴 (AuthFrame 380px 열)
// Flutter 원본: lib/app/login/phone_auth_page.dart
//
// 이름 → 생년월일 → 휴대폰 순으로 입력칸이 열리고, 인증번호 전송 뒤 3분 타이머가 돈다.
// 백엔드 SMS 엔드포인트가 확정되기 전이라 발송/확인은 클라이언트 상태로만 처리(데모)한다.
// 상단 스텝(정보 입력 → 인증번호 → 완료)은 sent/verified 상태에서 파생한다.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { AlertBanner, Button, Field, FieldLabel } from '@/components/boss/ui';
import { AuthFrame } from '@/components/boss/AuthFrame';

const TIMER_SECONDS = 180;
const STEPS = ['정보 입력', '인증번호', '완료'];

export default function BossPhoneAuthPage() {
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [showBirth, setShowBirth] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (name.trim().length >= 2) setShowBirth(true);
  }, [name]);

  useEffect(() => {
    if (birth.length === 8) setShowPhone(true);
  }, [birth]);

  // 인증번호 카운트다운 타이머
  useEffect(() => {
    if (!sent || verified) return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [sent, verified, timeLeft]);

  const timerText = (() => {
    const m = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  })();

  function sendCode() {
    setError(null);
    if (phone.length < 10) {
      setError('휴대폰 번호를 정확히 입력해주세요.');
      return;
    }
    // 백엔드 SMS 연동 전까지 데모 모드: 클라이언트에서 타이머만 시작
    setSent(true);
    setTimeLeft(TIMER_SECONDS);
    setCode('');
  }

  function verifyCode() {
    setError(null);
    if (code.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }
    // 백엔드 인증 확인 API 연동 전까지 데모 모드: 6자리 입력 시 통과
    setVerified(true);
  }

  const current = verified ? 2 : sent ? 1 : 0;
  const expired = sent && !verified && timeLeft <= 0;

  return (
    <AuthFrame
      title="휴대폰 본인인증"
      description="본인 명의 휴대폰으로 인증합니다. 입력한 정보는 인증 외 목적으로 쓰지 않습니다"
      footer={
        <>
          SMS 발송 연동 전 단계입니다 — 지금은 인증번호가 서버 검증 없이 통과 처리됩니다.
        </>
      }
    >
      <Steps items={STEPS} current={current} />

      <div className="boss-card p-6">
        <Field
          id="name"
          label="이름"
          required
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="실명"
          disabled={verified}
          autoFocus
          maxLength={50}
        />

        {showBirth && (
          <Field
            id="birth"
            label="생년월일"
            required
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            maxLength={8}
            value={birth}
            onChange={(e) => setBirth(e.target.value.replace(/\D/g, ''))}
            placeholder="19900101"
            hint="숫자 8자리"
            disabled={verified}
            className="mt-4"
          />
        )}

        {showPhone && (
          <div className="mt-4">
            <FieldLabel required htmlFor="phone">
              휴대폰 번호
            </FieldLabel>
            <div className="flex gap-2">
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="- 없이 숫자만"
                disabled={verified}
                className="boss-input min-w-0 flex-1"
              />
              <Button
                variant="secondary"
                onClick={sendCode}
                disabled={verified || phone.length < 10}
                className="h-9 shrink-0"
              >
                {sent ? '재전송' : '인증번호 전송'}
              </Button>
            </div>
          </div>
        )}

        {sent && (
          <div className="mt-4">
            <FieldLabel required htmlFor="code">
              인증번호
            </FieldLabel>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6자리"
                  disabled={verified}
                  className="boss-input pr-14 font-boss-head tracking-[0.12em]"
                />
                {!verified && timeLeft > 0 && (
                  <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center font-boss-head text-[12.5px] tabular-nums text-boss-primary">
                    {timerText}
                  </span>
                )}
              </div>
              <Button
                variant={verified ? 'secondary' : 'primary'}
                onClick={verifyCode}
                disabled={verified || code.length !== 6}
                className="h-9 shrink-0"
              >
                {verified ? '인증 완료' : '확인'}
              </Button>
            </div>
            {expired && (
              <p className="mt-1 text-[12px] text-boss-warning">
                유효 시간이 지났습니다. 인증번호를 다시 전송해 주세요.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4">
            <AlertBanner tone="bad">{error}</AlertBanner>
          </div>
        )}

        {verified && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 border border-boss-success/35 bg-boss-pill-ok px-4 py-3 text-[13px] text-boss-pill-ok-fg"
          >
            <Check size={14} strokeWidth={2.25} /> 본인인증이 완료되었습니다.
          </div>
        )}

        <Button variant="primary" disabled={!verified} className="mt-5 w-full py-3">
          다음 단계로
        </Button>

        <p className="mt-5 border-t border-boss-border pt-4 text-center text-[12.5px] text-boss-text-secondary">
          <Link href="/boss/login" className="font-semibold text-boss-primary underline underline-offset-2">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}

/** 사각 Seg 모양의 단계 표시 — 완료 = accent 채움, 현재 = accent-100 + 굵게, 이후 = 면색 */
function Steps({ items, current }: { items: string[]; current: number }) {
  return (
    <ol className="mb-4 flex border border-boss-border" aria-label="진행 단계">
      {items.map((label, i) => {
        const done = i < current || (i === current && current === items.length - 1);
        const active = i === current && !done;
        return (
          <li
            key={label}
            aria-current={i === current ? 'step' : undefined}
            className={`flex flex-1 items-center gap-2 px-3 py-[7px] text-[13px] ${
              i > 0 ? 'border-l border-boss-border' : ''
            } ${
              done
                ? 'bg-boss-primary text-boss-primary-foreground'
                : active
                  ? 'bg-boss-elevated font-semibold text-boss-pill-info-fg'
                  : 'bg-boss-bg text-boss-text-muted'
            }`}
          >
            <span className="grid h-4 w-4 flex-none place-items-center font-boss-head text-[12px] tabular-nums">
              {done ? <Check size={12} strokeWidth={2.5} /> : i + 1}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
