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
  BossMyRequestAnswer,
  BossUnifiedRequestItem,
  BossUnifiedRequestParams,
  BossUnifiedRequestSummary,
} from '@/types/boss';

export const bossRequestsApi = {
  // 전체 견적 요청 목록 (페이징)
  list: (params: BossRequestListParams) =>
    BossApiClient.postPrivate<BossRequestListResponse>('/web/customer-request/all-list', params),

  // 통합 목록 — 요청에 내 답변 상태를 얹어 준다. 화면 하나로 합치면서 이걸 쓴다.
  unified: (params: BossUnifiedRequestParams) =>
    BossApiClient.postPrivate<BossRequestListResponse & { content?: BossUnifiedRequestItem[] }>(
      '/webapp/unified-list',
      params,
    ),

  // 통합 목록 탭 건수 (목록 페이징과 무관하게 전체 기준)
  unifiedSummary: (params: Pick<BossUnifiedRequestParams, 'myRegionOnly'>) =>
    BossApiClient.postPrivate<BossUnifiedRequestSummary>('/webapp/unified-summary', params),

  // 내가 답변한 견적 요청 목록 (앱 호환 — 통합 목록으로 대체 중)
  myList: (params: BossRequestListParams) =>
    BossApiClient.postPrivate<BossRequestListResponse>('/webapp/myrequsetlist', params),

  // 견적 요청 상세
  detail: (id: number) =>
    BossApiClient.postPrivate<BossRequestDetail>(`/web/customer-request/detail/${id}`),

  // 이 요청에 내가 단 답변 한 건 (앱 web_repo.requestAnswer 와 같은 엔드포인트)
  // 답변이 없으면 백엔드가 실패 응답을 주므로 호출부에서 success 를 본다.
  myAnswer: (requestId: number) =>
    BossApiClient.postPrivate<BossMyRequestAnswer>(`/customers/getWebRequestAnswerById/${requestId}`),

  // 견적 답변 제출
  submit: (data: BossAnswerSubmitRequest): Promise<ApiResponse<BossAnswerSubmitResponse>> =>
    BossApiClient.postPrivate<BossAnswerSubmitResponse>('/customers/webRequestAnswer', data),
};
