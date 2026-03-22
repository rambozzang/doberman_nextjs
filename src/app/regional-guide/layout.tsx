import { Metadata } from "next";

export const metadata: Metadata = {
  title: "지역별 도배 가이드 | 우리 동네 도배 시세 및 업체 정보",
  description: "서울, 경기, 인천 등 전국 주요 지역별 도배 시공 시세와 추천 업체 정보를 확인하세요.",
  keywords: "지역별 도배, 서울 도배, 경기 도배, 인천 도배, 부산 도배, 대구 도배, 도배 시세",
  openGraph: {
    title: "지역별 도배 가이드 | 도배르만",
    description: "전국 어디서나 믿을 수 있는 지역별 도배 정보",
  },
};

export default function RegionalGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
