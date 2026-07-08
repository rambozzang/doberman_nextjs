// 사장님 커뮤니티(BBS) API
// Flutter `lib/repo/bbs/bbs_repo.dart` 의 모든 메서드를 1:1 포팅한다.
import BossApiClient from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import type {
  BbsData,
  BbsCreateRequest,
  BbsUpdateRequest,
  BbsSearchParams,
  BbsSingoRequest,
  BbsBlockData,
  BbsListResponse,
} from '@/types/boss-community';

// SearchData.toMap() 처럼 null/undefined 필드는 그대로 두고 query 로 직렬화
function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const bossCommunityApi = {
  // 게시글 작성 — Flutter BbsRepo.save → POST /bbs/create
  create: (data: BbsCreateRequest): Promise<ApiResponse<BbsData>> =>
    BossApiClient.postPrivate<BbsData>('/bbs/create', data),

  // 게시글 수정 — Flutter BbsRepo.update → POST /bbs/update
  update: (data: BbsUpdateRequest): Promise<ApiResponse<BbsData>> =>
    BossApiClient.postPrivate<BbsData>('/bbs/update', data),

  // 게시글 목록 — Flutter BbsRepo.list → GET /bbs/list
  list: (params: BbsSearchParams): Promise<ApiResponse<BbsListResponse | BbsData[]>> =>
    BossApiClient.getPrivate<BbsListResponse | BbsData[]>(`/bbs/list${toQuery(params as Record<string, unknown>)}`),

  // 게시글 상세 — Flutter BbsRepo.detail → GET /bbs/{boardId}
  detail: (boardId: number | string): Promise<ApiResponse<BbsData>> =>
    BossApiClient.getPrivate<BbsData>(`/bbs/${boardId}`),

  // 게시글 삭제 — Flutter BbsRepo.delete → DELETE /bbs/delete/{boardId}
  remove: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/bbs/delete/${boardId}`),

  // 첨부 이미지 삭제 — Flutter BbsRepo.deleteImage → DELETE /bbs/deleteFile/{id}
  deleteFile: (id: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/bbs/deleteFile/${id}`),

  // 신고 — Flutter BbsRepo.singo → POST /singo/save
  singo: (data: BbsSingoRequest): Promise<ApiResponse<unknown>> =>
    BossApiClient.postPrivate<unknown>('/singo/save', data),

  // 조회수 증가 — Flutter BbsRepo.viewCount → POST /bbs/viewCount/{boardId}
  viewCount: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.postPrivate<unknown>(`/bbs/viewCount/${boardId}`),

  // 좋아요 — Flutter BbsRepo.like → POST /bbs/like/{boardId}
  like: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.postPrivate<unknown>(`/bbs/like/${boardId}`),

  // 좋아요 취소 — Flutter BbsRepo.likeCancel → DELETE /bbs/like/{boardId}
  unlike: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/bbs/like/${boardId}`),

  // 구인구직 연락 요청(푸시) — POST /bbs/job/contact
  contactJob: (boardId: number | string, message?: string): Promise<ApiResponse<unknown>> =>
    BossApiClient.postPrivate<unknown>('/bbs/job/contact', { boardId, message }),

  // 차단한 사용자 목록 — Flutter BbsRepo.blockList → GET /bbs/blockedUsers
  blockedUsers: (): Promise<ApiResponse<BbsBlockData[]>> =>
    BossApiClient.getPrivate<BbsBlockData[]>('/bbs/blockedUsers'),

  // 차단 해제 — Flutter BbsRepo.blockCancel → DELETE /bbs/blockCancel/{custId}
  blockCancel: (custId: string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/bbs/blockCancel/${encodeURIComponent(custId)}`),
};
