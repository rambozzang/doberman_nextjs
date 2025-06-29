import { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "도배 관련 자주 묻는 질문들을 확인하세요. 도배 비용, 시공 기간, 벽지 종류 등에 대한 궁금증을 해결해드립니다.",
  keywords: [
    "도배FAQ",
    "도배질문",
    "도배비용",
    "시공기간",
    "벽지종류",
    "도배궁금증",
    "도배상담"
  ],
  openGraph: {
    title: "자주 묻는 질문 | 도배르만",
    description: "도배 관련 자주 묻는 질문들을 확인하세요",
    url: "/faq",
  },
  alternates: {
    canonical: "/faq",
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 