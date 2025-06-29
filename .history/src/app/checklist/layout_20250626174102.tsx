import { Metadata } from "next";

export const metadata: Metadata = {
  title: "도배 체크리스트",
  description: "도배 시공 전후 확인해야 할 체크리스트입니다. 완벽한 도배를 위한 단계별 점검 가이드를 제공합니다.",
  keywords: [
    "도배체크리스트",
    "시공점검",
    "도배확인사항",
    "품질관리",
    "시공가이드",
    "도배준비",
    "벽지점검",
    "도배품질"
  ],
  openGraph: {
    title: "도배 체크리스트 | 도배르만",
    description: "도배 시공 전후 확인해야 할 체크리스트입니다. 완벽한 도배를 위한 단계별 점검 가이드",
    url: "/checklist",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배르만 체크리스트",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도배 체크리스트 | 도배르만",
    description: "도배 시공 전후 확인해야 할 체크리스트입니다",
  },
  alternates: {
    canonical: "/checklist",
  },
};

export default function ChecklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 