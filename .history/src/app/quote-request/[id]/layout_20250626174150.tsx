import { Metadata } from "next";

// 실제로는 API에서 견적 요청 데이터를 가져와야 함
async function getQuoteRequest(id: string) {
  // 임시 데이터 - 실제로는 API 호출
  return {
    id: parseInt(id),
    buildingType: "[아파트/빌라]",
    constructionLocation: "[거실], [방 2개]",
    area: "25평",
    wallpaper: "[실크벽지]",
    region: "서울특별시",
    status: "견적 대기중",
    createdAt: "2024-01-15",
  };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const quote = await getQuoteRequest(params.id);
  
  const title = `${quote.buildingType} ${quote.area} 도배 견적 요청`;
  const description = `${quote.region} ${quote.buildingType} ${quote.area} ${quote.wallpaper} 도배 견적 요청 상세 정보입니다. 현재 상태: ${quote.status}`;
  
  return {
    title,
    description,
    keywords: [
      "도배견적",
      "견적요청",
      "도배비용",
      quote.region.replace("특별시", "").replace("광역시", ""),
      quote.buildingType.replace(/[\[\]]/g, ""),
      quote.wallpaper.replace(/[\[\]]/g, ""),
    ],
    openGraph: {
      title: `${title} | 도배르만`,
      description,
      url: `/quote-request/${quote.id}`,
      type: "article",
      publishedTime: quote.createdAt,
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 도배르만`,
      description,
    },
    alternates: {
      canonical: `/quote-request/${quote.id}`,
    },
    robots: {
      index: false, // 개인 견적 정보는 검색 엔진에 노출하지 않음
      follow: true,
    },
  };
}

export default function QuoteRequestDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 