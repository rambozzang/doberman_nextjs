// 사장님 견적 요청 API
// Flutter web_repo.dart 의 requestAllList_b / requestGet / requestAnswer / submitAnswer 에 대응
import BossApiClient from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import type {
  BossRequestListItem,
  BossRequestDetail,
  BossRequestListParams,
  BossRequestListResponse,
  BossAnswerSubmitRequest,
  BossAnswerSubmitResponse,
} from '@/types/boss';

export const bossRequestsApi = {
  // 전체 견적 요청 목록 (페이징)
  list: (params: BossRequestListParams) =>
    BossApiClient.postPrivate<BossRequestListResponse>('/web/customer-request/all-list', params),

  // 내가 답변한 견적 요청 목록
  myList: (params: BossRequestListParams) =>
    BossApiClient.postPrivate<BossRequestListResponse>('/webapp/myrequsetlist', params),

  // 견적 요청 상세
  detail: (id: number) =>
    BossApiClient.postPrivate<BossRequestDetail>(`/web/customer-request/detail/${id}`),

  // 내가 단 답변 목록
  myAnswers: (id: number) =>
    BossApiClient.postPrivate<BossRequestListItem[]>(`/web/customer-request/answer-list/${id}`),

  // 견적 답변 제출
  submit: (data: BossAnswerSubmitRequest): Promise<ApiResponse<BossAnswerSubmitResponse>> =>
    BossApiClient.postPrivate<BossAnswerSubmitResponse>('/customers/webRequestAnswer', data),
};
