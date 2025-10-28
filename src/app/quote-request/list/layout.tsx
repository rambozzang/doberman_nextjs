import { Metadata } from "next";

export const metadata: Metadata = {
  title: "전체 견적 요청 목록 | 도배 견적 요청 서비스",
  description: "등록된 모든 도배 견적 요청을 확인하고 상태별로 검색할 수 있는 페이지입니다.",
  openGraph: {
    title: "전체 견적 요청 목록",
    description: "도배 견적 요청을 확인하고 상태별로 검색할 수 있습니다.", // 80자 이내: 39자
    type: "website",
  },
};

export default function QuoteRequestListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
