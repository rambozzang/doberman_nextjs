// 사장님 세금계산서 · 현금영수증 API — 백엔드 /taxinvoices/*
import BossApiClient from '@/lib/bossApi';
import type {
  TaxInvoice,
  TaxInvoiceBuyerPrefill,
  TaxInvoicePeriodSummary,
  TaxInvoiceSaveRequest,
  TaxInvoiceStatus,
  TaxInvoiceStatusRequest,
  VatSummary,
} from '@/types/boss-taxinvoice';

export const bossTaxInvoiceApi = {
  // 기간 목록 + 집계 — GET /taxinvoices?year=&quarter= (quarter 0 = 연간)
  period: (year: number, quarter: number) =>
    BossApiClient.getPrivate<TaxInvoicePeriodSummary>('/taxinvoices', {
      params: { year, quarter },
    }),

  // 상태별 목록 — GET /taxinvoices/status/{status}
  byStatus: (status: TaxInvoiceStatus) =>
    BossApiClient.getPrivate<TaxInvoice[]>(`/taxinvoices/status/${status}`),

  // 부가세 예상 — GET /taxinvoices/vat-summary?year=&quarter=
  vatSummary: (year: number, quarter: number) =>
    BossApiClient.getPrivate<VatSummary>('/taxinvoices/vat-summary', {
      params: { year, quarter },
    }),

  // 고객별 이력 — GET /taxinvoices/customer/{customerId}
  byCustomer: (customerId: number | string) =>
    BossApiClient.getPrivate<TaxInvoice[]>(`/taxinvoices/customer/${customerId}`),

  // 고객 사업자 정보 프리필 — GET /taxinvoices/customer/{customerId}/prefill
  prefill: (customerId: number | string) =>
    BossApiClient.getPrivate<TaxInvoiceBuyerPrefill | null>(
      `/taxinvoices/customer/${customerId}/prefill`,
    ),

  // 상세 — GET /taxinvoices/{id}
  get: (id: number | string) => BossApiClient.getPrivate<TaxInvoice>(`/taxinvoices/${id}`),

  // 저장 (id 있으면 수정) — POST /taxinvoices
  save: (data: TaxInvoiceSaveRequest) =>
    BossApiClient.postPrivate<{ id: number }>('/taxinvoices', data),

  // 상태 변경 — PUT /taxinvoices/{id}/status
  changeStatus: (id: number | string, data: TaxInvoiceStatusRequest) =>
    BossApiClient.putPrivate<TaxInvoice>(`/taxinvoices/${id}/status`, data),

  // 삭제 — DELETE /taxinvoices/{id}
  remove: (id: number | string) => BossApiClient.deletePrivate<unknown>(`/taxinvoices/${id}`),
};
