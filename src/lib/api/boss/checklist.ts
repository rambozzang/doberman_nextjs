// 사장님 체크리스트 API
// Flutter `lib/repo/checklist_repo.dart` 와 1:1 매칭
// - GET    /checklist/{customerId}  : 체크리스트 조회
// - POST   /checklist                : 체크리스트 저장
// - DELETE /checklist/{customerId}  : 체크리스트 삭제
import BossApiClient from '@/lib/bossApi';
import type { CheckData } from '@/types/boss-checklist';

export const bossChecklistApi = {
  // 고객 ID로 체크리스트 조회
  // Flutter: ChecklistRepo.getCheckList → GET /checklist/{customerId}
  get: (customerId: string) =>
    BossApiClient.getPrivate<CheckData>(
      `/checklist/${encodeURIComponent(customerId)}`,
    ),

  // 체크리스트 저장(생성/수정)
  // Flutter: ChecklistRepo.saveCheckData → POST /checklist
  save: (data: CheckData) =>
    BossApiClient.postPrivate<CheckData>('/checklist', data),

  // 체크리스트 삭제
  // Flutter: ChecklistRepo.deleteCheckData → DELETE /checklist/{customerId}
  remove: (customerId: string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/checklist/${encodeURIComponent(customerId)}`,
    ),
};
