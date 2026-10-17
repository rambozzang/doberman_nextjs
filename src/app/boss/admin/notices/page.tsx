import type { Metadata } from 'next';
import AdminNotices from '@/components/boss/admin/AdminNotices';

export const metadata: Metadata = { title: '공지 · 이벤트 관리' };

export default function PlatformAdminNoticesPage() {
  return <AdminNotices />;
}
