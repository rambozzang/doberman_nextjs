import type { Metadata } from 'next';
import AdminAudit from '@/components/boss/admin/AdminAudit';

export const metadata: Metadata = { title: '변경 이력' };

export default function Page() {
  return <AdminAudit />;
}
