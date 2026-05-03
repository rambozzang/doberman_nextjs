import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types/api';
import { BossAuthManager } from './bossAuth';
import { ensureDeviceId } from './bossDeviceId';

// 사장님(boss) 전용 API 클라이언트
// Flutter `UrlConfig.baseURL` 과 동일한 기본 백엔드(api-doman) 를 사용한다.
// 엔드포인트별 prefix(`/auth`, `/web`, `/webapp`, `/customers` ...) 는 각 호출부에서 명시.
const API_BASE_URL = process.env.NEXT_PUBLIC_BOSS_API_URL || 'https://www.tigerbk.com/api-doman';

const commonConfig: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
};

const bossPublicApi: AxiosInstance = axios.create(commonConfig);
const bossPrivateApi: AxiosInstance = axios.create(commonConfig);

// 토큰이 존재하면 클라이언트 측 만료 검증 없이 그대로 첨부 (서버가 판정).
// Device-ID 헤더: Flutter 앱과 동일하게 localStorage 기반 UUID 를 첨부한다.
// 백엔드 CORS 의 allowedHeaders 에 'Device-ID' 가 추가돼야 실제 전송되지만,
// 클라이언트는 미리 헤더를 준비해두고 백엔드 CORS 갱신 즉시 동작하도록 한다.
bossPrivateApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = BossAuthManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const deviceId = ensureDeviceId();
    if (deviceId) {
      config.headers['Device-ID'] = deviceId;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[bossApi req]', config.method?.toUpperCase(), config.url, {
        hasToken: !!token,
        tokenPreview: token ? `${token.slice(0, 16)}...(len ${token.length})` : null,
        deviceId: deviceId ? `${deviceId.slice(0, 8)}...` : null,
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

bossPrivateApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        console.error('[bossApi 401]', {
          url: error.config?.url,
          requestHeaders: error.config?.headers,
          responseData: error.response?.data,
          responseHeaders: error.response?.headers,
        });
      }
      // 401 시 토큰 제거 + 로그인 페이지로 리다이렉트 (production 동작)
      BossAuthManager.removeToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/boss/login')) {
        window.location.href = '/boss/login';
      }
    }
    return Promise.reject(error);
  }
);

// 백엔드 응답 정규화:
// - Spring Boot 측이 {success, data, message, error} 로 감싸면 그대로 반환
// - 감싸지 않고 {token, userInfo ...} 형태의 원시 객체/배열을 내려주면
//   {success: true, data: payload} 로 래핑해 다운스트림 로직 일관성 유지
function normalize<T>(raw: unknown): ApiResponse<T> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const hasEnvelope =
      'success' in obj || ('data' in obj && ('message' in obj || 'error' in obj));
    if (hasEnvelope) {
      return raw as ApiResponse<T>;
    }
  }
  return { success: true, data: raw as T };
}

class BossApiClient {
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const r: AxiosResponse<unknown> = await bossPublicApi.get(url, config);
      return normalize<T>(r.data);
    } catch (e) { return this.handleError(e); }
  }
  static async getPrivate<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const r: AxiosResponse<unknown> = await bossPrivateApi.get(url, config);
      return normalize<T>(r.data);
    } catch (e) { return this.handleError(e); }
  }
  static async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const r: AxiosResponse<unknown> = await bossPublicApi.post(url, data, config);
      return normalize<T>(r.data);
    } catch (e) { return this.handleError(e); }
  }
  static async postPrivate<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const r: AxiosResponse<unknown> = await bossPrivateApi.post(url, data, config);
      return normalize<T>(r.data);
    } catch (e) { return this.handleError(e); }
  }
  static async putPrivate<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const r: AxiosResponse<unknown> = await bossPrivateApi.put(url, data, config);
      return normalize<T>(r.data);
    } catch (e) { return this.handleError(e); }
  }
  static async deletePrivate<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const r: AxiosResponse<unknown> = await bossPrivateApi.delete(url, config);
      return normalize<T>(r.data);
    } catch (e) { return this.handleError(e); }
  }
  static async patchPrivate<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const r: AxiosResponse<unknown> = await bossPrivateApi.patch(url, data, config);
      return normalize<T>(r.data);
    } catch (e) { return this.handleError(e); }
  }

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

export default BossApiClient;
export { bossPublicApi, bossPrivateApi };
