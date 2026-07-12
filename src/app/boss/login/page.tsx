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
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/boss/ui';

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT — Brand panel */}
      <aside className="hidden flex-col justify-between border-r border-boss-border bg-boss-surface p-12 lg:flex">
        <Link href="/boss" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-boss-elevated ring-1 ring-inset ring-boss-border">
            <Building2 size={18} className="text-boss-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-boss-text">도배르만</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-boss-text-muted">PRO Workspace</p>
          </div>
        </Link>

        <div className="space-y-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-boss-border bg-boss-elevated px-2.5 py-1">
              <ShieldCheck size={11} className="text-boss-primary" />
              <span className="text-[11px] font-medium text-boss-text-secondary">전국 300+ 검증된 사장님</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-boss-text">
              일에만 집중할 수 있는
              <br />
              사장님 워크스페이스
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-boss-text-muted">
              견적·시공·매출·고객 채팅까지 한 곳에서. 도배 사장님을 위한 가장 빠른 B2B 관리 도구.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              { icon: TrendingUp, label: '실시간 매출 트렌드와 인사이트' },
              { icon: MessageSquare, label: '고객과의 견적 채팅 통합 관리' },
              { icon: CheckCircle2, label: '시공 체크리스트와 전자 서명' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-boss-text-secondary">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-boss-border bg-boss-elevated">
                  <Icon size={14} className="text-boss-primary" />
                </div>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 text-xs text-boss-text-muted">
          <ShieldCheck size={13} className="text-boss-primary" />
          <span>SSL 암호화 · 사장님 데이터는 안전하게 보호됩니다.</span>
        </div>
      </aside>

      {/* RIGHT — Form */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/boss" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-boss-elevated ring-1 ring-inset ring-boss-border">
                <Building2 size={16} className="text-boss-primary" />
              </div>
              <span className="text-sm font-semibold text-boss-text">도배르만 PRO</span>
            </Link>
          </div>

          <div className="mb-7">
            <h2 className="text-xl font-semibold tracking-tight text-boss-text">사장님 로그인</h2>
            <p className="mt-1 text-sm text-boss-text-muted">
              계정이 없으신가요?{' '}
              <Link href="/boss/signup" className="font-medium text-boss-primary">
                무료로 시작하기
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="userId" className="boss-label">아이디</label>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
                <input
                  id="userId"
                  type="text"
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="boss-input pl-10"
                  placeholder="boss@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="boss-label">비밀번호</label>
                <Link href="/boss/find-password" className="text-[11px] font-medium text-boss-text-muted hover:text-boss-primary">
                  비밀번호 찾기
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="boss-input px-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-boss-text-muted hover:text-boss-text-secondary"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-boss-border accent-boss-primary"
              />
              <span className="text-xs text-boss-text-muted">로그인 상태 유지</span>
            </label>

            <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full">
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-boss-border" />
            <span className="text-[11px] text-boss-text-muted">또는</span>
            <span className="h-px flex-1 bg-boss-border" />
          </div>

          <Link href="/boss/find-id">
            <Button variant="secondary" size="md" className="mt-4 w-full">
              아이디 찾기
            </Button>
          </Link>

          <p className="mt-8 text-center text-[11px] text-boss-text-muted">
            로그인 시{' '}
            <Link href="/boss/help/terms" className="underline hover:text-boss-text">이용약관</Link>
            과{' '}
            <Link href="/boss/help/privacy" className="underline hover:text-boss-text">개인정보처리방침</Link>
            에 동의하게 됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
