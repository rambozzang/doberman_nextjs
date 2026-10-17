import type { Metadata } from 'next';
import PublicNotices from '@/components/boss/notices/PublicNotices';

export const metadata: Metadata = { title: '공지사항' };

export default function NoticesPage() {
  return <PublicNotices />;
}
