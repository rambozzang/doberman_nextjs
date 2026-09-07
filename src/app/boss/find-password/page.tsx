'use client';

// 비밀번호 찾기 — Industry 패턴 (AuthFrame 380px 열)
//
// 두 단계: 본인 확인(아이디·이름·휴대폰) → 새 비밀번호. 상단에 사각 Seg 스타일 스텝 표시
// (완료 = accent 채움, 현재 = accent-100). 검증·API 는 그대로다.

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, Eye, EyeOff } from 'lucide-react';
import { bossAuthApi } from '@/lib/api/boss/auth';
import type { BossCheckUserInfoRequest, BossChangePasswordRequest } from '@/types/boss';
import { Button, Field, FieldLabel } from '@/components/boss/ui';
import { AuthFrame } from '@/components/boss/AuthFrame';

const STEPS = ['본인 확인', '새 비밀번호'];

export default function BossFindPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !name.trim() || phone.length !== 11) {
      toast.error('모든 항목을 올바르게 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const payload: BossCheckUserInfoRequest = {
        userId: userId.trim(),
        userNm: name.trim(),
        hp: phone.trim(),
      };
      const res = await bossAuthApi.verifyUser(payload);
      if (res.success) {
        toast.success('본인 확인되었습니다. 새 비밀번호를 입력해주세요.');
        setStep('reset');
      } else {
        toast.error(res.message || res.error || '본인 확인에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss verify user error', err);
      toast.error('본인 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      const payload: BossChangePasswordRequest = {
        userId: userId.trim(),
        password: newPassword,
      };
      const res = await bossAuthApi.changePassword(payload);
      if (res.success) {
        toast.success('비밀번호가 변경되었습니다.');
        router.replace('/boss/login');
      } else {
        toast.error(res.message || res.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss change password error', err);
      toast.error('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const current = step === 'verify' ? 0 : 1;

  return (
    <AuthFrame
      title="비밀번호 찾기"
      description={
        step === 'verify'
          ? '가입 정보로 본인을 확인한 뒤 새 비밀번호를 정합니다'
          : `${userId.trim()} 계정의 새 비밀번호를 입력해 주세요`
      }
      footer={
        <>
          아이디도 잊으셨나요?{' '}
          <Link
            href="/boss/find-id"
            className="font-semibold !text-boss-primary underline underline-offset-2"
          >
            아이디 찾기
          </Link>
        </>
      }
    >
      <Steps items={STEPS} current={current} />

      {step === 'verify' ? (
        <form onSubmit={handleVerify} className="boss-card p-6">
          <Field
            id="userId"
            label="아이디"
            required
            type="text"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            autoFocus
            maxLength={50}
          />
          <Field
            id="name"
            label="이름"
            required
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="mt-4"
            maxLength={50}
          />
          <Field
            id="phone"
            label="휴대폰 번호"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={11}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="01012345678"
            hint="- 없이 숫자 11자리"
            className="mt-4"
          />

          <Button type="submit" variant="primary" disabled={loading} className="mt-5 w-full py-3">
            {loading ? '확인 중…' : '본인 확인'}
          </Button>

          <p className="mt-5 border-t border-boss-border pt-4 text-center text-[12.5px] text-boss-text-secondary">
            <Link
              href="/boss/login"
              className="font-semibold text-boss-primary underline underline-offset-2"
            >
              로그인으로 돌아가기
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleReset} className="boss-card p-6">
          <div>
            <FieldLabel required htmlFor="newPw">
              새 비밀번호
            </FieldLabel>
            <div className="relative">
              <input
                id="newPw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="boss-input pr-10"
                placeholder="6자 이상"
                autoFocus
                maxLength={50}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-boss-text-muted hover:text-boss-text"
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPw ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          <Field
            id="confirmPw"
            label="비밀번호 확인"
            required
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="한 번 더 입력"
            hint={
              confirmPassword.length > 0 && confirmPassword !== newPassword ? (
                <span className="text-boss-error">비밀번호가 일치하지 않습니다.</span>
              ) : undefined
            }
            className="mt-4"
            maxLength={50}
          />

          <Button type="submit" variant="primary" disabled={loading} className="mt-5 w-full py-3">
            {loading ? '변경 중…' : '비밀번호 변경'}
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}

/** 사각 Seg 모양의 단계 표시 — 완료 = accent 채움, 현재 = accent-100 + 굵게, 이후 = 면색 */
function Steps({ items, current }: { items: string[]; current: number }) {
  return (
    <ol className="mb-4 flex border border-boss-border" aria-label="진행 단계">
      {items.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
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
