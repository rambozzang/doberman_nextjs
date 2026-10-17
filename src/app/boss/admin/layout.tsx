import type { Metadata } from 'next';
import PlatformAdminShell from '@/components/boss/admin/PlatformAdminShell';

// 도배르만 운영(대표 전용) — 하위 화면은 모두 이 껍데기 안에서 그려진다.
// 껍데기가 서버에 운영자인지 먼저 묻고, 운영자라고 답한 뒤에만 하위 화면(자료 요청)을 그린다.
// 화면 제목 · 머리글은 셸 헤더(nav.ts PAGE_META)가 그린다.
export const metadata: Metadata = {
  title: { default: '도배르만 운영', template: '%s | 도배르만 운영' },
};

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
