// 시공 기록(boss construction) 전용 타입
// Flutter `lib/app/construction_record/model/construction_record_item.dart` 와
// `lib/repo/construction_record_repo.dart` 에 1:1 대응한다.

export type ConstructionImageType = 'BEFORE' | 'DURING' | 'AFTER';

// 시공 기록 이미지 한 장 (Flutter RecordImage)
export interface ConstructionRecordImage {
  imageType: ConstructionImageType;
  filePath: string;
  fileNm?: string | null;
  memo?: string | null;
  sortOrder: number;
}

// 시공 기록 (Flutter ConstructionRecordItem)
// 서버 응답에는 beforeImages/duringImages/afterImages 가 직접 들어오는 형태와
// images 배열로 들어오는 형태가 모두 있을 수 있어 양쪽을 모두 허용한다.
export interface ConstructionRecord {
  id: number | string;
  custId?: string;
  orderId?: number | null;
  title: string;
  description?: string | null;
  constructionDate: string; // yyyy-MM-dd
  status: string; // '진행중' | '완료'
  beforeImages: string[];
  duringImages: string[];
  afterImages: string[];
  createdAt?: string;
  createdDt?: string;
  updatedDt?: string;
}

// 생성 요청 페이로드 (Flutter _toCreateRequest 와 동일 스키마)
export interface ConstructionRecordCreateRequest {
  custId: string;
  orderId?: number | null;
  title: string;
  description?: string | null;
  constructionDate: string; // yyyy-MM-dd
  status: string;
  images: ConstructionRecordImage[];
}

// 수정 요청 페이로드 (Flutter _toUpdateRequest)
export interface ConstructionRecordUpdateRequest extends ConstructionRecordCreateRequest {
  id: number;
}

// 시공 기록 폼 상태 (페이지 내부 사용)
export interface ConstructionRecordFormState {
  orderId: number | null;
  title: string;
  description: string;
  constructionDate: string;
  status: string;
  beforeImages: string[];
  duringImages: string[];
  afterImages: string[];
}
