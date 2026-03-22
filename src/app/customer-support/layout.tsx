import { Metadata } from "next";

export const metadata: Metadata = {
  title: "고객센터 | 도배르만 도움말 및 문의하기",
  description: "도배르만 이용 중 불편한 점이나 궁금한 점이 있으신가요? 고객센터에서 신속하게 도와드리겠습니다.",
  keywords: "도배르만 고객센터, 도배 문의, 고객지원, 도배 상담, 1:1 문의",
  openGraph: {
    title: "고객센터 | 도배르만",
    description: "도배르만 고객님의 목소리에 귀 기울입니다",
  },
};

export default function CustomerSupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
