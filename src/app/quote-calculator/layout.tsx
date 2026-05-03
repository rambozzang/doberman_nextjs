import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';
const CANONICAL = `${BASE_URL}/quote-calculator`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: '도배 견적 계산기 | 평당·평형별 정밀 자동 견적 산출 — 도배르만',
  description:
    '평형, 방 개수, 벽지 종류(합지·실크·천연·수입), 천장 높이, 추가 옵션을 입력하면 자재비·인건비·옵션·마진·VAT까지 한 번에 계산해 드립니다. 24평·32평·40평 도배 견적 즉시 확인. 2026 시장 평균 단가 기반.',
  keywords: [
    '도배 견적 계산기', '도배 자동 견적', '도배 평당 가격',
    '24평 도배 견적', '30평 도배 견적', '32평 도배 견적', '40평 도배 견적',
    '합지 도배 가격', '실크 도배 가격', '천연벽지 견적', '수입벽지 견적',
    '아파트 도배 견적', '빌라 도배 견적', '오피스텔 도배 견적', '단독주택 도배',
    '도배 시공비', '도배 자재비', '도배 인건비', '도배 평당 인건비',
    '합지 실크 차이', '벽지 종류', '친환경 벽지', '방염 벽지', '포인트 벽지',
    '도배 비용 계산', '도배 견적 비교', '도배 가격표', '도배 시세',
    '도배르만 계산기', '무료 도배 견적', '온라인 도배 견적',
    '서울 도배', '경기 도배', '부산 도배', '인천 도배',
    '도배 FAQ', '도배 용어', '덧방 시공', '철거 시공', '퍼티', '초배지', '몰딩',
  ].join(', '),
  authors: [{ name: '도배르만' }],
  creator: '도배르만',
  publisher: '도배르만',
  category: 'Business & Services',
  alternates: {
    canonical: CANONICAL,
    languages: { 'ko-KR': CANONICAL },
  },
  openGraph: {
    title: '도배 견적 계산기 — 평형·벽지·옵션 한 번에 자동 산출',
    description:
      '평형·방 개수·벽지·천장 높이·추가 옵션을 입력하면 자재비·인건비·VAT까지 즉시 계산되는 도배 견적 자동 산출 시스템.',
    url: CANONICAL,
    siteName: '도배르만 — 도배 견적 비교 플랫폼',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: '도배르만 견적 계산기 — 평형별 정밀 자동 견적',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '도배 견적 계산기 — 도배르만',
    description: '평당·평형별 도배 견적 자동 산출. 합지·실크·천연·수입 모두 지원.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'naver-site-verification': process.env.NAVER_VERIFICATION_ID || '',
    },
  },
};

export default function QuoteCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
