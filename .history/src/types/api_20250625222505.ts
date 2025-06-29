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

// 회원가입 요청 타입 (이메일 포함)
export interface RegisterRequest {
  customerPhone: string;
  customerName: string;
  customerEmail: string;
  customerPassword: string;
}

// 비밀번호 찾기 요청 타입
export interface ForgotPasswordRequest {
  customerName: string;
  customerPhone: string;
}

// 비밀번호 찾기 응답 타입
export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
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

// 견적 요청 관련 타입들
export interface CustomerRequest {
  id: number;
  region: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  constructionLocation: string;
  roomCount: number;
  areaSize: number;
  specialInfo: string;
  requestDate: string;
  createdDt: string;
  specialInfoDetail: string;
  hasItems: string;
  preferredDate: string;
  preferredDateDetail: string;
  agreeTerms: boolean;
  updatedDt: string;
  webCustomerId: number;
  buildingType: string;
  area: string | null;
  wallpaper: string;
  ceiling: string;
  etc1: string;
  etc2: string;
  etc3: string;
  answerCount: number;
}

// 견적 요청 리스트 요청 타입
export interface CustomerRequestListRequest {
  page: number;
  size: number;
}

// 내 견적 요청 리스트 요청 타입
export interface MyCustomerRequestListRequest {
  page: number;
  size: number;
  customerId: number;
  requestStartDate?: string;
  requestEndDate?: string;
  status?: string;
}

// 견적 요청 리스트 응답 타입
export interface CustomerRequestListResponse {
  content: CustomerRequest[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  isLast: boolean;
  size: number;
}

// 유튜브 비디오 인터페이스
export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  url: string;
  publishedAt: string;
  createdAt: string;
}

// 웹 고객 정보 타입
export interface TbWebCustomerDto {
  id?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  // 필요한 다른 필드들 추가
}

// 사용자 정보 타입
export interface TbUserDto {
  id?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  // 필요한 다른 필드들 추가
}

// 견적 요청 답변 타입
export interface CustomerRequestAnswer {
  id?: number;
  requestId?: number;
  webCustomerId?: string;
  userId?: string;
  answerTitle?: string;
  answerBody?: string;
  cost?: number;
  status?: string;
  delYn?: string;
  createdDt?: string;
  webCustomer?: TbWebCustomerDto;
  user?: TbUserDto;
}

// 견적 요청 검색 요청 타입
export interface CustomerRequestSearchRequest {
  page?: number;
  size?: number;
  searchKeyword?: string;
  status?: string;
  region?: string;
  sortBy?: string;
  sortDirection?: string;
}

// 견적 요청 통계 응답 타입
export interface CustomerRequestStatisticsResponse {
  totalCount: number;      // 전체 건수
  reviewingCount: number;  // 검토중 건수
  adoptedCount: number;    // 채택 성공 건수
  completedCount: number;  // 완료 건수
  canceledCount: number;   // 취소 건수
}

// 견적 요청 생성 요청 타입
export interface CreateCustomerRequestRequest {
  webCustomerId: number;
  buildingType: string;
  constructionLocation: string;
  roomCount: number;
  area: number;
  areaSize: number;
  wallpaper: string;
  ceiling: string;
  specialInfo: string;
  specialInfoDetail: string;
  hasItems: string;
  preferredDate: string;
  preferredDateDetail: string;
  region: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerPassword: string;
  agreeTerms: boolean;
  requestDate: string;
  status: string;
  etc1: string;
  etc2: string;
  etc3: string;
}

// 견적 요청 생성 응답 타입
export interface CreateCustomerRequestResponse {
  id: number;
  message: string;
} 