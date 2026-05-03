// 사장님 견적서 품목 API
// Flutter `lib/repo/estimate_repo.dart` (EstimateRepo) 1:1 대응
// 인증이 필요한 엔드포인트이므로 BossApiClient 의 *Private 메서드를 사용한다.
import BossApiClient from '@/lib/bossApi';
import type {
  BossEstimateItem,
  BossEstimateItemCreateRequest,
  BossEstimateItemUpdateRequest,
} from '@/types/boss-estimate';

export const bossEstimateApi = {
  // 특정 고객(customerId) 의 품목 리스트 조회
  // GET /estimateitems/{customerId}
  list: (customerId: string | number) =>
    BossApiClient.getPrivate<BossEstimateItem[]>(`/estimateitems/${customerId}`),

  // 품목 상세 조회
  // GET /estimateitems/detail/{id}
  detail: (id: string | number) =>
    BossApiClient.getPrivate<BossEstimateItem>(`/estimateitems/detail/${id}`),

  // 품목 등록
  // POST /estimateitems
  create: (data: BossEstimateItemCreateRequest) =>
    BossApiClient.postPrivate<BossEstimateItem>('/estimateitems', data),

  // 품목 수정
  // PUT /estimateitems/{id}
  update: (data: BossEstimateItemUpdateRequest) =>
    BossApiClient.putPrivate<BossEstimateItem>(`/estimateitems/${data.id}`, data),

  // 품목 삭제
  // DELETE /estimateitems/{id}
  remove: (id: string | number) =>
    BossApiClient.deletePrivate<unknown>(`/estimateitems/${id}`),
};
