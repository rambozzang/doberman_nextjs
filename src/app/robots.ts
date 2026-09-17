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
 *  - 봇별로 똑같이 반복되던 그룹을 하나로 합쳤다. (그 뒤 AEO 목적으로 답변 엔진
 *    크롤러 그룹을 하나 다시 두었다 — 아래 AI_CRAWLERS 주석 참고. 검색엔진마다
 *    그룹을 따로 두던 예전 구조로 돌아간 것은 아니다.)
 */
/** 검색·AI 크롤러 공통으로 막는 경로. 한 곳에서 관리해 그룹별로 어긋나지 않게 한다. */
const DISALLOW = [
  '/api/',
  '/admin/',
  '/private/',
  '/temp/',
  '/test/',
  // 사장님 전용 화면은 검색 대상이 아니다.
  '/boss/',
]

/**
 * AI 답변 엔진 크롤러 — 명시적으로 허용한다(AEO).
 *
 * `*` 규칙만 있어도 암묵적으로 허용이지만, 이 봇들은 자기 이름의 그룹이 있으면
 * 그쪽을 우선한다. 명시해 두면 나중에 누가 `*` 를 조이더라도 답변 엔진 노출은
 * 의도대로 유지되고, 반대로 특정 봇만 빼고 싶을 때 여기만 고치면 된다.
 *
 * 훈련 수집과 답변 인용이 봇 단위로 갈리는 곳이 있어(예: GPTBot=훈련,
 * OAI-SearchBot=검색 색인) 둘 다 적어 둔다.
 */
const AI_CRAWLERS = [
  'GPTBot',            // OpenAI 훈련
  'OAI-SearchBot',     // ChatGPT 검색 색인
  'ChatGPT-User',      // 사용자가 링크를 열 때
  'ClaudeBot',         // Anthropic 훈련
  'Claude-User',       // Claude 가 사용자 요청으로 가져갈 때
  'Claude-SearchBot',  // Claude 검색 색인
  'PerplexityBot',     // Perplexity 색인
  'Perplexity-User',   // Perplexity 사용자 요청
  'Google-Extended',   // Gemini · AI 개요 그라운딩
  'Applebot-Extended', // Apple Intelligence
  'meta-externalagent',
  'Amazonbot',
  'CCBot',             // Common Crawl — 다수 모델의 원천
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
