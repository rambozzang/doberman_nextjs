import ApiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { VendorCluster, VendorDetail, VendorMapRequest, VendorMapResponse } from '@/types/vendor';

export class VendorService {
  // 지도 영역 내 업체 조회 (비로그인 공개)
  static async getInBounds(params: VendorMapRequest): Promise<ApiResponse<VendorMapResponse>> {
    return await ApiClient.post<VendorMapResponse>('/vendor/map', params);
  }

  // 시군구 단위 업체 수 집계 (지도 축소 상태용)
  static async getClusters(): Promise<ApiResponse<VendorCluster[]>> {
    return await ApiClient.get<VendorCluster[]>('/vendor/clusters');
  }

  // 업체 상세 (좌측 패널)
  static async getDetail(vendorId: number): Promise<ApiResponse<VendorDetail>> {
    return await ApiClient.get<VendorDetail>(`/vendor/${vendorId}`);
  }
}
