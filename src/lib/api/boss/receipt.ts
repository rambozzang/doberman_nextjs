// 사장님 영수증 API
// Flutter ReceiptRepo 1:1 대응
// 백엔드: /receipt/*
import BossApiClient from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import type { MonthlySummary, ReceiptData, ReceiptSaveRequest } from '@/types/boss-receipt';

export const bossReceiptApi = {
  // 월별 영수증 요약 + 목록 — GET /receipt/monthly?ym=202607
  monthly: (ym: string): Promise<ApiResponse<MonthlySummary>> =>
    BossApiClient.getPrivate<MonthlySummary>(`/receipt/monthly?ym=${ym}`),

  // 영수증 상세 — GET /receipt/{id}
  detail: (id: number | string): Promise<ApiResponse<ReceiptData>> =>
    BossApiClient.getPrivate<ReceiptData>(`/receipt/${id}`),

  // 영수증 저장/수정 — POST /receipt
  save: (data: ReceiptSaveRequest): Promise<ApiResponse<ReceiptData>> =>
    BossApiClient.postPrivate<ReceiptData>('/receipt', data),

  // 영수증 삭제 — DELETE /receipt/{id}
  remove: (id: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/receipt/${id}`),
};
