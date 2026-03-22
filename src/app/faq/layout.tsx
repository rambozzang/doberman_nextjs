import { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문 | 도배 견적 및 시공 궁금증 해결",
  description: "도배 견적 비용, 시공 기간, 사후 관리 등 도배르만 서비스에 대해 자주 묻는 질문들을 모았습니다.",
  keywords: "도배 FAQ, 도배 궁금증, 도배 비용 문의, 도배 기간, 도배 A/S, 도배르만 이용방법",
  openGraph: {
    title: "자주 묻는 질문 | 도배르만",
    description: "도배에 관한 모든 궁금증, 여기서 확인하세요",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
