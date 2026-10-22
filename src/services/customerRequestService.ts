import ApiClient from '@/lib/api';
import { 
  ApiResponse, 
  CustomerRequestListRequest, 
  CustomerRequestListResponse,
  CustomerRequestSearchRequest,
  MyCustomerRequestListRequest,
  CustomerRequest,
  CustomerRequestAnswer,
  CreateCustomerRequestRequest,
  CreateCustomerRequestResponse,
  CustomerRequestStatisticsResponse,
  ContactSendRequest,
  ContactSendResponse,
  AdoptAnswerResponse,
  NearbyCompany
} from '@/types/api';

export class CustomerRequestService {
  // 전체 견적 요청 리스트 조회
  static async getAllList(params: CustomerRequestListRequest): Promise<ApiResponse<CustomerRequestListResponse>> {
    return await ApiClient.post<CustomerRequestListResponse>('/customer-request/all-list', params);
  }

  // 견적 요청 검색 (새로운 검색 API)
  static async searchRequests(params: CustomerRequestSearchRequest): Promise<ApiResponse<CustomerRequestListResponse>> {
    return await ApiClient.post<CustomerRequestListResponse>('/customer-request/search', params);
  }

  // 특정 견적 요청 상세 조회
  static async getDetail(id: number): Promise<ApiResponse<CustomerRequest>> {
    return await ApiClient.postPrivate<CustomerRequest>(`/customer-request/detail/${id}`);
  }

  // 내 견적 요청 리스트 조회
  static async getMyList(params: MyCustomerRequestListRequest): Promise<ApiResponse<CustomerRequestListResponse>> {
    return await ApiClient.postPrivate<CustomerRequestListResponse>('/customer-request/list', params);
  }

  // 견적 요청 답변 리스트 조회 (새로운 API)
  static async getAnswerList(requestId: number): Promise<ApiResponse<CustomerRequestAnswer[]>> {
    return await ApiClient.postPrivate<CustomerRequestAnswer[]>(`/customer-request/answer-details/${requestId}`, {});
  }

  // 견적 요청 생성 (로그인 사용자)
  static async createCustomerRequest(
    requestData: CreateCustomerRequestRequest
  ): Promise<ApiResponse<CreateCustomerRequestResponse>> {
    return ApiClient.postPrivate<CreateCustomerRequestResponse>('/customer-request', requestData);
  }

  // 견적 요청 생성 (비로그인 사용자)
  static async createCustomerRequestNonLogin(
    requestData: CreateCustomerRequestRequest
  ): Promise<ApiResponse<CreateCustomerRequestResponse>> {
    return ApiClient.post<CreateCustomerRequestResponse>('/customer-request/non-login', requestData);
  }

  // 내 요청에 소개된 근처 사장님 (요청한 고객 본인만)
  static async getNearbyCompanies(requestId: number): Promise<ApiResponse<NearbyCompany[]>> {
    return ApiClient.postPrivate<NearbyCompany[]>(`/customer-request/${requestId}/contacts`, {});
  }

  // 소개된 사장님 전화 버튼 누름 기록 — 로그인 없이 요청한 고객도 누르므로 공개 주소
  static async recordContactCall(requestId: number, companyId: number): Promise<ApiResponse<boolean>> {
    return ApiClient.post<boolean>(`/customer-request/${requestId}/contact-call/${companyId}`, {});
  }

  // 견적 요청 통계 조회
  static async getStatistics(): Promise<ApiResponse<CustomerRequestStatisticsResponse>> {
    return await ApiClient.post<CustomerRequestStatisticsResponse>('/customer-request/statistics', {});
  }

  // 문의하기 API
  static async sendContactInquiry(
    request: ContactSendRequest
  ): Promise<ApiResponse<ContactSendResponse>> {
    return await ApiClient.post<ContactSendResponse>('/contact/send', request);
  }

  // 답변 채택 API
  static async adoptAnswer(requestId: number, answerId: number): Promise<ApiResponse<AdoptAnswerResponse>> {
    return await ApiClient.postPrivate<AdoptAnswerResponse>(`/customer-request/selectWebRequestAnswer/${requestId}/${answerId}`, {});
  }
} 