// 도배 용품 관리 API — 백엔드 /store-admin (로그인 + 관리자만)
import BossApiClient from '@/lib/bossApi';
import type {
  StoreAdminList,
  StoreProduct,
  StoreSearchItem,
  StoreAddFromSearchRequest,
  StoreAddFromUrlRequest,
  StoreUpdateRequest,
} from '@/types/store';

export const bossStoreApi = {
  list: () => BossApiClient.getPrivate<StoreAdminList>('/store-admin/products'),

  search: (keyword: string, limit = 20) =>
    BossApiClient.postPrivate<StoreSearchItem[]>('/store-admin/search', { keyword, limit }),

  addFromSearch: (data: StoreAddFromSearchRequest) =>
    BossApiClient.postPrivate<StoreProduct>('/store-admin/products', data),

  addFromUrl: (data: StoreAddFromUrlRequest) =>
    BossApiClient.postPrivate<StoreProduct>('/store-admin/products/from-url', data),

  update: (id: number, data: StoreUpdateRequest) =>
    BossApiClient.putPrivate<StoreProduct>(`/store-admin/products/${id}`, data),

  reorder: (ids: number[]) => BossApiClient.putPrivate<boolean>('/store-admin/products/reorder', { ids }),

  remove: (id: number) => BossApiClient.deletePrivate<boolean>(`/store-admin/products/${id}`),
};
