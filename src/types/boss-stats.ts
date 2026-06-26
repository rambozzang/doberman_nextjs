// 사장님 매출/통계(stats) 모듈 타입 정의
// 백엔드 /stats/* 응답 1:1 대응
//
// 백엔드 엔드포인트:
//   - GET /stats/monthly?startYear=&startMonth=&endYear=&endMonth=
//   - GET /stats/monthly/current?yearMonth=YYYYMM

// 월별 통계 단일 row (1개월치 집계)
export interface BossMonthlyStat {
  // 연월
  year?: number;
  month?: number;
  yearMonth?: string;
  companyId?: string;

  // 상태별 건수
  inProgressCount?: number;   // 진행중
  collectingCount?: number;   // 수금중
  completedCount?: number;    // 완료
  holdCount?: number;         // 보류
  canceledCount?: number;     // 취소

  // 금액
  estimateAmount?: number;    // 견적 금액
  collectedAmount?: number;   // 수금 금액
  uncollectedAmount?: number; // 미수금
  averageAmount?: number;     // 평균 단가

  // 전체
  totalCount?: number;        // 총 건수

  // 이전월 대비 (current 월 응답에 포함)
  lastMonthTotalCount?: number;
  lastMonthCompletedCount?: number;
  lastMonthCanceledCount?: number;
  lastMonthCollectedAmount?: number;

  // 과거 호환용 별칭
  totalAmount?: number;
  paidAmount?: number;
  unpaidAmount?: number;
  estimateCount?: number;
  contractCount?: number;
  completeCount?: number;
  cancelCount?: number;
  avgAmount?: number;
}

// 월별 통계 조회 파라미터 (GET /stats/monthly)
export interface BossMonthlyStatsParams {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

// 월별 통계 응답
export interface BossMonthlyStatsResponse {
  list?: BossMonthlyStat[];
  content?: BossMonthlyStat[];
  totalCount?: number;
  totalAmount?: number;
}

// 현재월(또는 특정월) 매출 상세 row
export interface BossSalesItem {
  id?: number;
  name?: string;
  workDate?: string;
  updatedDt?: string;
  totalAmount?: number;
  statusCd?: string;
  phone?: string;
  address?: string;
}

// 현재월 통계 응답
export interface BossCurrentMonthStats extends BossMonthlyStat {
  list?: BossSalesItem[];
  content?: BossSalesItem[];
}
