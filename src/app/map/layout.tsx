import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전국 도배업체 지도 | 도베르만",
  description:
    "전국 도배업체를 지도에서 한눈에 확인하세요. 업체 정보와 채널을 살펴보고, 원하는 업체에 바로 무료 견적을 요청할 수 있습니다.",
  alternates: { canonical: "/map" },
  openGraph: {
    title: "전국 도배업체 지도 | 도베르만",
    description: "지도에서 우리 동네 도배업체를 찾고 무료 견적을 받아보세요.",
    url: "/map",
    type: "website",
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
