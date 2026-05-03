// 사장님 커뮤니티 댓글 API
// Flutter `lib/repo/bbs/comment_repo.dart` 의 메서드들과 1:1 매칭.
import BossApiClient from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import type {
  BbsData,
  BbsUpdateRequest,
  BbsSearchParams,
  CommentCreateRequest,
} from '@/types/boss-community';

function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const bossCommentApi = {
  // 댓글 작성 — Flutter CommentRepo.saveComment → POST /comment/create
  create: (data: CommentCreateRequest): Promise<ApiResponse<BbsData>> =>
    BossApiClient.postPrivate<BbsData>('/comment/create', data),

  // 댓글 수정 — Flutter CommentRepo.update → POST /comment/update
  update: (data: BbsUpdateRequest): Promise<ApiResponse<BbsData>> =>
    BossApiClient.postPrivate<BbsData>('/comment/update', data),

  // 댓글 삭제 — Flutter CommentRepo.deleteComment → POST /comment/delete?boardId=
  // (Flutter 원본은 POST 이지만 요구사항에 따라 DELETE 도 호환되도록 DELETE 로 전송)
  remove: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/comment/delete?boardId=${encodeURIComponent(String(boardId))}`),

  // 댓글 목록 — Flutter CommentRepo.commentlist → GET /comment/list
  list: (params: BbsSearchParams): Promise<ApiResponse<BbsData[]>> =>
    BossApiClient.getPrivate<BbsData[]>(`/comment/list${toQuery(params as Record<string, unknown>)}`),
};
