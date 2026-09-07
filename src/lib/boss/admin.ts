// 운영자 판정 — 백엔드 application.yml `admin.user-ids` 와 같은 목록
//
// 화면에서 메뉴를 감추는 용도다. 진짜 막는 건 서버(/store-admin 은 관리자만 통과)다.

import { BossAuthManager } from '@/lib/bossAuth';

export const ADMIN_USER_IDS = ['irambo7', 'judoli3', 'irambo5', 'wallpaper_man'];

export function isBossAdmin(userId?: string | null): boolean {
  return !!userId && ADMIN_USER_IDS.includes(userId);
}

/** 지금 로그인한 사장님이 운영자인가 (브라우저에서만) */
export function currentBossIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return isBossAdmin(BossAuthManager.getUserInfo()?.userId);
}
