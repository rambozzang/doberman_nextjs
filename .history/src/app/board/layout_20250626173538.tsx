import { Metadata } from "next";

export const metadata: Metadata = {
  title: "도배 커뮤니티",
  description: "도배 시공 후기, 견적 문의, 정보 공유를 위한 커뮤니티입니다. 실제 고객 후기와 전문가 조언을 확인하세요.",
  keywords: [
    "도배후기",
    "도배커뮤니티",
    "시공후기",
    "도배정보",
    "벽지후기",
    "도배팁",
    "인테리어후기",
    "도배질문"
  ],
  openGraph: {
    title: "도배 커뮤니티 | 도배르만",
    description: "도배 시공 후기, 견적 문의, 정보 공유를 위한 커뮤니티",
    url: "/board",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배르만 커뮤니티",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도배 커뮤니티 | 도배르만",
    description: "도배 시공 후기, 견적 문의, 정보 공유를 위한 커뮤니티",
  },
  alternates: {
    canonical: "/board",
  },
};

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 