import { JwtPayload } from '@/types/api';
import { BossUserInfo } from '@/types/boss';
import { clearListSnapshot } from '@/lib/boss/listCache';

// 사장님(boss) 전용 토큰/사용자 정보 저장소
// 고객(WEB)용 AuthManager와 storage key를 분리해 같은 브라우저에서 충돌하지 않게 함
const BOSS_TOKEN_KEY = 'boss_auth_token';
const BOSS_USER_INFO_KEY = 'boss_user_info';
// 세금계산서 작성 화면이 sessionStorage 에 남기는 작성본(new/page.tsx DRAFT_KEY 와 같은 값)
const TAX_INVOICE_DRAFT_KEY = 'boss:tax-invoice:draft';

/**
 * 로그인 · 로그아웃 때 이전 계정의 화면 기억을 버린다(2026-10-16).
 * 예전엔 같은 탭에서 다른 사장님이 로그인하면 앞 사람의 세금계산서 목록(고객 · 사업자번호 · 금액)과
 * 작성 중이던 내용(현금영수증 식별번호 포함)이 서버 확인 없이 그대로 보였다(사무실 공용 PC).
 */
function forgetPreviousAccount(): void {
  clearListSnapshot();
  try {
    sessionStorage.removeItem(TAX_INVOICE_DRAFT_KEY);
  } catch {
    // 저장소를 못 쓰는 브라우저는 남은 것도 없다
  }
}

export class BossAuthManager {
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      forgetPreviousAccount();
      localStorage.setItem(BOSS_TOKEN_KEY, token);
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(BOSS_TOKEN_KEY);
    }
    return null;
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      forgetPreviousAccount();
      localStorage.removeItem(BOSS_TOKEN_KEY);
      localStorage.removeItem(BOSS_USER_INFO_KEY);
    }
  }

  static setUserInfo(userInfo: BossUserInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BOSS_USER_INFO_KEY, JSON.stringify(userInfo));
    }
  }

  static getUserInfo(): BossUserInfo | null {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(BOSS_USER_INFO_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as BossUserInfo;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  static decodeToken(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  }

  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = this.decodeToken(token);
      // exp 클레임이 없으면 서버 판정에 위임하되, 디코딩은 정상이어야 함
      if (!payload.exp) return true;
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      // 디코딩 실패 시 토큰을 폐기하고 비인증 처리
      return false;
    }
  }

  static isLoggedIn(): boolean {
    return this.isTokenValid();
  }

  static getJwtPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token || !this.isTokenValid()) return null;
    try {
      return this.decodeToken(token);
    } catch {
      return null;
    }
  }
}
