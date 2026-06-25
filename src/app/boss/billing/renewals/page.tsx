'use client';

import { RefreshCw } from 'lucide-react';
import HistoryView from '../HistoryView';

export default function BillingRenewalsPage() {
  return (
    <HistoryView
      title="정기 갱신"
      description="구독 갱신 이력과 다음 갱신 정보를 확인하세요."
      breadcrumbLabel="정기 갱신"
      icon={RefreshCw}
    />
  );
}
