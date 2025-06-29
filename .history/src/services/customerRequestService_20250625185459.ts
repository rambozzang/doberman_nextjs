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
  CreateCustomerRequestResponse
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

  // 견적 요청 답변 리스트 조회
  static async getAnswerList(requestId: number): Promise<ApiResponse<CustomerRequestAnswer[]>> {
    return await ApiClient.postPrivate<CustomerRequestAnswer[]>(`/customer-request/webRequestAnswerList?requestId=${requestId}`, {});
  }

  // 견적 요청 생성
  static async createCustomerRequest(
    requestData: CreateCustomerRequestRequest
  ): Promise<ApiResponse<CreateCustomerRequestResponse>> {
    return ApiClient.postPrivate<CreateCustomerRequestResponse>('/customer-request', requestData);
  }
} 