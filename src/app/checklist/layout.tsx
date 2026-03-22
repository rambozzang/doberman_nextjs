import { Metadata } from "next";

export const metadata: Metadata = {
  title: "도배 시공 체크리스트 | 완벽한 시공을 위한 필수 가이드",
  description: "도배 시공 전후로 반드시 확인해야 할 사항들을 체크리스트로 정리했습니다. 실패 없는 도배 시공을 위한 전문가의 가이드를 확인하세요.",
  keywords: "도배 체크리스트, 도배 준비사항, 도배 검수, 도배 시공 가이드, 벽지 교체 체크리스트",
  openGraph: {
    title: "도배 시공 체크리스트 | 도배르만",
    description: "실패 없는 도배 시공을 위한 필수 체크리스트",
  },
};

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
