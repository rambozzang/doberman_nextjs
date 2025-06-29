import { Metadata } from "next";

export const metadata: Metadata = {
  title: "무료 도배 견적 요청",
  description: "간단한 정보 입력으로 전국 도배 전문가들로부터 무료 견적을 받아보세요. 3분 만에 완료되는 견적 요청으로 최적의 도배 업체를 찾으세요.",
  keywords: [
    "도배견적",
    "무료견적",
    "도배견적요청",
    "도배비용",
    "벽지견적",
    "도배업체견적",
    "인테리어견적",
    "리모델링견적"
  ],
  openGraph: {
    title: "무료 도배 견적 요청 | 도배르만",
    description: "간단한 정보 입력으로 전국 도배 전문가들로부터 무료 견적을 받아보세요",
    url: "/quote-request",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배르만 견적 요청",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "무료 도배 견적 요청 | 도배르만",
    description: "간단한 정보 입력으로 전국 도배 전문가들로부터 무료 견적을 받아보세요",
  },
  alternates: {
    canonical: "/quote-request",
  },
};

export default function QuoteRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 