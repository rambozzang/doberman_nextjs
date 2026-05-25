"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { ChatNotificationFAB } from "@/components/chat";

// /boss/* 라우트에서는 고객용 Header/Footer 를 렌더링하지 않는다.
// boss 영역은 BossHeader + BossSidebar 로 별도 chrome 을 사용한다.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBoss = pathname?.startsWith("/boss") ?? false;

  if (isBoss) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatNotificationFAB />
    </>
  );
}
