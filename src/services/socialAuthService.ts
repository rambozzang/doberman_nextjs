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
// 폴백을 둔 이유: .env* 가 .gitignore 에 걸려 있어 Jenkins 빌드에 전달되지 않는다.
// 그러면 clientId 가 '' 가 되고 authorize URL 의 client_id 가 비어 카카오가 즉시 거부한다.
// (2026-08-05 운영 장애 — 구글만 폴백이 있어 구글만 동작했다)
// 이 값은 브라우저 번들에 그대로 실리는 공개 식별자이며 비밀키가 아니다.
const getKakaoConfig = (): SocialAuthConfig => ({
  clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '9420dfc85f523bd6bbcb2d33355dbc2f',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/kakao/callback` : '',
  scope: 'profile_nickname account_email'
});

// Naver OAuth 설정
// 폴백 이유는 위 카카오 설정과 동일하다. 이 값도 공개 식별자다.
const getNaverConfig = (): SocialAuthConfig => ({
  clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || 'FHiFYY97sjoBqAvgX4Na',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/naver/callback` : '',
  scope: 'name email' // 네이버는 스코프 설정 방식이 구글/카카오와 다를 수 있으나 형식상 유지
});

// 마지막으로 로그인한 소셜 계정 — 다음 로그인 때 계정 선택 화면을 건너뛰는 데 쓴다.
//
// 로그아웃(AuthManager.removeToken)해도 이 값은 지우지 않는다.
// 지우면 다시 로그인할 때마다 계정 선택이 뜨는데, 그게 없애려는 동작이다.
const LAST_SOCIAL_ACCOUNT_KEY = 'last_social_account';

type SocialProvider = 'google' | 'kakao' | 'naver';

// 직전에 같은 제공자로 로그인한 이메일을 돌려준다. 없으면 null.
const getLastSocialEmail = (provider: SocialProvider): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_SOCIAL_ACCOUNT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { provider?: string; email?: string };
    return saved.provider === provider && saved.email ? saved.email : null;
  } catch {
    // 저장값이 깨졌으면 힌트 없이 진행한다(로그인 자체는 막지 않는다).
    return null;
  }
};

const setLastSocialEmail = (provider: SocialProvider, email?: string): void => {
  if (typeof window === 'undefined' || !email) return;
  try {
    localStorage.setItem(LAST_SOCIAL_ACCOUNT_KEY, JSON.stringify({ provider, email }));
  } catch {
    // 저장 실패는 로그인 결과에 영향을 주지 않는다.
  }
};

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

    // prompt=consent 를 주면 이미 동의한 사용자에게도 매번 동의 화면이 뜬다.
    // 백엔드(SocialAuthSvc)는 access token 으로 프로필만 조회하고 refresh token 을
    // 저장하지 않으므로 access_type=offline 도 필요 없다.
    // 둘 다 빼면 구글이 기존 로그인 세션을 그대로 재사용한다.
    //
    // 다만 브라우저에 구글 계정이 여러 개 로그인돼 있으면 그래도 선택 화면이 뜬다.
    // 직전에 쓴 계정을 login_hint 로 넘겨 그 경우까지 건너뛴다.
    const lastEmail = getLastSocialEmail('google');
    if (lastEmail) {
      authUrl.searchParams.set('login_hint', lastEmail);
    }

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
        // 다음 로그인 때 계정 선택 화면을 건너뛰기 위해 기억해 둔다.
        setLastSocialEmail('google', userInfo.customerEmail);

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
        // 다음 로그인 때 계정 선택 화면을 건너뛰기 위해 기억해 둔다.
        setLastSocialEmail('kakao', userInfo.customerEmail);

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
        // 다음 로그인 때 계정 선택 화면을 건너뛰기 위해 기억해 둔다.
        setLastSocialEmail('naver', userInfo.customerEmail);

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
