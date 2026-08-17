import { MetadataRoute } from 'next'

/**
 * robots.txt
 *
 * 정리 내용:
 *  - Disallow: /_next/ 제거. CSS·JS 를 막으면 크롤러가 페이지를 제대로
 *    렌더링하지 못한다. Googlebot 그룹엔 없었지만 기본 그룹에 있어
 *    다른 크롤러의 렌더링을 막고 있었다.
 *  - crawlDelay 제거 — Google 이 무시한다.
 *  - host 제거 — 비표준이며 Google 이 무시한다. 도메인 정규화는
 *    middleware 의 301 과 canonical 로 처리한다.
 *  - 봇별로 똑같이 반복되던 그룹을 하나로 합쳤다.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/temp/',
          '/test/',
          // 사장님 전용 화면은 검색 대상이 아니다.
          '/boss/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
