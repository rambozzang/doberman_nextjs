// 세금계산서 · 현금영수증 발행 관리 타입
// 백엔드: /taxinvoices/* (app/taxinvoice/TaxInvoiceVo.kt 와 1:1)

export type TaxInvoiceDocType = 'TAX' | 'CASH';
export type TaxInvoiceStatus = 'REQUESTED' | 'ISSUED' | 'CANCELED';
export type TaxInvoicePayType = 'RECEIPT' | 'CLAIM';

export const DOC_TYPE_LABEL: Record<TaxInvoiceDocType, string> = {
  TAX: '세금계산서',
  CASH: '현금영수증',
};

export const STATUS_LABEL: Record<TaxInvoiceStatus, string> = {
  REQUESTED: '발행 요청',
  ISSUED: '발행 완료',
  CANCELED: '취소',
};

export const PAY_TYPE_LABEL: Record<TaxInvoicePayType, string> = {
  RECEIPT: '영수',
  CLAIM: '청구',
};

// 서식 품목 행
export interface TaxInvoiceItem {
  name?: string | null;
  spec?: string | null;
  qty?: number | null;
  unitPrice?: number | null;
  supplyAmount?: number | null;
  vatAmount?: number | null;
  /** yyyy-MM-dd — 서식의 월/일 칸 */
  date?: string | null;
}

export interface TaxInvoice {
  id?: number;
  customerId?: number | null;
  estimateId?: number | null;
  docType: TaxInvoiceDocType;
  status: TaxInvoiceStatus;
  payType: TaxInvoicePayType;
  issueDate?: string | null;
  buyerName?: string | null;
  buyerBizNo?: string | null;
  buyerCeo?: string | null;
  buyerAddress?: string | null;
  buyerBizType?: string | null;
  buyerBizKind?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  itemSummary?: string | null;
  items: TaxInvoiceItem[];
  approvalNo?: string | null;
  issuedAt?: string | null;
  memo?: string | null;
  createdDt?: string | null;
  updatedDt?: string | null;
}

export interface TaxInvoiceSaveRequest {
  id?: number;
  customerId?: number | null;
  estimateId?: number | null;
  docType: TaxInvoiceDocType;
  payType: TaxInvoicePayType;
  issueDate?: string | null;
  buyerName?: string | null;
  buyerBizNo?: string | null;
  buyerCeo?: string | null;
  buyerAddress?: string | null;
  buyerBizType?: string | null;
  buyerBizKind?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  itemSummary?: string | null;
  items: TaxInvoiceItem[];
  memo?: string | null;
}

export interface TaxInvoiceStatusRequest {
  status: TaxInvoiceStatus;
  approvalNo?: string | null;
  issueDate?: string | null;
}

export interface TaxInvoicePeriodSummary {
  year: number;
  /** 1~4, 0 이면 연간 */
  quarter: number;
  from: string;
  to: string;
  issuedCount: number;
  requestedCount: number;
  issuedSupplyAmount: number;
  issuedVatAmount: number;
  requestedSupplyAmount: number;
  requestedVatAmount: number;
  invoices: TaxInvoice[];
}

export interface VatSummary {
  year: number;
  quarter: number;
  from: string;
  to: string;
  salesSupplyAmount: number;
  salesVatAmount: number;
  salesCount: number;
  purchaseTotalAmount: number;
  purchaseVatAmount: number;
  purchaseCount: number;
  purchaseWithVatCount: number;
  estimatedVatAmount: number;
  filingDeadline: string;
  filingLabel: string;
}

export interface TaxInvoiceBuyerPrefill {
  buyerName?: string | null;
  buyerBizNo?: string | null;
  buyerCeo?: string | null;
  buyerAddress?: string | null;
  buyerBizType?: string | null;
  buyerBizKind?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
}
