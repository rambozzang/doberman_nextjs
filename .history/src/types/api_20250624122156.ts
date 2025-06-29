// API 공통 응답 타입
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// 에러 응답 타입
export interface ApiError {
  success: false;
  message?: string;
  error: string;
}

// 성공 응답 타입
export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

// 페이지네이션 타입
export interface PaginationData<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 로그인 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// JWT 토큰 페이로드 타입
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  exp: number;
  iat: number;
} 