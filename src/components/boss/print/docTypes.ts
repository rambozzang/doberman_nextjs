// 견적서 · 영수증 문서 양식 — 앱 lib/app/estimate/pdf 와 1:1
//
// 앱은 견적서 5종(기본 · 슬레이트 · 차콜 · 토프 · 세이지),
// 영수증 5종(기본 · 심플 · 클래식 · 카드 · 컬러)을 제공하고,
// 고른 양식을 기억했다가 다음에도 그대로 쓴다.
// 웹도 같은 이름 · 같은 색 · 같은 구성으로 맞춘다.

import type { BossEstimateItem } from '@/types/boss-estimate';
import type { BossCompanyData, BossUserInfo } from '@/types/boss';
import type { BossCustomerData } from '@/types/boss-customer';
import type { DocMeta } from '@/lib/boss/docMeta';

/** 문서 한 장을 그리는 데 필요한 모든 값 (앱 PrintData 와 같은 묶음) */
export type DocData = {
  company: BossCompanyData | null;
  customer: BossCustomerData | null;
  user: BossUserInfo | null;
  items: BossEstimateItem[];
  totals: { totalItems: number; totalQuantity: number; supplyAmount: number; vatAmount: number; totalAmount: number };
  meta: DocMeta;
  /** 비과세 품목이 하나라도 있는지 — 금액 문구가 달라진다 */
  hasTaxFree: boolean;
  /** 합계의 한글 표기 (앱 numberToKorean 규칙) */
  totalAmountKor: string;
};

/** 앱 style 파일들이 쓰는 6색 팔레트 */
export type DocPalette = {
  primary: string;
  secondary: string;
  accent: string;
  textDark: string;
  textLight: string;
  border: string;
};

export type DocStyleOption = {
  key: string;
  /** 양식 이름 — 앱 바텀시트에 뜨는 그 이름 */
  name: string;
  /** 양식 카드에 쓰는 대표색 */
  color: string;
  palette: DocPalette;
};

// ── 견적서 5종 (앱 kEstimateStyles) ─────────────────────────
export const ESTIMATE_STYLES: DocStyleOption[] = [
  {
    key: '0',
    name: '기본',
    color: '#6B21A8',
    palette: {
      primary: '#6B21A8', // purple700 — 표 머리
      secondary: '#4B5563',
      accent: '#DCFCE7', // green100 — 일금 강조
      textDark: '#111111',
      textLight: '#666666',
      border: '#9E9E9E',
    },
  },
  {
    key: '1',
    name: '슬레이트',
    color: '#4A5568',
    palette: {
      primary: '#4A5568',
      secondary: '#5A6A7A',
      accent: '#F5F7FA',
      textDark: '#2D3748',
      textLight: '#718096',
      border: '#E2E8F0',
    },
  },
  {
    key: '2',
    name: '차콜',
    color: '#3D4852',
    palette: {
      primary: '#3D4852',
      secondary: '#606F7B',
      accent: '#FAFBFC',
      textDark: '#22292F',
      textLight: '#8795A1',
      border: '#DAE1E7',
    },
  },
  {
    key: '3',
    name: '토프',
    color: '#6B5B4F',
    palette: {
      primary: '#6B5B4F',
      secondary: '#8C7B6B',
      accent: '#F8F6F3',
      textDark: '#3E3631',
      textLight: '#7A6E64',
      border: '#E8E2DC',
    },
  },
  {
    key: '4',
    name: '세이지',
    color: '#5F7161',
    palette: {
      primary: '#5F7161',
      secondary: '#7D8F7D',
      accent: '#F5F7F5',
      textDark: '#2F3E2F',
      textLight: '#6B7B6B',
      border: '#DDE5DD',
    },
  },
];

// ── 영수증 5종 (앱 kReceiptStyles) ─────────────────────────
export const RECEIPT_STYLES: DocStyleOption[] = [
  {
    key: '0',
    name: '기본',
    color: '#5B21B6',
    palette: {
      primary: '#5B21B6',
      secondary: '#6D28D9',
      accent: '#F5F3FF',
      textDark: '#1F2937',
      textLight: '#6B7280',
      border: '#111111',
    },
  },
  {
    key: '1',
    name: '심플',
    color: '#2D3748',
    palette: {
      primary: '#2D3748',
      secondary: '#4A5568',
      accent: '#F7FAFC',
      textDark: '#1A202C',
      textLight: '#718096',
      border: '#E2E8F0',
    },
  },
  {
    key: '2',
    name: '클래식',
    color: '#5D4E37',
    palette: {
      primary: '#5D4E37',
      secondary: '#8B7355',
      accent: '#FAF8F5',
      textDark: '#3D3225',
      textLight: '#7A6E5D',
      border: '#D4C4B0',
    },
  },
  {
    key: '3',
    name: '카드',
    color: '#4A6FA5',
    palette: {
      primary: '#4A6FA5',
      secondary: '#6B8CBC',
      accent: '#F0F4F8',
      textDark: '#2C3E50',
      textLight: '#7F8C9A',
      border: '#D0DCE8',
    },
  },
  {
    key: '4',
    name: '컬러',
    color: '#5F7161',
    palette: {
      primary: '#5F7161',
      secondary: '#7D8F7D',
      accent: '#E8EDE8',
      textDark: '#2F3E2F',
      textLight: '#6B7B6B',
      border: '#DDE5DD',
    },
  },
];

/** 금액 콤마 표기 */
export function money(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '0';
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '')) : v;
  if (!Number.isFinite(n)) return '0';
  return Math.round(n as number).toLocaleString('ko-KR');
}

/** 앱과 같은 금액 문구 — 비과세 품목이 섞이면 "VAT 별도" */
export function taxText(hasTaxFree: boolean): string {
  return hasTaxFree ? '견적금액 (VAT 별도)' : '견적금액 (VAT 포함)';
}

/** 회사 주소 한 줄 */
export function companyAddress(c: BossCompanyData | null): string {
  return [c?.address1, c?.address2].filter(Boolean).join(' ');
}

/** 고객 주소 한 줄 */
export function customerAddress(c: BossCustomerData | null): string {
  return [c?.address1, c?.address2].filter(Boolean).join(' ');
}
