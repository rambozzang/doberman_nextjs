// API 공통 응답 타입
export interface ApiResponse<T = unknown> {
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

// 로그인 요청 타입 (실제 API에 맞게 수정)
export interface LoginRequest {
  customerPhone: string;
  customerName: string;
  customerPassword: string;
}

// 사용자 정보 타입
export interface UserInfo {
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPassword: string;
  marketingAgree: boolean | null;
  memo: string;
  registrationDate: string;
  lastLoginDate: string;
  createdDt: string;
}

// 로그인 응답 타입 (실제 API에 맞게 수정)
export interface LoginResponse {
  token: string;
  userInfo: UserInfo;
}

// JWT 토큰 페이로드 타입 (실제 토큰 구조에 맞게 수정)
export interface JwtPayload {
  sub: string;
  companyId: string;
  user_type: string;
  exp: number;
  iat: number;
} 