// 사장님 영수증 지출관리 타입
// Flutter receipt_data.dart, receipt_category.dart 1:1 대응
// 백엔드: /receipt/*

export type ReceiptCategoryCode =
  | 'MATERIAL'
  | 'LABOR'
  | 'FUEL'
  | 'MEAL'
  | 'VEHICLE'
  | 'UTILITY'
  | 'RENT'
  | 'ETC';

export type ReceiptPaymentMethod = 'CARD' | 'CASH' | string;

export const RECEIPT_CATEGORIES: { code: ReceiptCategoryCode; label: string }[] = [
  { code: 'MATERIAL', label: '자재비' },
  { code: 'LABOR', label: '인건비' },
  { code: 'FUEL', label: '유류비' },
  { code: 'MEAL', label: '식대' },
  { code: 'VEHICLE', label: '차량/장비' },
  { code: 'UTILITY', label: '공과금' },
  { code: 'RENT', label: '임대료' },
  { code: 'ETC', label: '기타' },
];

export function categoryLabel(code?: string | null): string {
  return (
    RECEIPT_CATEGORIES.find((c) => c.code === code)?.label ?? '기타'
  );
}

export function paymentLabel(method?: string | null): string {
  switch (method) {
    case 'CARD':
      return '카드';
    case 'CASH':
      return '현금';
    default:
      return method ?? '-';
  }
}

// 영수증 품목
export interface ReceiptItem {
  name?: string;
  qty?: number;
  unitPrice?: number;
  amount?: number;
}

// 영수증 단건
export interface ReceiptData {
  id?: number;
  vendorName?: string;
  bizNo?: string;
  txDate?: string;
  totalAmount: number;
  taxAmount?: number;
  paymentMethod?: string;
  category: string;
  categoryLabel?: string;
  imageUrl?: string;
  memo?: string;
  aiRaw?: string;
  items: ReceiptItem[];
}

// 카테고리별 집계
export interface CategorySum {
  category: string;
  label: string;
  amount: number;
  count: number;
}

// 월별 요약 응답
export interface MonthlySummary {
  ym: string;
  totalAmount: number;
  byCategory: CategorySum[];
  receipts: ReceiptData[];
}

// 저장 요청 바디
export interface ReceiptSaveRequest {
  id?: number;
  vendorName?: string;
  bizNo?: string;
  txDate?: string;
  totalAmount: number;
  taxAmount?: number;
  paymentMethod?: string;
  category: string;
  imageUrl?: string;
  memo?: string;
  aiRaw?: string;
  items: ReceiptItem[];
}
