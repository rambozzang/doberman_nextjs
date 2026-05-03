// 사장님 이미지(사진 갤러리) API
// Flutter `lib/repo/image_repo.dart` 와 1:1 대응
//   GET    /orders/files/{customerId}
//   POST   /orders/files
//   DELETE /orders/files/{fileId}
//   PUT    /orders/files
import BossApiClient from '@/lib/bossApi';
import type { BossImageDataInfo, BossImagePickerData } from '@/types/boss-image';

export const bossImageApi = {
  // 고객 ID 기준 이미지 파일 목록 조회
  // Flutter: ImageRepo.getFiles → GET /orders/files/{customerId}
  list: (customerId: string) =>
    BossApiClient.getPrivate<BossImageDataInfo[]>(
      `/orders/files/${encodeURIComponent(customerId)}`,
    ),

  // 멀티 이미지 저장 (전체 목록을 한 번에 PUSH)
  // Flutter: ImageRepo.saveFiles → POST /orders/files
  save: (data: BossImagePickerData) =>
    BossApiClient.postPrivate<BossImageDataInfo[]>('/orders/files', data),

  // 이미지 단건 삭제
  // Flutter: ImageRepo.deleteFile → DELETE /orders/files/{fileId}
  remove: (fileId: string | number) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/orders/files/${encodeURIComponent(String(fileId))}`,
    ),

  // 이미지 단건 수정 (방/유형 변경 등)
  // Flutter: ImageRepo.updateFile → PUT /orders/files
  update: (file: BossImageDataInfo) =>
    BossApiClient.putPrivate<BossImageDataInfo>('/orders/files', file),
};
