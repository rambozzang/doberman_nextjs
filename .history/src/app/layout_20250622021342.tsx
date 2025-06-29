'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { GlobalProvider } from "@/providers/GlobalProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <title>Doberman - Next.js App</title>
        <meta name="description" content="Modern Next.js application with Zustand and TanStack Query" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <GlobalProvider>
            <div className="min-h-screen bg-slate-900 flex flex-col">
              {/* 헤더 */}
              <Header />
              
              {/* 메인 콘텐츠 */}
              <main className="flex-1">
                {children}
              </main>
              
              {/* 푸터 */}
              <Footer />
            </div>
          </GlobalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
