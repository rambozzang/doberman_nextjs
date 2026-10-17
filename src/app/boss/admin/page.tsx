import type { Metadata } from 'next';
import AdminOverview from '@/components/boss/admin/AdminOverview';

export const metadata: Metadata = { title: '운영 개요' };

export default function PlatformAdminOverviewPage() {
  return <AdminOverview />;
}
