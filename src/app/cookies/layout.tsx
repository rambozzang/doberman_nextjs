import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 및 개인정보처리방침 | 도배르만",
  description: "도배르만 서비스 이용약관, 개인정보처리방침 및 쿠키 정책을 확인하실 수 있습니다.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
