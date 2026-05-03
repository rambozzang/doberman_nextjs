'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useBossAuth } from '@/hooks/useBossAuth';

// 로그인/공개 라우트 — 인증 없이 접근 허용
const PUBLIC_PATHS = [
  '/boss/login',
  '/boss/signup',
  '/boss/find-id',
  '/boss/find-password',
  '/boss/phone-auth',
  '/boss/agree',
  '/boss/permission',
];

export default function BossAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { bossAuth } = useBossAuth();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPublic && !bossAuth.isAuthenticated) {
      // localStorage를 직접 한 번 더 확인 — useBossAuth state 갱신 전에 redirect 되는 것 방지
      const tokenOnDisk = window.localStorage.getItem('boss_auth_token');
      if (!tokenOnDisk) {
        router.replace('/boss/login');
      }
    }
  }, [isPublic, bossAuth.isAuthenticated, router]);

  return <>{children}</>;
}
