'use client';

import { useCallback, useEffect, useState } from 'react';
import { BossAuthManager } from '@/lib/bossAuth';
import { BossUserInfo } from '@/types/boss';

export interface BossAuthState {
  token: string | null;
  userId: string | null;
  userType: 'APP'; // 사장님은 항상 APP 사용자 타입
  userInfo: BossUserInfo | null;
  isAuthenticated: boolean;
}

const INITIAL: BossAuthState = {
  token: null,
  userId: null,
  userType: 'APP',
  userInfo: null,
  isAuthenticated: false,
};

/** localStorage 동기 조회로 첫 렌더부터 정확한 인증 상태 반환 (SSR-safe) */
function readBossAuth(): BossAuthState {
  if (typeof window === 'undefined') return INITIAL;
  const token = BossAuthManager.getToken();
  const userInfo = BossAuthManager.getUserInfo();
  const ok = BossAuthManager.isLoggedIn();
  if (token && userInfo && ok) {
    return {
      token,
      userId: userInfo.userId ?? null,
      userType: 'APP',
      userInfo,
      isAuthenticated: true,
    };
  }
  return INITIAL;
}

export const useBossAuth = () => {
  // 첫 렌더부터 토큰을 동기적으로 읽어 BossAuthGuard 가 무한 리다이렉트되지 않도록 함
  const [bossAuth, setBossAuth] = useState<BossAuthState>(readBossAuth);

  const refresh = useCallback(() => {
    setBossAuth(readBossAuth());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 토큰 변화 주기 감지 (다른 탭에서 로그아웃 등)
  useEffect(() => {
    const interval = setInterval(() => {
      const t = BossAuthManager.getToken();
      const ok = BossAuthManager.isLoggedIn();
      if (t !== bossAuth.token || ok !== bossAuth.isAuthenticated) {
        refresh();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [bossAuth.token, bossAuth.isAuthenticated, refresh]);

  const logout = useCallback(() => {
    BossAuthManager.removeToken();
    setBossAuth(INITIAL);
  }, []);

  return {
    bossAuth,
    refreshBossAuth: refresh,
    bossLogout: logout,
    isReady: bossAuth.isAuthenticated,
  };
};
