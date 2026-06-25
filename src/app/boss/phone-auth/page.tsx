'use client';

// 사장님 휴대폰 본인인증 안내 페이지
// Flutter 원본: lib/app/login/phone_auth_page.dart
// 백엔드 SMS 엔드포인트가 확정되기 전까지는 입력 폼과 단계 UI 만 제공하고
// 인증번호 발송/확인은 클라이언트 상태로만 처리(데모).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

const TIMER_SECONDS = 180;

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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 로그인
        </Link>
        <h1 className="text-xl font-bold text-white">휴대폰 본인인증</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-300" />
          <div className="min-w-0 flex-1 text-sm leading-relaxed text-slate-300">
            안전한 서비스 이용을 위해 휴대폰 본인인증이 필요합니다. 입력하신 정보는 인증 목적
            외에 사용되지 않습니다.
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <Field label="이름">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="실명을 입력해주세요"
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none"
          />
        </Field>

        {showBirth && (
          <Field label="생년월일">
            <input
              type="text"
              inputMode="numeric"
              value={birth}
              maxLength={8}
              onChange={(e) => setBirth(e.target.value.replace(/\D/g, ''))}
              placeholder="예) 19900101"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none"
            />
          </Field>
        )}

        {showPhone && (
          <Field label="휴대폰 번호">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={phone}
                maxLength={11}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="- 없이 숫자만 입력"
                disabled={verified}
                className="h-11 flex-1 rounded-lg border border-slate-700 bg-slate-950/40 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={verified || phone.length < 10}
                className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Phone size={14} className="mr-1 inline" />
                {sent ? '재전송' : '인증번호 전송'}
              </button>
            </div>
          </Field>
        )}

        {sent && (
          <Field label="인증번호">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6자리 인증번호"
                  disabled={verified}
                  className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 pr-16 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none disabled:opacity-60"
                />
                {!verified && timeLeft > 0 && (
                  <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-xs text-emerald-300">
                    <Clock size={12} />
                    {timerText}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={verifyCode}
                disabled={verified || code.length !== 6}
                className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verified ? '인증완료' : '확인'}
              </button>
            </div>
          </Field>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {verified && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <CheckCircle2 size={14} /> 본인인증이 완료되었습니다.
          </div>
        )}

        <button
          type="button"
          disabled={!verified}
          className="mt-2 h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          다음 단계로
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        ※ SMS 발송 연동 전 단계로 입력하신 인증번호는 서버 검증 없이 통과 처리됩니다.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-300">{label}</label>
      {children}
    </div>
  );
}
