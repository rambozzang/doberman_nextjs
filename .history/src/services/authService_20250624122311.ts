import ApiClient from '@/lib/api';
import { AuthManager } from '@/lib/auth';
import { ApiResponse, LoginRequest, LoginResponse } from '@/types/api';

export class AuthService {
  // 로그인
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await ApiClient.post<LoginResponse>('/auth/login', credentials);
    
    // 로그인 성공 시 토큰 저장
    if (response.success && response.data?.token) {
      AuthManager.setToken(response.data.token);
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

  // 회원가입
  static async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<ApiResponse<LoginResponse>> {
    const response = await ApiClient.post<LoginResponse>('/auth/register', userData);
    
    // 회원가입 성공 시 자동 로그인
    if (response.success && response.data?.token) {
      AuthManager.setToken(response.data.token);
    }
    
    return response;
  }

  // 토큰 갱신
  static async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await ApiClient.postPrivate<{ token: string }>('/auth/refresh');
    
    if (response.success && response.data?.token) {
      AuthManager.setToken(response.data.token);
    }
    
    return response;
  }

  // 비밀번호 재설정 요청
  static async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<{ message: string }>('/auth/forgot-password', { email });
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
  static async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    return await ApiClient.getPrivate<LoginResponse['user']>('/auth/me');
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