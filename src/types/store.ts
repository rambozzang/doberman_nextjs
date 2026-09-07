// 도배 용품(쿠팡 파트너스) — 백엔드 app/store/StoreVo.kt 와 1:1

export type StoreCategoryCode = 'WALLPAPER' | 'GLUE' | 'BASE' | 'TOOL' | 'SELF' | 'ETC';

export interface StoreCategory {
  code: StoreCategoryCode | string;
  label: string;
  count: number;
}

export interface StoreProduct {
  id: number;
  categoryCode: string;
  categoryLabel: string;
  productId?: number | null;
  productName: string;
  productPrice?: number | null;
  productImage?: string | null;
  /** 파트너스 딥링크 — 이 링크로 들어가 사야 수수료가 잡힌다 */
  productUrl: string;
  originalUrl?: string | null;
  coupangCategory?: string | null;
  isRocket: boolean;
  isFreeShipping: boolean;
  keyword?: string | null;
  memo?: string | null;
  sortOrder: number;
  useYn: 'Y' | 'N' | string;
  clickCnt: number;
  createdDt?: string | null;
  updatedDt?: string | null;
}

export interface StoreCatalog {
  categories: StoreCategory[];
  products: StoreProduct[];
  updatedAt?: string | null;
}

export interface StoreAdminList {
  /** 서버에 쿠팡 API 키가 있는지 — 없으면 검색 · URL 담기가 막힌다 */
  configured: boolean;
  categories: StoreCategory[];
  products: StoreProduct[];
}

export interface StoreSearchItem {
  productId?: number | null;
  productName: string;
  productPrice?: number | null;
  productImage?: string | null;
  productUrl: string;
  categoryName?: string | null;
  isRocket: boolean;
  isFreeShipping: boolean;
  /** 이미 담은 상품 */
  registered: boolean;
}

export interface StoreAddFromSearchRequest {
  categoryCode: string;
  productId?: number | null;
  productName: string;
  productPrice?: number | null;
  productImage?: string | null;
  productUrl: string;
  coupangCategory?: string | null;
  isRocket: boolean;
  isFreeShipping: boolean;
  keyword?: string | null;
}

export interface StoreAddFromUrlRequest {
  categoryCode: string;
  coupangUrl: string;
  productName: string;
  productPrice?: number | null;
  productImage?: string | null;
}

export interface StoreUpdateRequest {
  categoryCode?: string;
  productName?: string;
  productPrice?: number | null;
  productImage?: string | null;
  memo?: string | null;
  useYn?: 'Y' | 'N';
  sortOrder?: number;
}

/** 분류 순서 — 백엔드 enum 과 같은 순서로 탭을 그린다 */
export const STORE_CATEGORY_ORDER: StoreCategoryCode[] = ['WALLPAPER', 'GLUE', 'BASE', 'TOOL', 'SELF', 'ETC'];

/** 쿠팡 파트너스 필수 고지 문구 — 상품이 보이는 화면마다 눈에 띄게 둔다 */
export const COUPANG_PARTNERS_NOTICE =
  '이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';
