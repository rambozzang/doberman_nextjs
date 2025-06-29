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
  title: "도배 비교견적 | 전국 200+ 전문가 무료 견적 서비스",
  description: "전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼. 무료 견적 신청으로 최적의 도배 업체를 찾아보세요.",
  keywords: "도배, 도배업체, 도배견적, 비교견적, 무료견적, 도배전문가, 인테리어, 벽지",
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
