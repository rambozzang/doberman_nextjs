import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { GlobalProvider } from "@/providers/GlobalProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

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
    default: "도배르만 - 전국 도배 전문가 비교견적 플랫폼",
    template: "%s | 도배르만"
  },
  description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼. 무료 견적, 투명한 가격, 품질보장으로 최고의 도배 서비스를 경험하세요.",
  keywords: [
    "도배",
    "도배업체",
    "도배견적",
    "벽지시공",
    "인테리어",
    "리모델링",
    "도배전문가",
    "도배비용",
    "도배가격",
    "벽지교체",
    "아파트도배",
    "주택도배",
    "상가도배",
    "도배비교견적"
  ],
  authors: [{ name: "도배르만" }],
  creator: "도배르만",
  publisher: "도배르만",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://doberman.co.kr"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "도배르만 - 전국 도배 전문가 비교견적 플랫폼",
    description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼. 무료 견적, 투명한 가격, 품질보장으로 최고의 도배 서비스를 경험하세요.",
    url: "https://doberman.co.kr",
    siteName: "도배르만",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "도배르만 로고",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "도배르만 - 전국 도배 전문가 비교견적 플랫폼",
    description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // 추후 Google Search Console, Naver 웹마스터 도구 등록 후 추가
    // google: "your-google-verification-code",
    // other: {
    //   "naver-site-verification": "your-naver-verification-code",
    // },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <GlobalProvider>
            <Header />
            <main className="min-h-screen">
              {children}
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
