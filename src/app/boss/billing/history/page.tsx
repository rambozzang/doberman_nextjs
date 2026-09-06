'use client';

// 결제 내역 — Industry 패턴. 표는 HistoryView 가 그리고 제목은 헤더(PAGE_META)가 담당한다.
import HistoryView from '../HistoryView';

export default function BillingHistoryPage() {
  return (
    <HistoryView
      title="결제 내역"
      emptyDescription="플랜을 신청하면 결제 · 환불 기록이 여기에 쌓입니다. 요금제 화면에서 플랜을 골라보세요."
    />
  );
}
