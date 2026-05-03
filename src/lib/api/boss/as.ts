// 사장님 AS 요청 API
// Flutter `lib/repo/as_request_repo.dart` 의 엔드포인트와 1:1 매칭
import BossApiClient from '@/lib/bossApi';
import type {
  AsRequestItem,
  AsRequestCreatePayload,
  AsRequestUpdatePayload,
} from '@/types/boss-as';

export const bossAsApi = {
  // AS 요청 목록 조회 (상태 필터 옵션)
  // Flutter: AsRequestRepo.getAsRequests → GET /as-requests/{custId}?status=...
  list: (custId: string, status?: string) => {
    const qs = status && status.length > 0 ? `?status=${encodeURIComponent(status)}` : '';
    return BossApiClient.getPrivate<AsRequestItem[]>(
      `/as-requests/${encodeURIComponent(custId)}${qs}`,
    );
  },

  // AS 요청 상세 (이미지 포함)
  // Flutter: AsRequestRepo.getAsRequestDetail → GET /as-requests/{id}/detail
  detail: (id: string) =>
    BossApiClient.getPrivate<AsRequestItem>(`/as-requests/${encodeURIComponent(id)}/detail`),

  // AS 요청 생성
  // Flutter: AsRequestRepo.createAsRequest → POST /as-requests
  create: (payload: AsRequestCreatePayload) =>
    BossApiClient.postPrivate<AsRequestItem>('/as-requests', payload),

  // AS 요청 수정
  // Flutter: AsRequestRepo.updateAsRequest → PUT /as-requests/{id}
  update: (id: string, payload: AsRequestUpdatePayload) =>
    BossApiClient.putPrivate<AsRequestItem>(
      `/as-requests/${encodeURIComponent(id)}`,
      payload,
    ),

  // AS 요청 상태 변경
  // Flutter: AsRequestRepo.changeStatus → PUT /as-requests/{id}/status?custId=...&status=...
  changeStatus: (id: string, custId: string, status: string) =>
    BossApiClient.putPrivate<AsRequestItem>(
      `/as-requests/${encodeURIComponent(id)}/status?custId=${encodeURIComponent(custId)}&status=${encodeURIComponent(status)}`,
    ),

  // AS 요청 삭제 (소프트 삭제)
  // Flutter: AsRequestRepo.deleteAsRequest → DELETE /as-requests/{id}?custId=...
  remove: (id: string, custId: string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/as-requests/${encodeURIComponent(id)}?custId=${encodeURIComponent(custId)}`,
    ),
};

// 로그인한 사용자의 custId 추출 헬퍼
// Flutter는 AuthDio가 토큰의 sub(userId) 를 그대로 custId 로 사용
export function getBossCustId(): string {
  if (typeof window === 'undefined') return '';
  // BossAuthManager 동적 로드 (서버 렌더 회피)
  try {
    const raw = localStorage.getItem('boss_user_info');
    if (raw) {
      const parsed = JSON.parse(raw) as { userId?: string; id?: number };
      if (parsed.userId) return parsed.userId;
      if (parsed.id != null) return String(parsed.id);
    }
  } catch {
    // ignore
  }
  return '';
}
