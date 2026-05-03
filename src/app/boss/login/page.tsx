'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossAuthApi } from '@/lib/api/boss/auth';
import { BossAuthManager } from '@/lib/bossAuth';
import { ensureDeviceId } from '@/lib/bossDeviceId';
import type { BossLoginRequest } from '@/types/boss';
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

export default function BossLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      toast.error('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Flutter `LoginRepo.login` 과 동일하게 POST /auth/login 호출.
      const payload: BossLoginRequest = {
        userId: userId.trim(),
        password,
        fcmToken: '',
        deviceId: ensureDeviceId() ?? '',
      };
      const res = await bossAuthApi.login(payload);

      if (res.success !== false && res.data?.token) {
        BossAuthManager.setToken(res.data.token);
        if (res.data.userInfo) {
          BossAuthManager.setUserInfo(res.data.userInfo);
        }
        toast.success('환영합니다!');
        router.replace('/boss');
      } else {
        toast.error(res.message || res.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss login error', err);
      toast.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* LEFT — Brand panel */}
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

          <div className="space-y-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
                <Sparkles size={11} className="text-emerald-300" />
                <span className="text-[11px] font-medium text-emerald-300">전국 300+ 검증된 사장님</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
                일에만 집중할 수 있는
                <br />
                <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                  사장님 워크스페이스
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
                견적·시공·매출·고객 채팅까지 한 곳에서. 도배 사장님을 위한 가장 빠른 B2B 관리 도구.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                { icon: TrendingUp, label: '실시간 매출 트렌드와 인사이트' },
                { icon: MessageSquare, label: '고객과의 견적 채팅 통합 관리' },
                { icon: CheckCircle2, label: '시공 체크리스트와 전자 서명' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <Icon size={14} className="text-emerald-300" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>SSL 암호화 · ISMS 보안 · 사장님 데이터는 안전하게 보호됩니다.</span>
          </div>
        </aside>

        {/* RIGHT — Form */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Link href="/boss" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
                  <Building2 size={16} className="text-white" />
                </div>
                <span className="text-base font-bold text-white">도배르만 PRO</span>
              </Link>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-white">사장님 로그인</h2>
              <p className="mt-2 text-sm text-slate-400">
                계정이 없으신가요?{' '}
                <Link href="/boss/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
                  무료로 시작하기
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="userId" className="mb-1.5 block text-xs font-medium text-slate-300">
                  아이디
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="userId"
                    type="text"
                    autoComplete="username"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="boss@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                    비밀번호
                  </label>
                  <Link
                    href="/boss/find-password"
                    className="text-[11px] font-medium text-slate-400 hover:text-emerald-300"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 select-none">
                <span className="relative">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="block h-4 w-4 rounded border border-slate-700 bg-slate-900 peer-checked:border-emerald-500 peer-checked:bg-emerald-500" />
                  <CheckCircle2
                    size={12}
                    className="pointer-events-none absolute left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100"
                  />
                </span>
                <span className="text-xs text-slate-400">로그인 상태 유지</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    로그인 중...
                  </span>
                ) : (
                  <>
                    로그인
                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-800" />
              <span className="text-[11px] text-slate-500">또는</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>

            <Link
              href="/boss/find-id"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-sm font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-white"
            >
              아이디 찾기
            </Link>

            <p className="mt-8 text-center text-[11px] text-slate-500">
              로그인 시{' '}
              <Link href="/boss/help/terms" className="text-slate-400 underline hover:text-slate-200">
                이용약관
              </Link>
              과{' '}
              <Link href="/boss/help/privacy" className="text-slate-400 underline hover:text-slate-200">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
