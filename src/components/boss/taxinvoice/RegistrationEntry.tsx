import { ShieldCheck } from 'lucide-react';
import { ButtonLink, Tag } from '@/components/boss/ui';
import { ELECTRONIC_TAX_INVOICE_OPEN } from '@/lib/boss/electronicTaxInvoiceLaunch';

// 세금계산서 목록 맨 위 — 발급 서비스 등록 진입.
// 출시 값 · API 상태와 상관없이 늘 보인다(아무것도 부르지 않는다). 등록은 정식 오픈 전에 미리 마칠 수 있다.
// 오픈 전에는 앱과 같은 "곧 정식 오픈" 문구를 함께 싣는다.
export default function RegistrationEntry() {
  const open = ELECTRONIC_TAX_INVOICE_OPEN;
  return (
    <section
      aria-labelledby="tax-invoice-registration-entry"
      className="boss-card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4"
    >
      <div className="min-w-0 flex-1 basis-[260px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 id="tax-invoice-registration-entry" className="boss-section-title break-keep">
            {open ? '전자세금계산서 · 현금영수증 발급 서비스' : '전자세금계산서 · 현금영수증 발급, 곧 정식 오픈합니다'}
          </h2>
          {!open && <Tag tone="info">오픈 예정</Tag>}
        </div>
        <p className="mt-1 break-keep text-[13px] leading-relaxed text-boss-text-secondary">
          {open
            ? '사업자 권한 확인 · 팝빌 연동을 마치면 상세에서 바로 발급할 수 있습니다. 세금계산서는 공동인증서 등록도 필요합니다.'
            : '미리보기부터 발급까지 한 번에 처리할 수 있도록 준비하고 있습니다. 지금은 작성 · 실물 서식 미리보기 · PDF · 인쇄와 발행 기록 관리를 이용해 주세요.'}
        </p>
        {!open && (
          <p className="mt-1 break-keep text-[12px] leading-relaxed text-boss-text-muted">
            발급 서비스 등록(사업자 권한 확인 · 팝빌 연동 · 공동인증서)은 지금 미리 해 둘 수 있습니다. 정식 오픈 시 앱과 웹에서
            안내해 드리겠습니다.
          </p>
        )}
      </div>
      <ButtonLink href="/boss/tax-invoice/registration" variant="primary" size="sm" icon={ShieldCheck}>
        발급 서비스 등록
      </ButtonLink>
    </section>
  );
}
