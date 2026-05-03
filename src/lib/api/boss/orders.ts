// 사장님 주문 API
// Flutter OrderRepo.getOrders 에 대응 (POST /orders)
import BossApiClient from '@/lib/bossApi';
import type { BossOrderListParams, BossOrderListResponse } from '@/types/boss';

export const bossOrdersApi = {
  list: (params: BossOrderListParams) =>
    BossApiClient.postPrivate<BossOrderListResponse>('/orders', params),
};
