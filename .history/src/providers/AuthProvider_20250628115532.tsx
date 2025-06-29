"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { AuthService } from '@/services/authService';
import { UserInfo, LoginRequest, ApiResponse, LoginResponse, RegisterRequest } from '@/types/api';

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserInfo | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<void>;
  register: (userData: RegisterRequest) => Promise<ApiResponse<LoginResponse>>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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

  // 컴포넌트 마운트 시 인증 상태 확인 (한 번만)
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
  const register = async (userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
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

  const value: AuthContextType = {
    isLoggedIn,
    user,
    isLoading,
    login,
    logout,
    register,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 