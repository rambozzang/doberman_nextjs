import { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개 | 도배 전문가 매칭 플랫폼 도배르만",
  description: "도배르만은 도배 전문가와 고객을 연결하고 작업 조건에 맞는 견적을 비교할 수 있는 도배 플랫폼입니다.",
  keywords: "도배르만 소개, 도배 플랫폼, 도배 전문가 매칭, 도배 서비스 안내",
  alternates: { canonical: "/service-intro" },
  openGraph: {
    url: "/service-intro",
    title: "서비스 소개 | 도배르만",
    description: "대한민국 도배의 새로운 기준, 도배르만",
  },
};

export default function ServiceIntroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
