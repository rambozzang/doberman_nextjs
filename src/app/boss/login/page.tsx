'use client';

// 사장님 로그인 — Industry 패턴 (agent.opentohome.com/login 과 같은 조판)
//
// 로그인 전 화면이라 레일(BossChrome)이 없다. 가운데 380px 열:
//   네이비 워드마크 블록 → 26px 제목 → 설명 → 패널 폼 → 하단 안내문
// 색·서체는 boss-b2b.css 토큰을 그대로 쓴다(.boss-page 가 layout 에서 감싼다).

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { bossAuthApi } from '@/lib/api/boss/auth';
import { BossAuthManager } from '@/lib/bossAuth';
import { ensureDeviceId } from '@/lib/bossDeviceId';
import type { BossLoginRequest } from '@/types/boss';
import { AlertBanner, Button, CheckLine, FieldLabel } from '@/components/boss/ui';
import { AuthWordmark } from '@/components/boss/AuthFrame';

export default function BossLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 세션이 끊겨 여기로 밀려온 경우 이유를 알려 준다 (bossApi 가 ?reason= 을 붙인다)
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason === 'device') {
      setNotice('다른 기기에서 로그인해 이 화면의 접속이 끊겼습니다. 다시 로그인해 주세요.');
    } else if (reason === 'expired') {
      setNotice('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: BossLoginRequest = {
        userId: userId.trim(),
        password,
        // 웹은 FCM 이 없다. clientType 으로 웹임을 알려 앱의 푸시 토큰을 지우지 않게 한다
        fcmToken: '',
        deviceId: ensureDeviceId() ?? '',
        clientType: 'WEB',
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
        setError(res.message || res.error || '아이디 또는 비밀번호가 맞지 않습니다.');
      }
    } catch (err) {
      console.error('boss login error', err);
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-[380px]">
        <AuthWordmark />

        <h1 className="font-boss-head text-[26px] font-semibold leading-tight tracking-[-0.015em] text-boss-text">
          사장님 센터
        </h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
          견적 · 고객 · 시공 · 수금까지 한 곳에서 관리합니다
        </p>

        <form onSubmit={handleSubmit} className="boss-card mt-4 p-6">
          <div>
            <FieldLabel htmlFor="userId">아이디</FieldLabel>
            <input
              id="userId"
              type="text"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="boss-input"
              autoFocus
            />
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="password">비밀번호</FieldLabel>
              <Link
                href="/boss/find-password"
                className="text-[11.5px] font-semibold text-boss-primary underline underline-offset-2"
              >
                비밀번호 찾기
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="boss-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-boss-text-muted hover:text-boss-text"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <CheckLine checked={remember} onChange={setRemember}>
              로그인 상태 유지
            </CheckLine>
          </div>

          {notice && !error && (
            <div className="mb-4">
              <AlertBanner tone="warn">{notice}</AlertBanner>
            </div>
          )}

          {error && (
            <div className="mt-4">
              <AlertBanner tone="bad">{error}</AlertBanner>
            </div>
          )}

          <Button type="submit" variant="primary" disabled={loading} className="mt-5 w-full py-3">
            {loading ? '로그인 중…' : '로그인'}
          </Button>

          <p className="mt-5 border-t border-boss-border pt-4 text-center text-[12.5px] text-boss-text-secondary">
            아직 계정이 없으신가요?{' '}
            <Link
              href="/boss/signup"
              className="font-semibold text-boss-primary underline underline-offset-2"
            >
              사장님 가입 신청
            </Link>
          </p>
          <p className="mt-2 text-center text-[12.5px] text-boss-text-secondary">
            아이디를 잊으셨나요?{' '}
            <Link
              href="/boss/find-id"
              className="font-semibold text-boss-primary underline underline-offset-2"
            >
              아이디 찾기
            </Link>
          </p>
        </form>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-boss-text-secondary">
          로그인하면{' '}
          <Link href="/boss/help/terms" className="underline underline-offset-2 !text-boss-text-secondary hover:!text-boss-text">
            이용약관
          </Link>
          과{' '}
          <Link href="/boss/help/privacy" className="underline underline-offset-2 !text-boss-text-secondary hover:!text-boss-text">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}
