import type { NextConfig } from "next";

/**
 * 한글 고정 경로 가이드 페이지 — 주소는 한글 그대로, 내부 라우트만 ASCII.
 *
 * Next.js 16.3.x 는 한글 "고정" 경로 페이지를 빌드 타임에 미리 그릴 때
 * InvalidCharacterError 로 죽는다(16.3.5 에서도 재현). 예전에 이걸
 * force-dynamic 으로 우회했더니 빌드는 통과했지만 런타임에 404 가 나서
 * 9개 SEO 페이지가 11일간 죽어 있었다(2026-09-08 ~ 09-19).
 *
 * 같은 한글이라도 [param] 형태의 동적 경로(/서울/도배, /24평-도배비용)는
 * 멀쩡하다. 즉 문제는 "한글 + 고정 경로" 조합이다. 그래서 페이지 파일은
 * ASCII 경로(/guides/...)에 두고 rewrite 로 한글 주소를 연결한다.
 * 주소창·검색 노출은 한글 URL 그대로라 기존 색인을 잃지 않는다.
 *
 * canonical 은 각 페이지가 이미 한글 URL 을 가리키고 있어 중복 색인도 없다.
 * Next.js 가 버그를 고치면 파일을 한글 경로로 되돌리고 이 표를 지우면 된다.
 *
 * sitemap · 내부 링크는 왼쪽(한글)을 쓴다.
 */
const GUIDE_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['도배-가격', 'dobae-price'],
  ['도배-견적', 'dobae-estimate'],
  ['도배-방법', 'dobae-method'],
  ['도배-시공', 'dobae-construction'],
  ['도배-업체', 'dobae-company'],
  ['도배-용품', 'dobae-supplies'],
  ['도배-종류', 'dobae-types'],
  ['아파트-도배', 'apartment-dobae'],
  ['저렴한-도배', 'cheap-dobae'],
];

/**
 * 옛 견적 URL → 현재 URL. destination 은 실제로 200 이 나오는 주소여야 한다.
 * 지역은 시도 허브(/{시도}/도배), 평형·벽지·건물유형은 /{키워드}-도배비용 으로 간다.
 * 대응되는 페이지가 없는 것(단독주택·사무실·상가)은 일반 견적 페이지로 보낸다.
 */
const OLD_ESTIMATE_URLS: ReadonlyArray<readonly [string, string]> = [
  ['서울-도배-견적', '/서울/도배'],
  ['경기-도배-견적', '/경기/도배'],
  ['부산-도배-견적', '/부산/도배'],
  ['대구-도배-견적', '/대구/도배'],
  ['인천-도배-견적', '/인천/도배'],
  ['광주-도배-견적', '/광주/도배'],
  ['대전-도배-견적', '/대전/도배'],
  ['24평-도배-견적', '/24평-도배비용'],
  ['32평-도배-견적', '/32평-도배비용'],
  ['빌라-도배-견적', '/빌라-도배비용'],
  ['오피스텔-도배-견적', '/오피스텔-도배비용'],
  ['실크벽지-견적', '/실크벽지-도배비용'],
  ['수입벽지-견적', '/수입벽지-도배비용'],
  ['천연벽지-견적', '/천연벽지-도배비용'],
  ['합지벽지-견적', '/합지-도배비용'],
  // 대응 페이지 없음 — 일반 견적 안내로
  ['단독주택-도배-견적', '/도배-견적'],
  ['사무실-도배-견적', '/도배-견적'],
  ['상가-도배-견적', '/도배-견적'],
];

const nextConfig: NextConfig = {
  /* config options here */

  // Turbopack workspace root 를 현재 프로젝트로 고정
  // (상위 디렉터리의 package-lock.json 을 잘못 잡는 경고 방지)
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // 메모리 사용량 최적화
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // 컴파일 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
    // 이미지 최적화 설정
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // 헤더 최적화
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },
  
  async redirects() {
    return [
      // 플랜에 정의된 일부 라우트를 실제 구현 위치로 연결
      // "주문 관리"를 앱과 같은 "고객"으로 통합하면서 경로를 옮겼다 — 앱 · 알림에 남은 링크 보호
      { source: '/boss/orders', destination: '/boss/customers', permanent: true },
      { source: '/boss/orders/quick', destination: '/boss/customers/new', permanent: true },
      { source: '/boss/orders/:id', destination: '/boss/customers/:id', permanent: true },
      { source: '/boss/home', destination: '/boss', permanent: false },
      { source: '/boss/photo/camera', destination: '/boss/photo', permanent: false },
      { source: '/boss/signatures', destination: '/boss/signature', permanent: false },
      { source: '/boss/signatures/capture', destination: '/boss/signature/capture', permanent: false },
      { source: '/boss/signatures/:id', destination: '/boss/signature/:id', permanent: false },

      // 옛 견적 URL 체계(-도배-견적 / -견적) → 현재 체계(-도배비용 / 지역 허브).
      // Search Console "발견됨 - 색인 생성되지 않음" 에 18건이 잡혀 있었고
      // 전부 404 인 것을 확인했다(2026-09-19). 404 로 두면 Google 이 계속
      // 재시도하며 크롤 예산을 쓰므로, 뜻이 같은 현재 페이지로 301 을 준다.
      // source 는 rewrite 와 같은 이유로 퍼센트 인코딩해서 준다.
      ...OLD_ESTIMATE_URLS.map(([from, to]) => ({
        source: `/${encodeURIComponent(from)}`,
        destination: to,
        permanent: true,
      })),
    ];
  },

  async rewrites() {
    return [
      // 사장님 API 프록시 — 브라우저 CORS 회피
      {
        source: '/api/boss/:path*',
        destination: 'https://www.tigerbk.com/api-doman/:path*',
      },
      {
        source: '/api/chat/:path*',
        destination: 'https://www.tigerbk.com/chat-api/:path*',
      },
      // 한글 가이드 주소 → ASCII 내부 라우트 (위 GUIDE_ROUTES 주석 참고)
      //
      // source 를 퍼센트 인코딩해서 준다. 브라우저·크롤러는 한글 경로를
      // 인코딩해 보내는데, rewrite 매칭은 인코딩된 원문과 비교하므로
      // 원본 한글로 적으면 매칭이 안 돼 404 가 난다(실측 확인).
      ...GUIDE_ROUTES.map(([korean, ascii]) => ({
        source: `/${encodeURIComponent(korean)}`,
        destination: `/guides/${ascii}`,
      })),
    ];
  },
};

export default nextConfig;
