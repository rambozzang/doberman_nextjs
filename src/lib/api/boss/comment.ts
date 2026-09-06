// 사장님 커뮤니티 댓글 API
// Flutter `lib/repo/bbs/comment_repo.dart` 의 메서드들과 1:1 매칭.
import BossApiClient from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import type {
  BbsCommentListResponse,
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

  // 댓글 삭제 — 백엔드 /comment 에는 삭제가 없다(POST·DELETE 모두 "No static resource").
  // 댓글도 게시글과 같은 TB_BOARD_MASTER 행이라 글 삭제 엔드포인트를 쓴다.
  remove: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/bbs/delete/${encodeURIComponent(String(boardId))}`),

  // 댓글 목록 — Flutter CommentRepo.commentlist → GET /comment/list
  // 응답은 배열이 아니라 Spring Page 객체({content, totalElements ...}) 로 온다.
  list: (params: BbsSearchParams): Promise<ApiResponse<BbsCommentListResponse>> =>
    BossApiClient.getPrivate<BbsCommentListResponse>(
      `/comment/list${toQuery(params as Record<string, unknown>)}`
    ),
};
