import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';
const CANONICAL = `${BASE_URL}/quote-calculator`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  // 이 페이지가 전체 검색 노출의 82%(42,159/51,700)를 받는데 CTR 이 2.0% 였다.
  // 상위 검색어가 "도배 비용 · 도배비용 · 벽지 도배 가격" 인데 제목은 "견적 계산기"
  // 로 시작해, 검색어와 겹치는 말이 앞에 없었다(Google 은 겹치는 부분을 굵게 보여준다).
  // 그래서 실제 검색어를 앞으로 빼고, 설명도 "입력하세요" 대신 "얻는 것" 부터 쓴다.
  // absolute 로 제목 전체를 직접 쓴다. 루트 템플릿(%s | 도배르만 - 도배 견적 비교
  // 플랫폼)이 붙으면 한글 기준 50자가 넘어 검색결과에서 뒷부분이 잘린다.
  title: { absolute: '도배 비용 30초 계산 | 2026 평형·벽지별 가격 - 도배르만' },
  description:
    '평형과 벽지만 고르면 도배 비용이 바로 나옵니다. 2026 전국 평균 단가에 철거·천장·가구 이동까지 반영한 예상 금액을 30초 만에 확인하고, 이어서 우리 지역 업체 무료 비교견적까지 받아보세요.',
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
    title: '도배 비용 30초 계산 — 2026 평형·벽지별 도배 가격',
    description:
      '평형과 벽지만 고르면 도배 비용이 바로 나옵니다. 2026 전국 평균 단가 기준, 우리 지역 업체 무료 비교견적까지.',
    url: CANONICAL,
    siteName: '도배르만 — 도배 견적 비교 플랫폼',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/og-dobae.jpg',
        width: 1200,
        height: 630,
        alt: '도배르만 도배 견적 계산기 — 실제 도배 시공 현장',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '도배 비용 30초 계산 — 도배르만',
    description: '평형과 벽지만 고르면 도배 비용이 바로. 2026 평균 단가 기준, 무료 비교견적까지.',
    images: ['/og-dobae.jpg'],
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
