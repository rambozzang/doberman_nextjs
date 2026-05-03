// 사장님(boss) AS 요청 관련 타입 정의
// Flutter `lib/app/as_request/model/as_request_item.dart` 와 1:1 매칭

// AS 상태 (한글 그대로)
export type AsStatus = '접수' | '진행중' | '완료' | '취소';

// AS 우선순위
export type AsPriority = '긴급' | '보통' | '낮음';

// 이미지 타입
export type AsImageType = 'DEFECT' | 'REPAIR';

// AS 요청 이미지 (Flutter AsRequestImage)
export interface AsRequestImage {
  imageType: AsImageType; // DEFECT(하자) / REPAIR(수리)
  filePath: string; // 이미지 URL
  fileNm?: string | null; // 파일명
  memo?: string | null; // 메모
  sortOrder: number; // 정렬 순서
}

// AS 요청 아이템 (Flutter AsRequestItem)
export interface AsRequestItem {
  id: string;
  custId?: string;
  orderId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  title: string;
  description?: string | null;
  requestDate: string; // ISO yyyy-MM-dd
  completedDate?: string | null;
  status: AsStatus | string;
  priority: AsPriority | string;
  images: AsRequestImage[];
  createdAt: string;
  updatedAt?: string | null;
}

// 생성 요청 페이로드
export interface AsRequestCreatePayload {
  custId: string;
  orderId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  title: string;
  description?: string | null;
  requestDate: string; // yyyy-MM-dd
  priority: string;
  images: AsRequestImage[];
}

// 수정 요청 페이로드
export interface AsRequestUpdatePayload extends AsRequestCreatePayload {
  id: number;
}
