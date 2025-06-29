import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '@/types/api';
import { AuthManager } from './auth';

// API 기본 URL (환경변수에서 설정)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// 공통 Axios 설정
const commonConfig: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 비로그인용 Axios 인스턴스
const publicApi: AxiosInstance = axios.create(commonConfig);

// 로그인용 Axios 인스턴스
const privateApi: AxiosInstance = axios.create(commonConfig);

// 로그인용 인스턴스에 토큰 인터셉터 추가
privateApi.interceptors.request.use(
  (config) => {
    const token = AuthManager.getToken();
    if (token && AuthManager.isTokenValid()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      AuthManager.removeToken();
      // 로그인 페이지로 리다이렉트 (필요시)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API 응답 처리 유틸리티
class ApiClient {
  // GET 요청 (공개)
  static async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await publicApi.get(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // GET 요청 (인증 필요)
  static async getPrivate<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await privateApi.get(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // POST 요청 (공개)
  static async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await publicApi.post(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // POST 요청 (인증 필요)
  static async postPrivate<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await privateApi.post(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // PUT 요청 (인증 필요)
  static async putPrivate<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await privateApi.put(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // DELETE 요청 (인증 필요)
  static async deletePrivate<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await privateApi.delete(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // PATCH 요청 (인증 필요)
  static async patchPrivate<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await privateApi.patch(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 에러 처리
  private static handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as ApiResponse;
      
      return {
        success: false,
        message: responseData?.message || '요청 처리 중 오류가 발생했습니다.',
        error: responseData?.error || error.message || '알 수 없는 오류가 발생했습니다.',
      };
    }

    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: '네트워크 연결을 확인해주세요.',
    };
  }
}

export default ApiClient;
export { publicApi, privateApi }; 