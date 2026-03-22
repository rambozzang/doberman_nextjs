import { Metadata } from "next";

export const metadata: Metadata = {
  title: "무료 도배 견적 신청 | 전국 300+ 전문가 맞춤 견적",
  description: "합지벽지부터 실크벽지까지, 아파트부터 오피스텔까지. 1분 만에 도배 견적을 신청하고 최고의 전문가를 만나보세요.",
  keywords: "무료 도배 견적, 도배 견적 신청, 벽지 교체 견적, 아파트 도배 견적, 빌라 도배 견적, 오피스텔 도배 견적",
  openGraph: {
    title: "무료 도배 견적 신청 | 도배르만",
    description: "간편하게 신청하고 전문가의 견적을 비교하세요",
  },
};

export default function QuoteRequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
