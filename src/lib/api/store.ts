// 도배 용품(쿠팡 파트너스) — 소비자 사이트용. 로그인 없이 부른다.
// 소비자 API 의 기본 주소가 …/api-doman/web 이라 백엔드 /web/store/… 는 여기서 /store/… 로 쓴다.
import ApiClient from '@/lib/api';
import type { StoreCatalog } from '@/types/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.tigerbk.com/api-doman/web';

export const storeApi = {
  /** 브라우저에서 — 분류 · 상품 한 번에 */
  catalog: () => ApiClient.get<StoreCatalog>('/store/catalog'),

  /** "쿠팡에서 보기" 클릭 집계 — 실패해도 링크 이동은 막지 않는다 */
  click: (id: number) => ApiClient.post<boolean>(`/store/click/${id}`),
};

/** 서버 컴포넌트에서 — 10분 캐시. 실패하면 빈 목록(페이지는 뜬다) */
export async function fetchStoreCatalog(): Promise<StoreCatalog> {
  const empty: StoreCatalog = { categories: [], products: [], updatedAt: null };
  try {
    const res = await fetch(`${API_BASE_URL}/store/catalog`, { next: { revalidate: 600 } });
    if (!res.ok) return empty;
    const json = (await res.json()) as { success?: boolean; data?: StoreCatalog };
    return json.success !== false && json.data ? json.data : empty;
  } catch {
    return empty;
  }
}
