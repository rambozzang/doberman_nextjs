// 사장님(boss) 전용 API 타입 정의
// Flutter `lib/app/login/cntr/login_data.dart` 의 UserInfo 스키마를 그대로 따른다.
// 백엔드(`https://www.tigerbk.com/api-doman/auth/login`) 응답과 1:1 매칭.

export interface BossUserInfo {
  id?: number;
  userId?: string;
  name?: string;
  nickNm?: string;
  profilePath?: string;
  phone?: string;
  email?: string;
  companyId?: number;
  alramTime?: string;
  createdDt?: string;
  deviceId?: string;
}

export interface BossLoginRequest {
  userId: string;
  password: string;
  fcmToken: string;
  deviceId: string;
}

// Flutter 의 LoginData (= res.data) 와 동일
export interface BossLoginResponse {
  token: string;
  userInfo: BossUserInfo;
}

// Flutter SignupData
export interface BossSignupRequest {
  userId: string;
  password: string;
  name?: string;
  nickNm?: string;
  profilePath?: string;
  phone?: string;
  email?: string;
  companyId?: number;
  fcmToken?: string;
  deviceId?: string;
}

// 아이디 찾기 (Flutter /auth/find-id)
export interface BossFindIdRequest {
  name: string;
  phone: string;
}

// 비밀번호 찾기 사용자 확인 (Flutter /auth/checkUserInfo)
export interface BossCheckUserInfoRequest {
  userId: string;
  userNm: string;
  hp: string;
}

// 비밀번호 변경 (Flutter /auth/password)
export interface BossChangePasswordRequest {
  userId: string;
  password: string;
}

// 회사(업체) 정보 — Flutter CompanyData 1:1
export interface BossCompanyData {
  id?: number;
  name?: string;
  post?: string;
  address1?: string;
  address2?: string;
  phone?: string;
  fax?: string;
  email?: string;
  owner?: string;
  bizno?: string;
  type?: string;
  kind?: string;
  logo?: string;
  stamp?: string;
  bigo?: string;
  url?: string;
  intro?: string;
  region?: string;
}

// 사용자 검색 (Flutter /user/search)
export interface BossUserSearchRequest {
  searchWord: string;
}

// 견적 요청 목록 아이템 (사장님 화면용)
export interface BossRequestListItem {
  id: number;
  region?: string;
  status?: string;
  customerName?: string;
  customerPhone?: string;
  buildingType?: string;
  constructionLocation?: string;
  roomCount?: number;
  areaSize?: number;
  wallpaper?: string;
  ceiling?: string;
  preferredDate?: string;
  preferredDateDetail?: string;
  specialInfo?: string;
  specialInfoDetail?: string;
  hasItems?: string;
  requestDate?: string;
  createdDt?: string;
  answerCount?: number;
  webCustomerId?: number;
}

export interface BossRequestDetail extends BossRequestListItem {
  customerEmail?: string;
  etc1?: string;
  etc2?: string;
  etc3?: string;
  area?: string | null;
  agreeTerms?: boolean;
  updatedDt?: string;
}

export interface BossRequestListParams {
  page: number;
  size: number;
  status?: string;
  region?: string;
  searchKeyword?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface BossRequestListResponse {
  content: BossRequestListItem[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  isLast: boolean;
  size: number;
}

export interface BossAnswerSubmitRequest {
  requestId: number;
  webCustomerId?: number;
  answerTitle: string;
  answerBody: string;
  cost: number;
}

export interface BossAnswerSubmitResponse {
  answerId?: number;
  message?: string;
}

export interface BossRequestAnswer {
  answerId?: number;
  requestId?: number;
  answerTitle?: string;
  answerBody?: string;
  cost?: number;
  status?: string;
  createdDt?: string;
  userNm?: string;
  companyNm?: string;
}

// 채팅 파트너 정보 (사장님이 채팅하는 상대 = 고객)
export interface BossChatPartner {
  customerId: number;
  customerName?: string;
  customerPhone?: string;
}

// 주문 (Flutter OrderListData)
export type OrderSortType = 'CREATED_DT' | 'ESTIMATE_DATE' | 'WORK_DATE' | 'TODAY';

export interface BossOrderListParams {
  name?: string;
  phone?: string;
  companyId?: string;
  estimateDateFrom?: string;
  estimateDateTo?: string;
  workDateFrom?: string;
  workDateTo?: string;
  sortType?: OrderSortType;
  statusCd?: string;
  updatedDt?: string;
  page?: number;
  size?: number;
}

export interface BossOrderItem {
  id?: number;
  name?: string;
  companyId?: number;
  phone?: string;
  email?: string;
  post?: string;
  address1?: string;
  address2?: string;
  workDate?: string;
  estimateDate?: string;
  memo?: string;
  statusCd?: string;
  delYn?: string;
  createdDt?: string;
  updatedDt?: string;
  createdUserId?: string;
  isExistChecklist?: string;
  imageCount?: number;
  totalAmount?: number;
}

export interface BossOrderListResponse {
  content: BossOrderItem[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  isLast?: boolean;
  size?: number;
}
