import type { Metadata } from 'next';
import AdminInquiries from '@/components/boss/admin/AdminInquiries';

export const metadata: Metadata = { title: '문의 처리' };

export default function PlatformAdminInquiriesPage() {
  return <AdminInquiries />;
}
