import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { GlobalProvider } from "@/providers/GlobalProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://www.doberman.kr",
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
        <meta name="apple-mobile-web-app-title" content="도배맨" />
        <meta name="application-name" content="도배맨" />
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
              "@type": "WebApplication",
              "name": "도배 비교견적",
              "description": "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼",
              "url": "https://www.doberman.kr",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW",
                "description": "무료 견적 서비스"
              },
              "featureList": [
                "무료 견적 신청",
                "전문가 매칭",
                "비교견적 제공",
                "실시간 상담",
                "지역별 전문가 검색"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.doberman.kr/quote-request?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "provider": {
                "@type": "Organization",
                "name": "도배맨",
                "url": "https://www.doberman.kr",
                "logo": "https://www.doberman.kr/logo.png",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "availableLanguage": "Korean"
                }
              },
              "serviceArea": {
                "@type": "Country",
                "name": "대한민국"
              },
              "areaServed": "KR",
              "inLanguage": "ko-KR"
            })
          }}
        />
        <Script
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

            <AdSense />

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
                        "text": "네, 저희 플랫폼을 통한 견적 신청은 완전 무료입니다."
                      }
                    },
                    {
                      "@type": "Question", 
                      "name": "견적을 받기까지 얼마나 걸리나요?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "신청 후 24시간 이내에 최대 3개의 견적을 받아보실 수 있습니다."
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
                      "name": "홈",
                      "item": "https://www.doberman.kr"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "견적신청",
                      "item": "https://www.doberman.kr/quote-request"
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
