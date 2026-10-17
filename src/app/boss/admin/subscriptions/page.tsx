import type { Metadata } from 'next';
import BillingRecords from '@/components/boss/platform-admin/BillingRecords';

export const metadata: Metadata = { title: '구독 기록' };

export default function Page() {
  return <BillingRecords kind="subscriptions" />;
}
