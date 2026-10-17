import type { Metadata } from 'next';
import AdminReports from '@/components/boss/admin/AdminReports';

export const metadata: Metadata = { title: '신고 처리' };

export default function PlatformAdminReportsPage() {
  return <AdminReports />;
}
