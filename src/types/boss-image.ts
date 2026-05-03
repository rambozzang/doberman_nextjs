// 사장님 이미지(사진 갤러리) 관련 타입
// Flutter `lib/app/image/cntr/image_data.dart` 의 ImagePickerData / ImageDataInfo 와 1:1 매칭
// 그리고 `lib/app/image/model/photo_category.dart` 의 RoomCategory / PhotoType enum 도 포팅

// 방 카테고리 코드 (Flutter RoomCategory.code 와 동일)
export type BossRoomCategoryCode =
  | 'living_room'
  | 'master_bed'
  | 'room2'
  | 'room3'
  | 'room4'
  | 'kitchen'
  | 'bathroom'
  | 'balcony'
  | 'entrance'
  | 'other';

// 사진 유형 코드 (Flutter PhotoType.code 와 동일)
export type BossPhotoTypeCode = 'before' | 'after' | 'detail';

// 방 카테고리 메타 (코드 + 표시명)
export interface BossRoomCategoryMeta {
  code: BossRoomCategoryCode;
  displayName: string;
}

// 사진 유형 메타 (코드 + 표시명)
export interface BossPhotoTypeMeta {
  code: BossPhotoTypeCode;
  displayName: string;
}

// Flutter RoomCategory enum 전체 목록 (순서 유지)
export const BOSS_ROOM_CATEGORIES: BossRoomCategoryMeta[] = [
  { code: 'living_room', displayName: '거실' },
  { code: 'master_bed', displayName: '안방' },
  { code: 'room2', displayName: '방2' },
  { code: 'room3', displayName: '방3' },
  { code: 'room4', displayName: '방4' },
  { code: 'kitchen', displayName: '주방' },
  { code: 'bathroom', displayName: '화장실' },
  { code: 'balcony', displayName: '발코니' },
  { code: 'entrance', displayName: '현관' },
  { code: 'other', displayName: '기타' },
];

// Flutter PhotoType enum 전체 목록
export const BOSS_PHOTO_TYPES: BossPhotoTypeMeta[] = [
  { code: 'before', displayName: '시공 전' },
  { code: 'after', displayName: '시공 후' },
  { code: 'detail', displayName: '상세' },
];

// 코드 → 표시명 변환 헬퍼
export function getRoomDisplayName(code?: string | null): string {
  if (!code) return '기타';
  return BOSS_ROOM_CATEGORIES.find((r) => r.code === code)?.displayName ?? '기타';
}

export function getPhotoTypeDisplayName(code?: string | null): string {
  if (!code) return '상세';
  return BOSS_PHOTO_TYPES.find((p) => p.code === code)?.displayName ?? '상세';
}

// Flutter ImageDataInfo 와 동일
export interface BossImageDataInfo {
  customerId?: number;
  num?: number;
  fileType?: string;
  fileNm?: string;
  fileKey?: string;
  filePath?: string;
  crtDtm?: string;
  roomCategory?: string; // RoomCategory.code
  photoType?: string;    // PhotoType.code
}

// Flutter ImagePickerData 와 동일 (POST /orders/files 페이로드)
export interface BossImagePickerData {
  customerId?: string;
  orderFiles?: BossImageDataInfo[];
}
