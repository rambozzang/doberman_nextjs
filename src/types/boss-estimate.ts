// 사장님 견적서(estimate) 모듈 타입 정의
// Flutter `lib/app/estimate/cntr/estimate_data.dart` 의 EstimateData 1:1 대응
// 백엔드 엔드포인트: /estimateitems/* (Flutter EstimateRepo 와 동일)

// 견적서 헤더 데이터 (/estimates/*)
export interface BossEstimate {
  id: number;
  customerId: number;
  customerName: string;
  estimateDate?: string | null;
  memo?: string | null;
  totalItems?: number | null;
  totalQuantity?: number | null;
  totalAmount?: number | null;
  companyId?: number | null;
  createdDt?: string;
  updatedDt?: string;
  deletedDt?: string | null;
}

// 견적 품목(라인 아이템) 데이터
export interface BossEstimateItem {
  id?: number;
  customerId?: number;
  estimateId?: number;
  itemName?: string;
  itemSpec?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  isTaxFree?: 'Y' | 'N';
  isVat?: 'Y' | 'N';
  memo?: string;
  supplyAmount?: number;
  vatAmount?: number;
  totalAmount?: number;
  totalAmountKor?: string;
  delYn?: string;
  createdDt?: string;
  createdUserId?: string;
  updatedDt?: string;
  deletedDt?: string;
}

// 견적서 생성 요청
export interface BossEstimateCreateRequest {
  customerId: number;
  customerName: string;
  estimateDate?: string | null;
  memo?: string | null;
  totalItems?: number | null;
  totalQuantity?: number | null;
  totalAmount?: number | null;
  companyId?: number | null;
}

// 견적 품목 등록 요청 (id 없이)
export type BossEstimateItemCreateRequest = Omit<BossEstimateItem, 'id' | 'createdDt' | 'updatedDt' | 'deletedDt' | 'delYn' | 'createdUserId'>;

// 견적 품목 수정 요청 (id 필수)
export interface BossEstimateItemUpdateRequest extends BossEstimateItem {
  id: number;
}

// 견적 합계 정보 (목록 화면에서 사용)
export interface BossEstimateTotals {
  totalItems: number;
  totalQuantity: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
}
