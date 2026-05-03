// 사장님 매출/통계(stats) 모듈 타입 정의
// Flutter `lib/repo/statis_repo.dart` (StatistRepo) 와 백엔드 `/stats/*` 응답 1:1 대응
//
// 백엔드 엔드포인트:
//   - GET /stats/monthly?startYear=&startMonth=&endYear=&endMonth=
//   - GET /stats/monthly/current?yearMonth=YYYYMM

// 월별 통계 단일 row (1개월치 집계)
export interface BossMonthlyStat {
  // 연월 (예: "202504" 또는 "2025-04") - 백엔드 필드명에 맞춰 다양한 케이스를 허용
  yearMonth?: string;
  year?: number;
  month?: number;

  // 집계 값
  totalCount?: number;        // 총 건수
  totalAmount?: number;       // 총 매출액
  paidAmount?: number;        // 수금 금액
  unpaidAmount?: number;      // 미수금 금액

  // 부가 지표 (백엔드가 내려줄 수 있는 값)
  estimateCount?: number;     // 견적 건수
  contractCount?: number;     // 계약 건수
  completeCount?: number;     // 완료 건수
  cancelCount?: number;       // 취소 건수

  // 평균 단가
  avgAmount?: number;
}

// 월별 통계 조회 파라미터 (GET /stats/monthly)
export interface BossMonthlyStatsParams {
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
}

// 월별 통계 응답 (배열 또는 컨테이너 형태 모두 허용)
// 백엔드가 배열을 바로 내려주거나 { list: [...] } 형태로 내려줄 수 있음
export interface BossMonthlyStatsResponse {
  list?: BossMonthlyStat[];
  content?: BossMonthlyStat[];
  totalCount?: number;
  totalAmount?: number;
}

// 현재월(또는 특정월) 매출 상세 - GET /stats/monthly/current
// Flutter 화면의 sales_status_page 가 사용하는 실시간 매출 한 건
export interface BossSalesItem {
  id?: number;
  name?: string;            // 고객명/현장명
  workDate?: string;        // 시공일자 (yyyyMMdd 또는 ISO)
  updatedDt?: string;       // 수금일자
  totalAmount?: number;     // 금액
  statusCd?: string;        // 상태코드
  phone?: string;
  address?: string;
}

// 현재월 통계 응답 - 다양한 백엔드 구조 허용
export interface BossCurrentMonthStats {
  yearMonth?: string;

  // 집계 정보
  totalCount?: number;
  totalAmount?: number;
  paidAmount?: number;
  unpaidAmount?: number;

  // 트렌드 비교용 (이전월 대비)
  prevTotalAmount?: number;
  prevTotalCount?: number;

  // 상태별 카운트
  estimateCount?: number;
  contractCount?: number;
  completeCount?: number;
  cancelCount?: number;

  // 상세 리스트 (sales_status_page 의 salesList 대응)
  list?: BossSalesItem[];
  content?: BossSalesItem[];
}
