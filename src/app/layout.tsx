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
  title: {
    default: "도배 견적 | 전국 300+ 검증된 도배 전문가 무료 견적",
    template: "%s | 도배르만 - 도배 견적 비교 플랫폼"
  },
  description: "도배 견적 비교 | 전국 300명+ 검증된 도배 전문가 | 아파트·빌라·오피스텔 도배 견적 | 도배 시공 가격 비교",
  keywords: "도배 견적, 도배 견적 비교, 도배 비교견적, 도배 가격, 도배 비용, 도배 시공, 벽지 교체, 벽지 교체 견적, 아파트 도배, 빌라 도배, 오피스텔 도배, 도배 전문가, 도배 업체, 도배 시세, 합지벽지, 실크벽지, 천연벽지, 수입벽지, 도배 방법, 도배 종류, 저렴한 도배, 도배 공사, 인테리어 도배, 도배르만, 도배 견적 사이트, 무료 도배 견적, 24평 도배 견적, 32평 도배 견적, 도배 평당 가격",
  authors: [{ name: "도배르만" }],
  creator: "도배르만",
  publisher: "도배르만",
  category: "Business & Services",
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
    title: "도배 견적  | 전국 300+ 검증된 도배 전문가 무료 매칭 | 도배 비교 견적",
    description: "도배 견적 비교 | 전국 300명+ 검증된 도배 전문가 | 아파트·빌라·오피스텔 도배 견적 | 도배 시공 가격 비교",
    type: "website",
    locale: "ko_KR",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://www.doberman.kr",
    siteName: "도배르만 - 도배 견적 비교 플랫폼",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배르만 - 도배 견적 비교 전문 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도배 견적 비교 | 전국 300+ 검증된 도배 전문가",
    description: "도배 견적 비교! 24시간 내 최대 5개 견적 | 전국 300명+ 검증 전문가 | 아파트·빌라·오피스텔 도배",
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
      canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://www.doberman.kr",
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="도배르만" />
        <meta name="application-name" content="도배르만" />
        <meta name="msapplication-TileColor" content="#1e293b" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="referrer" content="origin-when-cross-origin" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="geo.region" content="KR" />
        <meta name="geo.country" content="Korea" />
        <meta name="geo.placename" content="Seoul" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="1 days" />
        <meta name="expires" content="never" />
        <meta name="cache-control" content="public" />
        <meta name="naver-site-verification" content="8a8f1fd238cdf6738ea971dfcc060431b50f8fd8" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr'} />
        <link rel="alternate" hrefLang="ko" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://www.doberman.kr'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//pagead2.googlesyndication.com" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "도배르만",
              "alternateName": "도배 견적 비교 플랫폼",
              "description": "전국 300명 이상의 검증된 도배 전문가들과 함께하는 무료 비교견적 플랫폼. 아파트·빌라·오피스텔 도배 견적, 벽지 교체 시공까지 한 번에!",
              "url": "https://www.doberman.kr",
              "logo": "https://www.doberman.kr/logo.png",
              "image": "https://www.doberman.kr/logo.png",
              "priceRange": "무료",
              "telephone": "",
              "email": "",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "KR",
                "addressRegion": "서울특별시"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "37.5665",
                "longitude": "126.9780"
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "00:00",
                "closes": "23:59"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "도배 서비스",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "아파트 도배 견적",
                      "description": "아파트 도배 전문 견적 서비스"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "벽지 교체 견적",
                      "description": "벽지 교체 전문 견적 서비스"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "도배 시공",
                      "description": "전문 도배 시공 서비스"
                    }
                  }
                ]
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.doberman.kr/quote-request?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "sameAs": [],
              "areaServed": [
                {
                  "@type": "City",
                  "name": "서울특별시"
                },
                {
                  "@type": "City",
                  "name": "경기도"
                },
                {
                  "@type": "City",
                  "name": "인천광역시"
                },
                {
                  "@type": "City",
                  "name": "부산광역시"
                },
                {
                  "@type": "City",
                  "name": "대구광역시"
                },
                {
                  "@type": "City",
                  "name": "대전광역시"
                },
                {
                  "@type": "City",
                  "name": "광주광역시"
                },
                {
                  "@type": "City",
                  "name": "울산광역시"
                },
                {
                  "@type": "Country",
                  "name": "대한민국"
                }
              ]
            })
          }}
        />
        <Script async
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7861255216779015`}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`}
      >
        <QueryProvider>
          <GlobalProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>

            <AdSense adSlot="1234567890" />

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

            <Script
              src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GA_MEASUREMENT_ID');
              `}
            </Script>

            <Script
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />

            <Script
              type="text/javascript"
              src="//wcs.naver.net/wcslog.js"
              strategy="afterInteractive"
            />
            <Script id="naver-analytics" strategy="afterInteractive">
              {`
                if(!wcs_add) var wcs_add = {};
                wcs_add["wa"] = "YOUR_NAVER_ANALYTICS_ID";
                if(window.wcs) {
                  wcs_do();
                }
              `}
            </Script>

            <Script id="kakao-pixel" strategy="afterInteractive">
              {`
                !function(e,n,t,a,c,o,s){e.fbq||(c=e.fbq=function(){c.callMethod?c.callMethod.apply(c,arguments):c.queue.push(arguments)},e._fbq||(e._fbq=c),c.push=c,c.loaded=!0,c.version="2.0",c.queue=[],o=n.createElement(t),o.async=!0,o.src="https://connect.facebook.net/en_US/fbevents.js",s=n.getElementsByTagName(t)[0],s.parentNode.insertBefore(o,s))}(window,document,"script");
                fbq('init', 'YOUR_PIXEL_ID');
                fbq('track', 'PageView');
              `}
            </Script>

            <Script
              id="faq-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "도배 견적은 무료인가요?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "네, 저희 플랫폼을 통한 도배 견적 신청은 완전 무료입니다."
                      }
                    },
                    {
                      "@type": "Question", 
                      "name": "도배 견적을 받기까지 얼마나 걸리나요?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "도배 견적 신청 후 24시간 이내에 최대 3개의 견적을 받아보실 수 있습니다."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "도배 견적 비교는 어떻게 하나요?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "여러 도배 업체의 견적을 한 번에 비교하여 최적의 가격과 서비스를 선택할 수 있습니다."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "벽지 교체 견적도 받을 수 있나요?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "네, 벽지 교체 견적도 포함하여 도배 관련 모든 견적을 받아보실 수 있습니다."
                      }
                    }
                  ]
                })
              }}
            />

            <Script
              id="breadcrumb-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "도배르만",
                      "item": "https://www.doberman.kr"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "견적신청",
                      "item": "https://www.doberman.kr/quote-request"
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": "견적 비교",
                      "item": "https://www.doberman.kr/quote-request/list"
                    }
                  ]
                })
              }}
            />
          </GlobalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
