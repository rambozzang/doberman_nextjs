import { Metadata } from "next";

export const metadata: Metadata = {
  title: "고객 지원",
  description: "도배 관련 문의사항이나 불편사항을 접수하세요. 전문 상담원이 신속하고 정확한 답변을 제공합니다.",
  keywords: [
    "고객지원",
    "도배문의",
    "고객센터",
    "도배상담",
    "문의접수",
    "도배도움",
    "기술지원",
    "도배서비스"
  ],
  openGraph: {
    title: "고객 지원 | 도배르만",
    description: "도배 관련 문의사항이나 불편사항을 접수하세요. 전문 상담원이 신속하고 정확한 답변을 제공합니다",
    url: "/customer-support",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배르만 고객 지원",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "고객 지원 | 도배르만",
    description: "도배 관련 문의사항이나 불편사항을 접수하세요",
  },
  alternates: {
    canonical: "/customer-support",
  },
};

export default function CustomerSupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 