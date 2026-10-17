import type { Metadata } from 'next';
import BillingRecords from '@/components/boss/platform-admin/BillingRecords';

export const metadata: Metadata = { title: '결제 기록' };

export default function Page() {
  return <BillingRecords kind="payments" />;
}
