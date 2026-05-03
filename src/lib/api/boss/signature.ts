// 사장님 고객 서명 API
// Flutter `lib/repo/signature_repo.dart` 와 1:1 대응
// 엔드포인트:
//   GET    /signatures/{custId}
//   GET    /signatures/order/{orderId}
//   GET    /signatures/record/{recordId}
//   POST   /signatures
//   DELETE /signatures/{id}?custId={custId}
import BossApiClient from '@/lib/bossApi';
import type {
  BossSignatureItem,
  BossSignatureCreateRequest,
} from '@/types/boss-signature';

export const bossSignatureApi = {
  // 사용자별 서명 목록 — Flutter: SignatureRepo.getSignatures
  list: (custId: string) =>
    BossApiClient.getPrivate<BossSignatureItem[]>(
      `/signatures/${encodeURIComponent(custId)}`,
    ),

  // 주문별 서명 조회 — Flutter: SignatureRepo.getSignaturesByOrder
  listByOrder: (orderId: number) =>
    BossApiClient.getPrivate<BossSignatureItem[]>(`/signatures/order/${orderId}`),

  // 시공 기록별 서명 조회 — Flutter: SignatureRepo.getSignaturesByRecord
  listByRecord: (recordId: number) =>
    BossApiClient.getPrivate<BossSignatureItem[]>(`/signatures/record/${recordId}`),

  // 서명 생성 — Flutter: SignatureRepo.createSignature
  create: (data: BossSignatureCreateRequest) =>
    BossApiClient.postPrivate<BossSignatureItem>('/signatures', data),

  // 서명 삭제 — Flutter: SignatureRepo.deleteSignature
  remove: (id: string, custId: string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/signatures/${encodeURIComponent(id)}?custId=${encodeURIComponent(custId)}`,
    ),
};
