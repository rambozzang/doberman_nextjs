'use client';

// 나의 견적 — 웹견적 요청 화면의 "내가 답변함" 탭으로 합쳤다(2026-09-08).
//
// 같은 요청이 "웹견적 요청"과 "나의 견적" 두 메뉴에 나뉘어 있어
// 사장님이 "내가 답변했는지" 를 보려면 메뉴를 오가야 했다.
// 앱 · 알림 · 즐겨찾기에 남은 링크가 깨지지 않도록 이 주소는 남겨 두고 넘겨준다.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BossMyRequestsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/boss/requests?tab=answered');
  }, [router]);
  return null;
}
