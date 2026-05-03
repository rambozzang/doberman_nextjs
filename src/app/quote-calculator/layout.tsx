import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '도배 견적 계산기 | 평형·벽지별 정밀 자동 견적 — 도배르만',
  description:
    '평형, 방 개수, 벽지 종류, 천장 높이, 추가 옵션을 입력하면 자재비·인건비·옵션·마진·VAT까지 모두 반영해 즉시 산출. 2026 시장 평균 단가 기반.',
  keywords:
    '도배 견적 계산기, 평당 가격, 24평 32평 40평 도배 견적, 합지 실크 비교, 도배 비용, 벽지 종류, 도배 FAQ, 도배 용어, 친환경 벽지, 수입벽지, 도배 자동 견적, 도배 시공비, 도배 평당 가격, 합지 실크 견적, 도배르만 계산기',
  openGraph: {
    title: '도배 견적 계산기 — 도배르만',
    description: '평형·벽지·옵션·마진·세금까지 한 번에 계산하는 정밀 견적 시스템',
  },
};

export default function QuoteCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
