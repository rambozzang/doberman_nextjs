import { Metadata } from "next";

export const metadata: Metadata = {
  title: "마이페이지 | 도배르만",
  description: "내 정보 관리 및 견적 신청 내역 확인",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
