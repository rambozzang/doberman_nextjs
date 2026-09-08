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

/** 저장한 아이디 (비밀번호는 저장하지 않는다) */
const SAVED_ID_KEY = 'boss_saved_user_id';

export default function BossLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // 아이디 저장 — 다음 방문 때 아이디를 채워 둔다(비밀번호는 저장하지 않는다)
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 세션이 끊겨 여기로 밀려온 경우 이유를 알려 준다 (bossApi 가 ?reason= 을 붙인다)
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // 저장해 둔 아이디가 있으면 채우고, 비밀번호로 바로 넘어가게 한다
    try {
      const saved = window.localStorage.getItem(SAVED_ID_KEY);
      // 처음 오는 사장님은 켜진 채로 둔다(대부분 자기 폰 · 자기 컴퓨터라 저장이 편하다).
      // 끄고 로그인하면 저장된 아이디를 지운다.
      if (saved) setUserId(saved);
    } catch {
      // 저장소를 못 쓰면 그냥 빈 칸으로 둔다
    }
  }, []);

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
        // 로그인에 성공했을 때만 아이디를 저장한다
        try {
          if (remember) window.localStorage.setItem(SAVED_ID_KEY, userId.trim());
          else window.localStorage.removeItem(SAVED_ID_KEY);
        } catch {
          // 저장 실패는 로그인을 막지 않는다
        }
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
              maxLength={50}
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
                maxLength={50}
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
              아이디 저장
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

          {/* 웹(boss)에서는 가입 신청을 받지 않는다 — 사장님 가입은 앱에서만 가능하다.
              링크는 없애지 않고 주석으로 남겨 둔다(가입을 웹으로 다시 열 때 참고). */}
          {/*
          <p className="mt-5 border-t border-boss-border pt-4 text-center text-[12.5px] text-boss-text-secondary">
            아직 계정이 없으신가요?{' '}
            <Link
              href="/boss/signup"
              className="font-semibold text-boss-primary underline underline-offset-2"
            >
              사장님 가입 신청
            </Link>
          </p>
          */}

          <div className="mt-5 border-t border-boss-border pt-4 text-center">
            <p className="text-[12.5px] text-boss-text-secondary">
              아직 계정이 없으신가요? 가입은 <span className="font-semibold text-boss-text">도배르만 앱</span>에서만 가능해요.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <a
                href="https://apps.apple.com/app/6740186789"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="App Store에서 도배르만 다운로드"
              >
                {/* 애플 배지(SVG)와 구글 배지(PNG)는 원본 비율이 서로 달라 h-10 w-auto 만으로는
                    가로폭이 어긋난다. 두 배지를 같은 상자 크기(w-[136px] h-10)에 object-contain
                    으로 맞춰 시각적으로 같은 크기로 보이게 한다. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/ko-kr?size=250x83"
                  alt="App Store에서 다운로드"
                  className="h-10 w-[136px] object-contain"
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.codelabtiger.doberman&hl=ko"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google Play에서 도배르만 다운로드"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://play.google.com/intl/ko/badges/static/images/badges/ko_badge_web_generic.png"
                  alt="Google Play에서 다운로드"
                  className="h-10 w-[136px] object-contain"
                />
              </a>
            </div>
          </div>
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
