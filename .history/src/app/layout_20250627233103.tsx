import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { GlobalProvider } from "@/providers/GlobalProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import AdSense from "@/components/AdSense";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "도배 비교견적 | 전국 200+ 전문가 무료 견적 서비스",
  description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼. 무료 견적 신청으로 최적의 도배 업체를 찾아보세요.",
  keywords: "도배, 도배업체, 도배견적, 비교견적, 무료견적, 도배전문가, 인테리어, 벽지, 도배맨, 도배공사, 벽지교체, 도배시공",
  authors: [{ name: "도배맨" }],
  creator: "도배맨",
  publisher: "도배맨",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "도배 비교견적 | 전국 200+ 전문가 무료 견적 서비스",
    description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼",
    type: "website",
    locale: "ko_KR",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://doberman.com",
    siteName: "도배맨",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배 비교견적 서비스 - 도배맨",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도배 비교견적 | 전국 200+ 전문가 무료 견적 서비스",
    description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼",
    images: ["/logo.png"],
    creator: "@doberman",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    ...(process.env.GOOGLE_VERIFICATION_ID && { google: process.env.GOOGLE_VERIFICATION_ID }),
    other: {
      ...(process.env.NAVER_VERIFICATION_ID && { 'naver-site-verification': process.env.NAVER_VERIFICATION_ID }),
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://doberman.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "도배 비교견적 서비스",
    "alternateName": "도배맨 - 전국 도배 전문가 매칭 플랫폼",
    "description": "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼. 무료 견적 신청으로 최적의 도배 업체를 찾아보세요.",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://www.doberman.kr",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "2.0",
    "inLanguage": "ko-KR",
    "availableLanguage": ["ko-KR"],
    "author": {
      "@type": "Organization",
      "name": "도배맨",
      "description": "전국 도배 전문가 매칭 서비스"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW",
      "description": "무료 견적 서비스"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "전국 200+ 검증된 도배 전문가",
      "무료 비교견적 서비스",
      "실시간 견적 매칭",
      "전문가 리뷰 시스템",
      "모바일 최적화",
      "24시간 고객지원",
      "지역별 전문가 검색",
      "견적서 비교 분석"
    ],
    "serviceType": "도배 견적 매칭 서비스",
    "areaServed": {
      "@type": "Country",
      "name": "대한민국"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "도배 서비스 카탈로그",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "주거용 도배",
            "description": "아파트, 빌라, 단독주택 도배 서비스"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "상업용 도배",
            "description": "사무실, 상가, 카페 등 상업공간 도배 서비스"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "리모델링 도배",
            "description": "전체 리모델링과 함께하는 도배 서비스"
          }
        }
      ]
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": (process.env.NEXT_PUBLIC_BASE_URL || "https://www.doberman.kr") + "/quote-request?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="도배맨" />
        <meta name="application-name" content="도배맨" />
        <meta name="msapplication-TileColor" content="#1e293b" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="referrer" content="origin-when-cross-origin" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="geo.region" content="KR" />
        <meta name="geo.country" content="Korea" />
        <meta name="language" content="Korean" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="1 days" />
        <meta name="expires" content="never" />
        <meta name="cache-control" content="public" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://doberman.com'} />
        <link rel="alternate" hrefLang="ko" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://doberman.com'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//pagead2.googlesyndication.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7861255216779015`}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <GlobalProvider>
            <Header />
            <main className="min-h-screen">
              <div className="container mx-auto p-2 text-center lg:hidden">
                <AdSense adSlot="9512171660" />
              </div>
              <div className="flex max-w-screen-2xl mx-auto px-4">
                <aside className="hidden lg:block w-40 xl:w-48 sticky top-20 h-screen p-2 flex-shrink-0">
                  <AdSense adSlot="3289813598" />
                </aside>
                <div className="flex-1 min-w-0">
                  {children}
                </div>
                <aside className="hidden lg:block w-40 xl:w-48 sticky top-20 h-screen p-2 flex-shrink-0">
                  <AdSense adSlot="5922063409" />
                </aside>
              </div>
            </main>
            <Footer />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #475569',
                },
                success: {
                  style: {
                    background: '#059669',
                  },
                },
                error: {
                  style: {
                    background: '#dc2626',
                  },
                },
              }}
            />
          </GlobalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
