import { JwtPayload, UserInfo } from '@/types/api';

const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';

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

  // 사용자 정보 저장
  static setUserInfo(userInfo: UserInfo): void {
    if (typeof window !== 'undefined') {
      console.log('AuthManager - 사용자 정보 저장:', userInfo);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    }
  }

  // 사용자 정보 가져오기
  static getUserInfo(): UserInfo | null {
    if (typeof window !== 'undefined') {
      const userInfoStr = localStorage.getItem(USER_INFO_KEY);
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr) as UserInfo;
          console.log('AuthManager - 사용자 정보 조회:', userInfo);
          return userInfo;
        } catch (error) {
          console.error('AuthManager - 사용자 정보 파싱 실패:', error);
          return null;
        }
      }
    }
    console.log('AuthManager - 저장된 사용자 정보 없음');
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