'use client';

// 계정 범위 — 세금계산서 운영 화면이 "지금 로그인한 그 사장님"의 것만 보이게 한다(사무실 공용 PC).
//
//   범위 = 사용자 아이디 + 토큰(토큰은 원문 대신 짧은 요약값). 로그아웃 · 만료면 null.
//   화면은 범위가 바뀌면 key 로 새로 그려 앞 계정의 내용을 버리고, null 이면 내용을 감춘다.
//   비동기 응답을 화면에 넣기 직전과 처리 요청을 보내기 직전에 isCurrentScope 로 다시 대조한다
//   (useBossAuth 는 5초마다 확인하므로 그 사이에 계정이 바뀌어도 앞 계정 응답을 넣지 않는다).
//   다른 탭의 로그인 · 로그아웃은 storage 이벤트로, 같은 탭은 짧은 주기 확인 · 화면 복귀로 알아챈다.

import { useSyncExternalStore } from 'react';
import { BossAuthManager } from '@/lib/bossAuth';

function digest(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${s.length.toString(36)}${h.toString(36)}`;
}

/** 지금 로그인한 계정의 범위 값. 로그아웃 · 만료 · 서버 렌더 중이면 null */
export function readBossScope(): string | null {
  if (typeof window === 'undefined') return null;
  const token = BossAuthManager.getToken();
  const userId = BossAuthManager.getUserInfo()?.userId;
  if (!token || !userId || !BossAuthManager.isLoggedIn()) return null;
  return `${userId}:${digest(token)}`;
}

/** 이 범위로 시작한 일이 아직 같은 계정에서 이어지는가 */
export function isCurrentScope(scope: string | null | undefined): boolean {
  return scope != null && scope === readBossScope();
}

const SAME_TAB_CHECK_MS = 1_500;

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onChange);
  const timer = setInterval(onChange, SAME_TAB_CHECK_MS);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onChange);
    clearInterval(timer);
  };
}

/** 계정 범위 — 서버 렌더 · 첫 그리기(hydration)에서는 null 이라 내용이 먼저 보이지 않는다 */
export function useBossScope(): string | null {
  return useSyncExternalStore(subscribe, readBossScope, () => null);
}
