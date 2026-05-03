'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossAuthApi } from '@/lib/api/boss/auth';
import type { BossCheckUserInfoRequest, BossChangePasswordRequest } from '@/types/boss';
import {
  Building2,
  User,
  Phone,
  Lock,
  IdCard,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        <aside className="hidden flex-col justify-between border-r border-white/5 p-12 lg:flex">
          <Link href="/boss" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold text-white">도배르만</p>
              <p className="text-[11px] font-medium text-emerald-400">PRO Workspace</p>
            </div>
          </Link>

          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              비밀번호를
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                재설정하세요
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              본인 확인 후 새 비밀번호로 변경할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>안전한 본인 확인 절차로 보호됩니다.</span>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            <Link
              href="/boss/login"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300"
            >
              <ArrowLeft size={13} /> 로그인으로 돌아가기
            </Link>

            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-white">비밀번호 찾기</h2>
              <p className="mt-2 text-sm text-slate-400">
                {step === 'verify' ? '본인 확인 후 비밀번호를 재설정합니다.' : '새 비밀번호를 입력해주세요.'}
              </p>
            </div>

            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2">
              <div
                className={`h-1 flex-1 rounded-full ${
                  step === 'verify' ? 'bg-emerald-500' : 'bg-emerald-700'
                }`}
              />
              <div
                className={`h-1 flex-1 rounded-full ${
                  step === 'reset' ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              />
            </div>

            {step === 'verify' ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="userId" className="mb-1.5 block text-xs font-medium text-slate-300">
                    아이디
                  </label>
                  <div className="relative">
                    <IdCard
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      id="userId"
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                      placeholder="아이디"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-300">
                    이름
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                      placeholder="홍길동"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-300">
                    휴대폰 번호
                  </label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                      placeholder="01012345678"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      확인 중...
                    </span>
                  ) : (
                    <>
                      본인 확인
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="newPw" className="mb-1.5 block text-xs font-medium text-slate-300">
                    새 비밀번호
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      id="newPw"
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                      placeholder="6자 이상"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPw" className="mb-1.5 block text-xs font-medium text-slate-300">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      id="confirmPw"
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                      placeholder="다시 입력"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      변경 중...
                    </span>
                  ) : (
                    <>
                      비밀번호 변경
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
