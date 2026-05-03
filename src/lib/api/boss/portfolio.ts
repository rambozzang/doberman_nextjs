// 사장님 포트폴리오 API
// Flutter `lib/repo/portfolio_repo.dart` 와 1:1 대응
//   GET    /portfolios/{custId}
//   POST   /portfolios
//   PUT    /portfolios/{id}
//   DELETE /portfolios/{id}?custId={custId}
//   PUT    /portfolios/{id}/toggle-public?custId={custId}
import BossApiClient from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import type {
  BossPortfolioItem,
  BossPortfolioCreateRequest,
  BossPortfolioUpdateRequest,
} from '@/types/boss-portfolio';

export const bossPortfolioApi = {
  // 포트폴리오 목록 조회 (이미지/링크 포함)
  list: (custId: string) =>
    BossApiClient.getPrivate<BossPortfolioItem[]>(
      `/portfolios/${encodeURIComponent(custId)}`,
    ),

  // 포트폴리오 단건 조회 — 서버 별도 엔드포인트가 없으므로 list 결과에서 필터링
  // (Flutter 도 동일하게 PortfolioService 가 메모리 캐시에서 찾아 사용)
  detail: async (
    custId: string,
    id: string | number,
  ): Promise<ApiResponse<BossPortfolioItem>> => {
    const res = await bossPortfolioApi.list(custId);
    if (!res.success || !res.data) {
      return {
        success: res.success,
        message: res.message,
        error: res.error,
        data: undefined,
      };
    }
    const item = res.data.find((p) => String(p.id) === String(id));
    return {
      success: res.success,
      message: res.message,
      data: item,
    };
  },

  // 포트폴리오 생성
  create: (data: BossPortfolioCreateRequest) =>
    BossApiClient.postPrivate<BossPortfolioItem>('/portfolios', data),

  // 포트폴리오 수정
  update: (id: string | number, data: BossPortfolioUpdateRequest) =>
    BossApiClient.putPrivate<BossPortfolioItem>(
      `/portfolios/${encodeURIComponent(String(id))}`,
      data,
    ),

  // 포트폴리오 삭제
  remove: (id: string | number, custId: string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/portfolios/${encodeURIComponent(String(id))}?custId=${encodeURIComponent(custId)}`,
    ),

  // 공개/비공개 토글
  togglePublic: (id: string | number, custId: string) =>
    BossApiClient.putPrivate<{ isPublic?: boolean | 'Y' | 'N' }>(
      `/portfolios/${encodeURIComponent(String(id))}/toggle-public?custId=${encodeURIComponent(custId)}`,
    ),
};
