'use client';

import { Receipt } from 'lucide-react';
import HistoryView from '../HistoryView';

export default function BillingHistoryPage() {
  return (
    <HistoryView
      title="결제 내역"
      description="모든 결제 및 환불 내역을 확인하세요."
      breadcrumbLabel="결제 내역"
      icon={Receipt}
    />
  );
}
