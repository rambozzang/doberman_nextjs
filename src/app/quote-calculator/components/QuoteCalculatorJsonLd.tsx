/**
 * 도배 견적 계산기 페이지 JSON-LD Structured Data
 * 서버 컴포넌트 — 'use client' 없이 유지해야 Next.js가 <head>에 올바르게 삽입
 * FAQ Schema는 FaqAndGlossary.tsx에서 이미 출력하므로 여기서는 제외 (중복 방지)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr';
const CALCULATOR_URL = `${BASE_URL}/quote-calculator`;

// 2-A. WebApplication — 도배 견적 자동 산출 앱
const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '도배르만 도배 견적 계산기',
  url: CALCULATOR_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  description:
    '평형·벽지·옵션을 입력하면 자재비·인건비·옵션·마진·VAT까지 자동 계산되는 도배 견적 시스템',
  inLanguage: 'ko-KR',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '1250',
    bestRating: '5',
    worstRating: '1',
  },
};

// 2-B. HowTo — 계산기 사용법 4단계
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: '도배 견적 계산하는 방법',
  description:
    '도배르만 견적 계산기로 정확한 도배 비용을 산출하는 4단계 가이드',
  step: [
    {
      '@type': 'HowToStep',
      name: '기본 정보 입력',
      text: '주거 형태, 평형, 방 개수, 천장 높이를 선택합니다.',
    },
    {
      '@type': 'HowToStep',
      name: '벽지 종류 선택',
      text: '거실/방/천장 벽지 종류(합지·실크·천연·수입)를 각각 고릅니다.',
    },
    {
      '@type': 'HowToStep',
      name: '추가 옵션 설정',
      text: '철거, 곰팡이 제거, 가구 이동 등 추가 작업을 선택합니다.',
    },
    {
      '@type': 'HowToStep',
      name: '최종 견적 확인',
      text: '자재비·인건비·옵션·마진·VAT가 모두 반영된 최종 견적을 확인합니다.',
    },
  ],
};

// 2-C. Service — 도배 견적 산출 서비스
const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: '도배 견적 산출 서비스',
  provider: { '@type': 'Organization', name: '도배르만', url: BASE_URL },
  areaServed: { '@type': 'Country', name: '대한민국' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: '도배 시공 종류',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: '합지 도배' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: '실크 도배' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: '천연 벽지 도배' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: '수입 벽지 도배' },
      },
    ],
  },
};

// 2-D. BreadcrumbList — 페이지 계층 구조
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '도배르만', item: BASE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: '견적',
      item: `${BASE_URL}/quote-request`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: '견적 계산기',
      item: CALCULATOR_URL,
    },
  ],
};

// 2-F. LocalBusiness — 도배르만 소개
const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: '도배르만',
  description:
    '전국 300명+ 검증된 도배 전문가와 함께하는 무료 도배 견적 비교 플랫폼',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  priceRange: '무료',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'KR',
    addressRegion: '서울특별시',
  },
  areaServed: [
    '서울특별시',
    '경기도',
    '인천광역시',
    '부산광역시',
    '대구광역시',
    '대전광역시',
    '광주광역시',
    '울산광역시',
    '대한민국',
  ],
};

export default function QuoteCalculatorJsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
    </>
  );
}
