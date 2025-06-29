'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { GlobalProvider } from "@/providers/GlobalProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <div className="flex h-screen bg-slate-900">
              {/* 사이드바 */}
              <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
              />
              
              {/* 메인 콘텐츠 영역 */}
              <div className="flex-1 flex flex-col lg:ml-64">
                {/* 헤더 */}
                <Header onMenuClick={() => setSidebarOpen(true)} />
                
                {/* 메인 콘텐츠 */}
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
                
                {/* 푸터 */}
                <Footer />
              </div>
            </div>
          </GlobalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
