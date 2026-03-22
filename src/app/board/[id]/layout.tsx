import { Metadata } from "next";

// 이 함수는 실제 API 연동 시 게시글 정보를 가져와서 메타데이터를 생성합니다.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  
  // 현재는 샘플 데이터를 사용하므로 하드코딩된 예시를 반환합니다.
  // 실제 구현 시: const post = await getPost(id);
  
  return {
    title: `게시글 상세 정보 | 도배 커뮤니티`,
    description: `도배르만 커뮤니티의 ${id}번 게시글 상세 내용입니다. 시공 후기 및 다양한 정보를 확인하세요.`,
    openGraph: {
      title: `게시글 상세 정보 | 도배르만`,
      description: "도배 전문가와 고객이 함께하는 정보 공유 공간",
    },
  };
}

export default function PostDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
