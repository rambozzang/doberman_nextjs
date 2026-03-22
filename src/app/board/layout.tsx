import { Metadata } from "next";

export const metadata: Metadata = {
  title: "도배 커뮤니티 | 시공 후기 및 견적 문의",
  description: "도배 전문가와 고객들이 공유하는 생생한 시공 후기, 견적 문의, 꿀팁 정보. 도배르만 커뮤니티에서 궁금증을 해결하세요.",
  keywords: "도배 후기, 시공 후기, 도배 견적 문의, 도배 정보, 도배 꿀팁, 아파트 도배 후기, 빌라 도배 후기",
  openGraph: {
    title: "도배 커뮤니티 | 도배르만",
    description: "전문가와 고객이 함께 소통하는 도배 전문 커뮤니티",
  },
};

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
