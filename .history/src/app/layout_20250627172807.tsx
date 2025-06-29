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
  keywords: "도배, 도배업체, 도배견적, 비교견적, 무료견적, 도배전문가, 인테리어, 벽지",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "도배 비교견적 | 전국 200+ 전문가 무료 견적 서비스",
    description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "도배 비교견적 서비스",
    "description": "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼",
    "serviceType": "도배 견적 서비스",
    "areaServed": "대한민국",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "도배 서비스",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "무료 도배 견적",
            "description": "전문가 매칭을 통한 무료 도배 견적 서비스"
          }
        }
      ]
    }
  };

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#1e293b" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://doberman.com'} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000`}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <GlobalProvider>
            <Header />
            <main className="min-h-screen">
              <div className="flex max-w-screen-2xl mx-auto px-4">
                <aside className="hidden lg:block w-40 xl:w-48 sticky top-20 h-screen p-2 flex-shrink-0">
                  <AdSense adSlot="1111111111" />
                </aside>
                <div className="flex-1 min-w-0">
                  {children}
                </div>
                <aside className="hidden lg:block w-40 xl:w-48 sticky top-20 h-screen p-2 flex-shrink-0">
                  <AdSense adSlot="2222222222" />
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
