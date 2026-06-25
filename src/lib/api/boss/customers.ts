// 사장님 고객(주문) API
// Flutter `lib/repo/customer_repo.dart` 의 CustomerRepo 1:1 대응
import BossApiClient from '@/lib/bossApi';
import type { BossCustomerData } from '@/types/boss-customer';

export const bossCustomersApi = {
  // 고객 생성 — POST /customers
  create: (data: BossCustomerData) =>
    BossApiClient.postPrivate<BossCustomerData>('/customers', data),

  // 고객 수정 — PUT /customers
  update: (data: BossCustomerData) =>
    BossApiClient.putPrivate<BossCustomerData>('/customers', data),

  // 고객 상세 — GET /customers/{id}
  get: (id: number | string) =>
    BossApiClient.getPrivate<BossCustomerData>(`/customers/${id}`),

  // 고객 삭제 — DELETE /customers/{id}
  remove: (id: number | string) =>
    BossApiClient.deletePrivate<unknown>(`/customers/${id}`),

  // 고객 상태 변경 — PUT /customers/{customerId}/{statusCd}
  updateStatus: (customerId: number | string, statusCd: string) =>
    BossApiClient.putPrivate<unknown>(`/customers/${customerId}/${statusCd}`),

  // 공유 일정 조회 — GET /customers/{customerId}/share
  getShare: (customerId: number | string) =>
    BossApiClient.getPrivate<unknown>(`/customers/${customerId}/share`),
};
