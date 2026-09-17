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
 *
 * 그 뒤 AI 크롤러를 성격별로 두 그룹 더 두었다(아래 주석 참고).
 * 답변 엔진은 허용, 학습 수집은 차단 — 검색엔진마다 그룹을 따로 두던
 * 예전 구조로 돌아간 것이 아니라 정책이 실제로 다른 것들만 나눈 것이다.
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
 * 답변 엔진(AI 검색) 크롤러 — 명시적으로 허용한다(AEO).
 *
 * 이 봇들은 답변에 우리 페이지를 인용하고 출처 링크를 달아 주므로 트래픽으로 돌아온다.
 * `*` 규칙만 있어도 암묵적으로 허용이지만, 이 봇들은 자기 이름의 그룹이 있으면
 * 그쪽을 우선한다. 명시해 두면 나중에 누가 `*` 를 조이더라도 답변 엔진 노출은
 * 의도대로 유지되고, 반대로 특정 봇만 빼고 싶을 때 여기만 고치면 된다.
 */
const AI_ANSWER_CRAWLERS = [
  'OAI-SearchBot',    // ChatGPT 검색 색인
  'ChatGPT-User',     // 사용자가 ChatGPT 안에서 링크를 열 때
  'Claude-SearchBot', // Claude 검색 색인
  'Claude-User',      // 사용자가 Claude 안에서 링크를 열 때
  'PerplexityBot',    // Perplexity 색인
  'Perplexity-User',  // Perplexity 사용자 요청
]

/**
 * 모델 학습용 수집 봇 — 막는다(2026-09, 사장님 지시).
 *
 * 목록에서 빼기만 하면 `*` 규칙에 걸려 그대로 허용되므로, 막으려면 이렇게
 * 이름을 적고 Disallow 를 줘야 한다.
 *
 * 이 봇들은 답변에 출처를 달아 주지 않아 AEO 에 도움이 되지 않으면서,
 * /quote-request/list · /board 의 고객 작성 내용까지 학습 코퍼스로 가져간다.
 * 특히 CCBot(Common Crawl)은 한 번 들어가면 되돌리기 어렵다.
 *
 * Google-Extended 는 Gemini 학습·그라운딩을 함께 통제한다. 구글 검색의 AI 개요는
 * 일반 Googlebot 이 담당하므로, 이걸 막아도 검색 노출에는 영향이 없다.
 */
const AI_TRAINING_CRAWLERS = [
  'GPTBot',            // OpenAI 학습
  'ClaudeBot',         // Anthropic 학습
  'Google-Extended',   // Gemini 학습 · 그라운딩
  'Applebot-Extended', // Apple Intelligence 학습
  'meta-externalagent',
  'Amazonbot',
  'CCBot',             // Common Crawl — 다수 모델의 학습 원천
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
        userAgent: AI_ANSWER_CRAWLERS,
        allow: '/',
        disallow: DISALLOW,
      },
      {
        userAgent: AI_TRAINING_CRAWLERS,
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
