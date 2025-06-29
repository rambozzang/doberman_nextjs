import { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "도배르만의 서비스를 자세히 알아보세요. 투명한 견적, 검증된 전문가, 품질보장으로 최고의 도배 경험을 제공합니다.",
  keywords: [
    "도배서비스",
    "도배르만소개",
    "도배업체추천",
    "도배전문가",
    "품질보장",
    "투명견적",
    "도배플랫폼"
  ],
  openGraph: {
    title: "서비스 소개 | 도배르만",
    description: "도배르만의 서비스를 자세히 알아보세요. 투명한 견적, 검증된 전문가, 품질보장",
    url: "/service-intro",
  },
  alternates: {
    canonical: "/service-intro",
  },
};

export default function ServiceIntroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 