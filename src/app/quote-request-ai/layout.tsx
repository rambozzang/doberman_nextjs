import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 도배 컨시어지 | 1분 만에 똑똑한 맞춤 견적',
  description:
    '자연어로 한 줄 입력하면 AI가 평수·벽지·가격을 분석해주는 신개념 도배 견적 서비스. 사진 한 장으로도 견적이 가능해요.',
  keywords:
    'AI 도배 견적, AI 견적 챗봇, 자동 도배 견적, 스마트 견적, 도배 가격 자동 계산, AI 인테리어, 도배르만 AI, 도배 챗봇, 도배 비교견적',
  openGraph: {
    title: 'AI 도배 컨시어지 — 도배르만',
    description: '자연어 한 줄로 도배 견적이 끝나요. AI가 분석한 맞춤 가격, 추천 패키지, 비슷한 시공 사례까지.',
  },
};

export default function QuoteRequestAILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
