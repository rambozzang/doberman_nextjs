import { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개 | 도배 전문가 매칭 플랫폼 도배르만",
  description: "도배르만은 투명한 가격과 검증된 실력의 도배 전문가를 연결해 드리는 국내 No.1 도배 전문 플랫폼입니다.",
  keywords: "도배르만 소개, 도배 플랫폼, 도배 전문가 매칭, 도배 서비스 안내",
  openGraph: {
    title: "서비스 소개 | 도배르만",
    description: "대한민국 도배의 새로운 기준, 도배르만",
  },
};

export default function ServiceIntroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
