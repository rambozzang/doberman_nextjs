import { Metadata } from "next";

// 실제로는 API에서 게시글 데이터를 가져와야 함
async function getPost(id: string) {
  // 임시 데이터 - 실제로는 API 호출
  return {
    id: parseInt(id),
    title: "아파트 도배 시공 후기 - 강남구 타워팰리스",
    content: "3개월 전에 도배 시공을 완료했는데, 정말 만족스러운 결과였습니다...",
    author: "김도배",
    category: "시공후기",
    createdAt: "2024-01-15",
    tags: ["아파트", "강남구", "시공후기", "만족"],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  
  return {
    title: post.title,
    description: `${post.content.substring(0, 150)}...`,
    keywords: [
      ...post.tags,
      "도배후기",
      "시공후기",
      "도배경험",
      "벽지시공",
    ],
    openGraph: {
      title: `${post.title} | 도배르만`,
      description: `${post.content.substring(0, 150)}...`,
      url: `/board/${post.id}`,
      type: "article",
      publishedTime: post.createdAt,
      authors: [post.author],
      section: post.category,
      tags: post.tags,
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | 도배르만`,
      description: `${post.content.substring(0, 150)}...`,
    },
    alternates: {
      canonical: `/board/${post.id}`,
    },
  };
}

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 