// 사장님 견적서(estimate) API
// 백엔드 엔드포인트: /estimates/*
import BossApiClient from '@/lib/bossApi';
import type { BossEstimate } from '@/types/boss-estimate';

export const bossEstimatesApi = {
  // 고객별 견적서 조회
  listByCustomer: (customerId: string | number) =>
    BossApiClient.getPrivate<BossEstimate[]>(`/estimates/customer/${customerId}`),
};
