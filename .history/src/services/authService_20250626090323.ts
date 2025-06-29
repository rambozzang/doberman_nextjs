import ApiClient from '@/lib/api';
import { AuthManager } from '@/lib/auth';
import { ApiResponse, LoginRequest, LoginResponse, UserInfo, RegisterRequest, ForgotPasswordRequest, ForgotPasswordResponse } from '@/types/api';

export class AuthService {
  // 로그인
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await ApiClient.post<LoginResponse>('/auth/login', credentials);
    
    // 로그인 성공 시 토큰과 사용자 정보 저장
    if (response.success && response.data) {
      const loginData = response.data as LoginResponse;
      
      if (loginData.token && loginData.userInfo) {
        console.log('로그인 성공 - 토큰과 사용자 정보 저장:', {
          token: loginData.token,
          userInfo: loginData.userInfo
        });
        AuthManager.setToken(loginData.token);
        AuthManager.setUserInfo(loginData.userInfo);
      } else {
        console.log('로그인 데이터 구조 확인:', loginData);
      }
    } else {
      console.log('로그인 응답 구조 확인:', response);
    }
    
    return response;
  }

  // 로그아웃
  static async logout(): Promise<void> {
    try {
      // 서버에 로그아웃 요청 (선택사항)
      await ApiClient.postPrivate('/auth/logout');
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // 로컬 토큰 삭제
      AuthManager.removeToken();
    }
  }

  // 회원가입 (실제 API 엔드포인트에 맞게 수정)
  static async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await ApiClient.post<LoginResponse>('/auth/login/with-email', userData);
    
    // 회원가입 성공 시 자동 로그인 (토큰과 사용자 정보 저장)
    if (response.success && response.data) {
      const loginData = response.data as LoginResponse;
      
      if (loginData.token && loginData.userInfo) {
        console.log('회원가입 성공 - 자동 로그인:', {
          token: loginData.token,
          userInfo: loginData.userInfo
        });
        AuthManager.setToken(loginData.token);
        AuthManager.setUserInfo(loginData.userInfo);
      }
    }
    
    return response;
  }

  // 비밀번호 찾기
  static async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponse>> {
    return await ApiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
  }

  // 토큰 갱신
  static async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await ApiClient.postPrivate<{ token: string }>('/auth/refresh');
    
    if (response.success && response.data?.token) {
      AuthManager.setToken(response.data.token);
    }
    
    return response;
  }

  // 비밀번호 재설정 요청 (전화번호 기반)
  static async requestPasswordReset(customerPhone: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<{ message: string }>('/auth/forgot-password', { customerPhone });
  }

  // 비밀번호 재설정
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      password: newPassword,
    });
  }

  // 현재 사용자 정보 조회
  static async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    return await ApiClient.getPrivate<UserInfo>('/auth/me');
  }

  // 이메일 인증
  static async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<{ message: string }>('/auth/verify-email', { token });
  }

  // 이메일 인증 재전송
  static async resendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.postPrivate<{ message: string }>('/auth/resend-verification');
  }
} 