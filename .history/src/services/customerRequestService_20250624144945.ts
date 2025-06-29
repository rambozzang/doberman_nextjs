import ApiClient from '@/lib/api';
import { 
  ApiResponse, 
  CustomerRequestListRequest, 
  CustomerRequestListResponse,
  MyCustomerRequestListRequest,
  CustomerRequest,
  CustomerRequestAnswer
} from '@/types/api';

export class CustomerRequestService {
  // 전체 견적 요청 리스트 조회
  static async getAllList(params: CustomerRequestListRequest): Promise<ApiResponse<CustomerRequestListResponse>> {
    return await ApiClient.post<CustomerRequestListResponse>('/customer-request/all-list', params);
  }

  // 특정 견적 요청 상세 조회
  static async getDetail(id: number): Promise<ApiResponse<CustomerRequest>> {
    return await ApiClient.postPrivate<CustomerRequest>(`/customer-request/detail/${id}`);
  }

  // 내 견적 요청 리스트 조회
  static async getMyList(params: MyCustomerRequestListRequest): Promise<ApiResponse<CustomerRequestListResponse>> {
    return await ApiClient.postPrivate<CustomerRequestListResponse>('/customer-request/list', params);
  }
} 