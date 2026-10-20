'use client';

import { BookOpen, ShieldCheck } from 'lucide-react';
import { ButtonLink, Tag } from '@/components/boss/ui';
import { useElectronicTaxInvoiceLaunch } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { TAX_SUBSCRIPTION_PRICE } from '@/lib/boss/taxInvoiceSubscription';

// 세금계산서 목록 맨 위 — 발급 서비스 등록 진입 · 시작 전 준비 안내 진입.
// 출시 값 · API 상태와 상관없이 늘 보인다(아무것도 부르지 않는다).
// 사업자 정보 등록 · 권한 확인 신청은 정식 오픈 전에 미리 해 둘 수 있고, 팝빌 연동 · 인증서 등록은 연동 준비가 끝난 뒤다.
// 오픈 전에는 앱과 같은 "곧 정식 오픈" 문구를 함께 싣는다.
export default function RegistrationEntry() {
  // 정식 오픈 여부는 서버가 정한다(2026-10-18). 현금영수증은 따로 연다(2026-10-21).
  const { taxOpen, cashOpen } = useElectronicTaxInvoiceLaunch();
  const open = taxOpen || cashOpen;
  const openedDocs = taxOpen && cashOpen ? '전자세금계산서 · 현금영수증' : taxOpen ? '전자세금계산서' : '현금영수증';
  return (
    <section
      aria-labelledby="tax-invoice-registration-entry"
      className="boss-card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4"
    >
      <div className="min-w-0 flex-1 basis-[260px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 id="tax-invoice-registration-entry" className="boss-section-title break-keep">
            {open ? `${openedDocs} 발급 서비스` : '전자 발급, 곧 정식 오픈합니다'}
          </h2>
          {!open && <Tag tone="info">오픈 예정</Tag>}
        </div>
        <p className="mt-1 break-keep text-[13px] leading-relaxed text-boss-text-secondary">
          {open
            ? `사업자 권한 확인 · 팝빌 연동을 마치면 상세에서 바로 발급할 수 있습니다. 세금계산서는 공동인증서 등록도 필요합니다.${
                taxOpen && !cashOpen ? ' 현금영수증 발급은 곧 열립니다.' : ''
              }`
            : '지금은 작성 · 서식 미리보기 · PDF와 발급 기록 관리를 쓸 수 있어요. 발급 서비스 등록은 미리 해 둘 수 있어요.'}
        </p>
        {/* 요금 한 줄(2026-10-17) — 자세한 내용은 시작 전 준비 안내 */}
        <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">
          공동인증서를 등록한 날부터 1개월 무료 · 이후 {TAX_SUBSCRIPTION_PRICE} 앱 구독
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/boss/tax-invoice/guide" variant="secondary" size="sm" icon={BookOpen}>
          시작 전 준비 안내
        </ButtonLink>
        <ButtonLink href="/boss/tax-invoice/registration" variant="secondary" size="sm" icon={ShieldCheck}>
          발급 서비스 등록
        </ButtonLink>
      </div>
    </section>
  );
}
