import { Panel, Tag } from '@/components/boss/ui';
import { DOC_TYPE_LABEL, type TaxInvoiceDocType } from '@/types/boss-taxinvoice';

// 출시 값이 꺼져 있을 때 상세 우측에 보이는 안내 — 실제 발급 버튼 대신. 등록 준비가 끝났어도 발급은 열리지 않는다.
export default function ElectronicLaunchNotice({ docType = 'TAX' }: { docType?: TaxInvoiceDocType }) {
  const label = DOC_TYPE_LABEL[docType];
  return (
    <Panel kicker={`${label} · 전자 발급`} title={`전자 ${label} 발급, 곧 정식 오픈합니다`} right={<Tag tone="info">오픈 예정</Tag>}>
      <p className="text-[13px] leading-relaxed text-boss-text-secondary">
        미리보기부터 발급까지 한 번에 처리할 수 있도록 준비하고 있습니다. 지금은 작성 · 실물 서식 미리보기 · PDF · 인쇄와 발급 기록 관리를
        이용해 주세요.
      </p>
      <p className="mt-2 text-[12px] text-boss-text-secondary">
        발급 서비스 등록을 미리 마쳐도 실제 발급은 정식 오픈 후 열립니다. 오픈하면 앱과 웹에서 안내해 드리겠습니다.
      </p>
    </Panel>
  );
}
