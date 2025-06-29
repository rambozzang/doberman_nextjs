import { useState, useEffect } from 'react';
import { AuthManager } from '@/lib/auth';
import { AuthService } from '@/services/authService';
import { UserInfo, LoginRequest, ApiResponse, LoginResponse, RegisterRequest } from '@/types/api';

export interface UseAuthReturn {
  isLoggedIn: boolean;
  user: UserInfo | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<void>;
  register: (userData: RegisterRequest) => Promise<ApiResponse<LoginResponse>>;
  refreshAuth: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 인증 상태 확인
  const checkAuthStatus = () => {
    const loggedIn = AuthManager.isLoggedIn();
    const userInfo = AuthManager.getUserInfo();
    
    setIsLoggedIn(loggedIn);
    setUser(userInfo);
    setIsLoading(false);
  };

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 로그인
  const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(credentials);
      
      if (response.success) {
        checkAuthStatus(); // 인증 상태 업데이트
      }
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입
  const register = async (userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    setIsLoading(true);
    try {
      const response = await AuthService.register(userData);
      
      if (response.success) {
        checkAuthStatus(); // 인증 상태 업데이트
      }
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 상태 새로고침
  const refreshAuth = () => {
    checkAuthStatus();
  };

  return {
    isLoggedIn,
    user,
    isLoading,
    login,
    logout,
    register,
    refreshAuth,
  };
}; 