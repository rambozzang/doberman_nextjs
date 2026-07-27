// 사장님 지도 광고 관리 API
// 노출용 /web/vendor 하위는 비로그인 공개이므로, 관리 API 는 /web/vendor-ad 하위(인증)를 쓴다.
import BossApiClient from '@/lib/bossApi';
import type { BossAd, BossAdCreateRequest, BossAdListResponse } from '@/types/boss-ad';

export const bossAdsApi = {
  // 내 업체 광고 목록
  myList: () => BossApiClient.postPrivate<BossAdListResponse>('/web/vendor-ad/my', {}),

  // 광고 등록
  create: (data: BossAdCreateRequest) =>
    BossApiClient.postPrivate<BossAd>('/web/vendor-ad/create', data),

  // 광고 게시 중지
  stop: (adId: number) => BossApiClient.postPrivate<boolean>(`/web/vendor-ad/${adId}/stop`, {}),
};
