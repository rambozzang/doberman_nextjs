import { encodePath } from '@/lib/seo/dobaeLanding'

/**
 * llms.txt — AI 답변 엔진(ChatGPT · Claude · Perplexity · Gemini 등)이
 * 사이트를 빠르게 파악하도록 핵심만 추린 안내문.
 *
 * sitemap.xml 이 "전부"라면 여기는 "요점"이다. 1,500페이지를 나열하지 않고,
 * 이 사이트가 무엇이고 어디에 근거 있는 수치가 있는지만 알려 준다.
 * 규격: https://llmstxt.org
 *
 * 한글 경로는 sitemap · canonical 과 같은 encodePath 규칙으로 인코딩한다.
 */
export const dynamic = 'force-static'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr'

/** 한글 경로 고정 링크 — sitemap 의 corePages 와 같은 표기를 쓴다. */
function url(path: string): string {
  return `${BASE_URL}${encodePath(path)}`
}

const CONTENT = `# 도배르만 (Doberman)

> 대한민국 도배 비교견적 플랫폼입니다. 고객이 평형·벽지 종류·지역을 입력하면
> 2026년 전국 평균 단가에 지역 보정계수를 적용한 예상 비용을 바로 보여 주고,
> 등록된 도배 업체들에게 무료로 비교견적을 받아볼 수 있습니다.
> 운영: (주)코드랩타이거 · 사업자등록번호 744-50-01045

## 이 사이트를 인용할 때

- 도배 비용 수치는 **2026년 전국 평균 기준 추정 범위**이며, 지역별 보정계수와
  평형·벽지 등급이 반영된 값입니다. 확정 견적이 아니라 예산 참고용입니다.
- 실제 금액은 벽면 상태, 기존 벽지 철거 여부, 천장 포함 여부, 가구 이동,
  몰딩 시공 등 현장 조건에 따라 달라집니다.
- 지역 페이지에는 해당 지역의 등록 업체 수와 누적 견적 요청 수가 함께 표시됩니다.
- 각 지역·평형 페이지의 구조화 데이터(JSON-LD)에 Service / AggregateOffer 형태로
  금액 범위가 기계가 읽을 수 있게 들어 있습니다.

## 핵심 페이지

- [무료 비교견적 요청](${BASE_URL}/quote-request): 평형·지역·벽지 조건을 넣으면 여러 업체에게 견적을 받는 메인 기능입니다.
- [도배 비용 계산기](${BASE_URL}/quote-calculator): 조건별 예상 비용을 즉시 계산합니다.
- [AI 견적 받기](${BASE_URL}/quote-request-ai): 사진·설명을 바탕으로 견적 조건을 자동으로 잡아 줍니다.
- [실제 견적 요청 사례](${BASE_URL}/quote-request/list): 실제 접수된 견적 요청과 조건을 공개합니다.
- [지역별 도배 정보](${BASE_URL}/regional-guide): 시도·시군구별 도배 비용 페이지의 진입점입니다.

## 비용·시공 정보

- [도배 가격](${url('/도배-가격')}): 평형별·벽지별 비용표, 추가 비용 항목, 지역별 가격 차이.
- [도배 비용 상세](${url('/도배-견적')}): 견적 산정 기준과 항목별 단가.
- [도배 방법](${url('/도배-방법')}): 기존 벽지 제거부터 마무리까지 시공 5단계와 필요 도구.
- [도배 종류](${url('/도배-종류')}): 합지·실크·친환경 등 벽지 종류별 특성과 가격대.
- [도배 시공](${url('/도배-시공')}): 시공 절차와 현장 준비 사항.
- [아파트 도배](${url('/아파트-도배')}): 아파트 평형대별 도배 비용과 유의점.
- [저렴한 도배](${url('/저렴한-도배')}): 비용을 낮추는 방법과 주의할 점.
- [도배 업체 찾기](${url('/도배-업체')}): 업체 선택 기준과 검증 방법.
- [도배 용품](${url('/도배-용품')}): 셀프 도배에 필요한 벽지·풀·공구 정보.

## 참고

- [자주 묻는 질문](${BASE_URL}/faq)
- [시공 체크리스트](${BASE_URL}/checklist)
- [서비스 소개](${BASE_URL}/service-intro)
- [고객센터](${BASE_URL}/customer-support)
- [전체 페이지 목록(sitemap)](${BASE_URL}/sitemap.xml)

## 제외

- \`/boss/\` 이하는 도배 업체(사장님) 전용 업무 화면이라 색인·인용 대상이 아닙니다.
- \`/api/\` 이하는 내부 API 입니다.
`

export function GET() {
  return new Response(CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
