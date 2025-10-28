import { SocialUserInfo, SocialLoginResponse, SocialAuthConfig } from '@/types/social';

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

class SocialAuthService {
  // Google 로그인 시작 (팝업창)
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
    
    // 팝업창 열기
    const popup = window.open(
      authUrl.toString(),
      'google-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      throw new Error('팝업창이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }
    
    // 팝업창이 닫힐 때까지 대기
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          resolve();
        }
      }, 1000);
      
      // 5분 후 타임아웃
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
          reject(new Error('로그인 시간이 초과되었습니다.'));
        }
      }, 300000);
    });
  }

  // Kakao 로그인 시작 (팝업창)
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
    
    // 팝업창 열기
    const popup = window.open(
      authUrl.toString(),
      'kakao-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      throw new Error('팝업창이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }
    
    // 팝업창이 닫힐 때까지 대기
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          resolve();
        }
      }, 1000);
      
      // 5분 후 타임아웃
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
          reject(new Error('로그인 시간이 초과되었습니다.'));
        }
      }, 300000);
    });
  }

  // Google 인증 코드로 사용자 정보 가져오기
  static async handleGoogleCallback(code: string): Promise<SocialLoginResponse> {
    try {
      // 1. 인증 코드로 액세스 토큰 교환
      const tokenResponse = await fetch('/api/auth/google/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirectUri: getGoogleConfig().redirectUri }),
      });

      if (!tokenResponse.ok) {
        throw new Error('토큰 교환 실패');
      }

      const { access_token } = await tokenResponse.json();

      // 2. 액세스 토큰으로 사용자 정보 가져오기
      const userResponse = await fetch('/api/auth/google/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token }),
      });

      if (!userResponse.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const userData = await userResponse.json();

      // 3. 사용자 정보 변환
      const userInfo: SocialUserInfo = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        provider: 'google'
      };

      return {
        success: true,
        user: userInfo
      };
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.'
      };
    }
  }

  // Kakao 인증 코드로 사용자 정보 가져오기
  static async handleKakaoCallback(code: string): Promise<SocialLoginResponse> {
    try {
      // 1. 인증 코드로 액세스 토큰 교환
      const tokenResponse = await fetch('/api/auth/kakao/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirectUri: getKakaoConfig().redirectUri }),
      });

      if (!tokenResponse.ok) {
        throw new Error('토큰 교환 실패');
      }

      const { access_token } = await tokenResponse.json();

      // 2. 액세스 토큰으로 사용자 정보 가져오기
      const userResponse = await fetch('/api/auth/kakao/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token }),
      });

      if (!userResponse.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const userData = await userResponse.json();

      // 3. 사용자 정보 변환
      const userInfo: SocialUserInfo = {
        id: userData.id.toString(),
        email: userData.kakao_account?.email || '',
        name: userData.kakao_account?.profile?.nickname || userData.kakao_account?.profile?.name || '',
        picture: userData.kakao_account?.profile?.profile_image_url,
        provider: 'kakao'
      };

      return {
        success: true,
        user: userInfo
      };
    } catch (error) {
      console.error('Kakao 로그인 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kakao 로그인 중 오류가 발생했습니다.'
      };
    }
  }

  // 소셜 로그인으로 회원가입/로그인 처리
  static async processSocialLogin(userInfo: SocialUserInfo, isSignUp: boolean = false): Promise<SocialLoginResponse> {
    try {
      const endpoint = isSignUp ? '/api/auth/social/signup' : '/api/auth/social/login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socialId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: userInfo.provider
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          user: userInfo,
          token: result.token
        };
      } else {
        return {
          success: false,
          error: result.error || '소셜 로그인 처리 중 오류가 발생했습니다.'
        };
      }
    } catch (error) {
      console.error('소셜 로그인 처리 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '소셜 로그인 처리 중 오류가 발생했습니다.'
      };
    }
  }
}

export default SocialAuthService;
