import { JwtPayload, UserInfo } from '@/types/api';

const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';

/** 저장 · 반환 전에 비밀번호 칸을 뺀다 */
function withoutPassword(userInfo: UserInfo): UserInfo {
  const rest = { ...(userInfo as UserInfo & { customerPassword?: unknown }) };
  delete rest.customerPassword;
  return rest;
}

export class AuthManager {
  // 토큰 저장
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  // 토큰 가져오기
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  // 토큰 삭제
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_INFO_KEY);
    }
  }

  // 사용자 정보 저장 — 비밀번호 칸은 저장하지 않는다(2026-10-28).
  // 예전 서버는 로그인 응답에 비밀번호 암호값까지 실어 보냈고, 그 값이 이 브라우저 저장소에 그대로 남았다.
  static setUserInfo(userInfo: UserInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(withoutPassword(userInfo)));
    }
  }

  // 사용자 정보 가져오기
  static getUserInfo(): UserInfo | null {
    if (typeof window !== 'undefined') {
      const userInfoStr = localStorage.getItem(USER_INFO_KEY);
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr) as UserInfo;
          // 예전에 저장된 비밀번호 암호값은 읽을 때 지우고 다시 저장한다
          if (userInfo && typeof userInfo === 'object' && 'customerPassword' in userInfo) {
            const cleaned = withoutPassword(userInfo);
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
          return userInfo;
        } catch (error) {
          console.error('AuthManager - 사용자 정보 파싱 실패:', error);
          return null;
        }
      }
    }
    return null;
  }

  // 토큰 유효성 검사
  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // JWT 토큰 디코딩
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

  // 로그인 상태 확인
  static isLoggedIn(): boolean {
    return this.isTokenValid();
  }

  // JWT 페이로드 가져오기
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