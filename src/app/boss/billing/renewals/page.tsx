'use client';

// 갱신 관리 — Industry 패턴. 표는 HistoryView 가 그리고 제목은 헤더(PAGE_META)가 담당한다.
// 갱신 기록은 결제 내역과 같은 API(getHistory)를 본다 — 별도 갱신 API 는 없다.
import HistoryView from '../HistoryView';

export default function BillingRenewalsPage() {
  return (
    <HistoryView
      title="갱신 기록"
      emptyDescription="자동 갱신이 한 번이라도 실행되면 여기에 기록됩니다. 다음 갱신일은 구독 상태 화면의 만료일과 같습니다."
    />
  );
}
