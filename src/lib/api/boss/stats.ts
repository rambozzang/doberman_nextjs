// 사장님 매출/통계(stats) API
// Flutter `lib/repo/statis_repo.dart` (StatistRepo) 1:1 대응
// 인증이 필요한 엔드포인트이므로 BossApiClient 의 *Private 메서드를 사용한다.
import BossApiClient from '@/lib/bossApi';
import type {
  BossMonthlyStatsParams,
  BossMonthlyStatsResponse,
  BossCurrentMonthStats,
} from '@/types/boss-stats';

export const bossStatsApi = {
  // 월별 통계 조회 — Flutter: StatistRepo.getMonthStatis → GET /stats/monthly
  monthly: (params: BossMonthlyStatsParams) =>
    BossApiClient.getPrivate<BossMonthlyStatsResponse>('/stats/monthly', { params }),

  // 현재월(또는 특정월) 통계 조회 — Flutter: StatistRepo.getMonthCurrentStatis
  // GET /stats/monthly/current?yearMonth=YYYYMM
  // yearMonth 미지정 시 현재 연월(YYYYMM) 을 자동 사용
  current: (yearMonth?: string) => {
    const ym = yearMonth ?? formatYearMonth(new Date());
    return BossApiClient.getPrivate<BossCurrentMonthStats>('/stats/monthly/current', {
      params: { yearMonth: ym },
    });
  },
};

// YYYYMM 포맷 헬퍼 (Flutter 의 yearMonth 파라미터 포맷과 동일)
export function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}

// 최근 N개월 (startYear/startMonth/endYear/endMonth) 파라미터를 만들어주는 헬퍼
export function buildRecentMonthsParams(months: number): BossMonthlyStatsParams {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return {
    startYear: String(start.getFullYear()),
    startMonth: String(start.getMonth() + 1).padStart(2, '0'),
    endYear: String(end.getFullYear()),
    endMonth: String(end.getMonth() + 1).padStart(2, '0'),
  };
}
