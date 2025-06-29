import { Metadata } from "next";

export const metadata: Metadata = {
  title: "지역별 도배 가이드",
  description: "전국 주요 지역별 도배 시장 정보와 가격대를 확인하세요. 지역별 특성과 추천 업체 정보를 제공합니다.",
  keywords: [
    "지역별도배",
    "도배가격지역",
    "서울도배",
    "부산도배",
    "대구도배",
    "인천도배",
    "지역도배업체",
    "도배시장정보"
  ],
  openGraph: {
    title: "지역별 도배 가이드 | 도배르만",
    description: "전국 주요 지역별 도배 시장 정보와 가격대를 확인하세요",
    url: "/regional-guide",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배르만 지역 가이드",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "지역별 도배 가이드 | 도배르만",
    description: "전국 주요 지역별 도배 시장 정보와 가격대를 확인하세요",
  },
  alternates: {
    canonical: "/regional-guide",
  },
};

export default function RegionalGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 