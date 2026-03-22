import { SocialLoginResponse, SocialAuthConfig } from '@/types/social';
import { UserInfo } from '@/types/api';
import ApiClient from '@/lib/api';
import { AuthManager } from '@/lib/auth';

// Google OAuth 설정
const getGoogleConfig = (): SocialAuthConfig => ({
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '814801233548-fggqiq4s3ne3vc5l1lqv6r31phpes55c.apps.googleusercontent.com',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '',
  scope: 'openid email profile'
});

// Kakao OAuth 설정
const getKakaoConfig = (): SocialAuthConfig => ({
  clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/kakao/callback` : '',
  scope: 'profile_nickname account_email'
});

// Naver OAuth 설정
const getNaverConfig = (): SocialAuthConfig => ({
  clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/naver/callback` : '',
  scope: 'name email' // 네이버는 스코프 설정 방식이 구글/카카오와 다를 수 있으나 형식상 유지
});

// 백엔드 소셜 로그인 응답 타입 (TbUser 엔티티 구조)
interface BackendSocialLoginResponse {
  token: string;
  isNewUser: boolean;
  userInfo: {
    customerId: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerPassword: string;
    marketingAgree: boolean | null;
    provider: string | null;
    socialId: string | null;
    memo: string;
    registrationDate: string;
    lastLoginDate: string;
    createdDt: string;
  };
}

class SocialAuthService {
  // Google 로그인 시작 (팝업 방식 - postMessage 사용)
  static async initiateGoogleLogin(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('이 메서드는 클라이언트 사이드에서만 실행할 수 있습니다.');
    }

    const config = getGoogleConfig();
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    // 팝업창 설정
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // 팝업창 열기
    const popup = window.open(
      authUrl.toString(),
      'google-login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      throw new Error('팝업창이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }

    // postMessage 리스너로 콜백 처리
    return new Promise((resolve, reject) => {
      let timer: any = null;
      let popupCheckInterval: any = null;

      const cleanup = () => {
        window.removeEventListener('message', messageHandler);
        if (timer) clearTimeout(timer);
        if (popupCheckInterval) clearInterval(popupCheckInterval);
      };

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
          cleanup();
          resolve();
        } else if (event.data.type === 'GOOGLE_LOGIN_ERROR') {
          cleanup();
          reject(new Error(event.data.error || '로그인에 실패했습니다.'));
        }
      };

      window.addEventListener('message', messageHandler);

