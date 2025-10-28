// 소셜 로그인 관련 타입 정의
export interface SocialUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'kakao';
}

export interface SocialLoginResponse {
  success: boolean;
  user?: SocialUserInfo;
  token?: string;
  error?: string;
}

export interface SocialAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}
