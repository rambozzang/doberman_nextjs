import type { Metadata } from 'next';
import AdminMembers from '@/components/boss/admin/AdminMembers';

export const metadata: Metadata = { title: '회원 관리' };

export default function PlatformAdminMembersPage() {
  return <AdminMembers />;
}