      // 팝업이 닫혔는지 주기적으로 확인
      popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('로그인이 취소되었습니다.'));
        }
      }, 1000);

      // 5분 후 타임아웃
      timer = setTimeout(() => {
        cleanup();
        try {
          if (popup && !popup.closed) popup.close();
        } catch (e) {
          console.log('팝업 종료 오류(무시):', e);
        }
        reject(new Error('로그인 시간이 초과되었습니다.'));
      }, 300000);
    });
  }

  // Kakao 로그인 시작 (팝업 방식 - postMessage 사용)
  static async initiateKakaoLogin(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('이 메서드는 클라이언트 사이드에서만 실행할 수 있습니다.');
    }

    const config = getKakaoConfig();
    const authUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scope);

    // 팝업창 설정
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // 팝업창 열기
    const popup = window.open(
      authUrl.toString(),
      'kakao-login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      throw new Error('팝업창이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }

    // postMessage 리스너로 콜백 처리
    return new Promise((resolve, reject) => {
      let timer: any = null;
      let popupCheckInterval: any = null;

      const cleanup = () => {
        window.removeEventListener('message', messageHandler);
        if (timer) clearTimeout(timer);
        if (popupCheckInterval) clearInterval(popupCheckInterval);
      };

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'KAKAO_LOGIN_SUCCESS') {
          cleanup();
          resolve();
        } else if (event.data.type === 'KAKAO_LOGIN_ERROR') {
          cleanup();
          reject(new Error(event.data.error || '로그인에 실패했습니다.'));
        }
      };

      window.addEventListener('message', messageHandler);

      // 팝업이 닫혔는지 주기적으로 확인
      popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('로그인이 취소되었습니다.'));
        }
      }, 1000);

      // 5분 후 타임아웃
      timer = setTimeout(() => {
        cleanup();
        try {
          if (popup && !popup.closed) popup.close();
        } catch (e) {
          console.log('팝업 종료 오류(무시):', e);
        }
        reject(new Error('로그인 시간이 초과되었습니다.'));
      }, 300000);
    });
  }

  // Naver 로그인 시작 (팝업 방식 - postMessage 사용)
  static async initiateNaverLogin(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('이 메서드는 클라이언트 사이드에서만 실행할 수 있습니다.');
    }

    const config = getNaverConfig();
    const authUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', Math.random().toString(36).substring(2, 11)); // Naver requires state

    // 팝업창 설정
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // 팝업창 열기
    const popup = window.open(
      authUrl.toString(),
      'naver-login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      throw new Error('팝업창이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }

    // postMessage 리스너로 콜백 처리
    return new Promise((resolve, reject) => {
      let timer: any = null;
      let popupCheckInterval: any = null;

      const cleanup = () => {
        window.removeEventListener('message', messageHandler);
        if (timer) clearTimeout(timer);
        if (popupCheckInterval) clearInterval(popupCheckInterval);
      };

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'NAVER_LOGIN_SUCCESS') {
          cleanup();
          resolve();
        } else if (event.data.type === 'NAVER_LOGIN_ERROR') {
          cleanup();
          reject(new Error(event.data.error || '로그인에 실패했습니다.'));
        }
      };

      window.addEventListener('message', messageHandler);

      // 팝업이 닫혔는지 주기적으로 확인
      popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('로그인이 취소되었습니다.'));
        }
      }, 1000);

      // 5분 후 타임아웃
      timer = setTimeout(() => {
        cleanup();
        try {
          if (popup && !popup.closed) popup.close();
        } catch (e) {
          console.log('팝업 종료 오류(무시):', e);
        }
        reject(new Error('로그인 시간이 초과되었습니다.'));
      }, 300000);
    });
  }

  // Google 인증 코드로 백엔드 로그인 처리
  static async handleGoogleCallback(code: string): Promise<SocialLoginResponse> {
    try {
      // 백엔드 API로 인증 코드 전달 (백엔드에서 토큰 교환 처리)
      const response = await ApiClient.post<BackendSocialLoginResponse>('/auth/social/google/login', {
        code: code,
        redirectUri: getGoogleConfig().redirectUri,
        provider: 'google',
        deviceId: this.getDeviceId(),
        fcmToken: this.getFcmToken(),
      });

      if (response.success && response.data) {
        // JWT 토큰 저장
        AuthManager.setToken(response.data.token);

        // 백엔드에서 받은 userInfo를 바로 저장
        const userInfo: UserInfo = response.data.userInfo;
        AuthManager.setUserInfo(userInfo);

        return {
          success: true,
          user: {
            id: userInfo.socialId || userInfo.customerId?.toString() || '',
            email: userInfo.customerEmail || '',
            name: userInfo.customerName || '소셜 사용자',
            picture: '', // 프로필 이미지는 별도 처리 필요시 추가
            provider: 'google'
          },
          token: response.data.token
        };
      } else {
        throw new Error(response.message || 'Google 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.'
      };
    }
  }

  // Kakao 인증 코드로 백엔드 로그인 처리
  static async handleKakaoCallback(code: string): Promise<SocialLoginResponse> {
    const redirectUri = getKakaoConfig().redirectUri;

    try {
      // 백엔드 API로 인증 코드 전달 (백엔드에서 토큰 교환 처리)
      const response = await ApiClient.post<BackendSocialLoginResponse>('/auth/social/kakao/login', {
        code: code,
        redirectUri: redirectUri,
        provider: 'kakao',
        deviceId: this.getDeviceId(),
        fcmToken: this.getFcmToken(),
      });

      if (response.success && response.data) {
        // JWT 토큰 저장
        AuthManager.setToken(response.data.token);

        // 백엔드에서 받은 userInfo를 바로 저장
        const userInfo: UserInfo = response.data.userInfo;
        AuthManager.setUserInfo(userInfo);

        return {
          success: true,
          user: {
            id: userInfo.socialId || userInfo.customerId?.toString() || '',
            email: userInfo.customerEmail || '',
            name: userInfo.customerName || '소셜 사용자',
            picture: '', // 프로필 이미지는 별도 처리 필요시 추가
            provider: 'kakao'
          },
          token: response.data.token
        };
      } else {
        throw new Error(response.message || 'Kakao 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Kakao 로그인 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kakao 로그인 중 오류가 발생했습니다.'
      };
    }
  }

  // Naver 인증 코드로 백엔드 로그인 처리
  static async handleNaverCallback(code: string, state: string): Promise<SocialLoginResponse> {
    try {
      // 백엔드 API로 인증 코드 전달
      const response = await ApiClient.post<BackendSocialLoginResponse>('/auth/social/naver/login', {
        code: code,
        state: state,
        redirectUri: getNaverConfig().redirectUri,
        provider: 'naver',
        deviceId: this.getDeviceId(),
        fcmToken: this.getFcmToken(),
      });

      if (response.success && response.data) {
        // JWT 토큰 저장
        AuthManager.setToken(response.data.token);

        // 백엔드에서 받은 userInfo를 바로 저장
        const userInfo: UserInfo = response.data.userInfo;
        AuthManager.setUserInfo(userInfo);

        return {
          success: true,
          user: {
            id: userInfo.socialId || userInfo.customerId?.toString() || '',
            email: userInfo.customerEmail || '',
            name: userInfo.customerName || '소셜 사용자',
            picture: '',
            provider: 'naver'
          },
          token: response.data.token
        };
      } else {
        throw new Error(response.message || 'Naver 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Naver 로그인 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Naver 로그인 중 오류가 발생했습니다.'
      };
    }
  }

  // 디바이스 ID 가져오기
  private static getDeviceId(): string {
    if (typeof window === 'undefined') return '';

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  // FCM 토큰 가져오기 (향후 구현)
  private static getFcmToken(): string {
    if (typeof window === 'undefined') return '';

    // TODO: Firebase Cloud Messaging 토큰 구현
    return localStorage.getItem('fcmToken') || '';
  }
}

export default SocialAuthService;
