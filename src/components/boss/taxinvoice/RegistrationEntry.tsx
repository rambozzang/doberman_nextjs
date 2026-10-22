'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, ShieldCheck } from 'lucide-react';
import { ButtonLink, Tag, type StatusTone } from '@/components/boss/ui';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { useElectronicTaxInvoiceLaunch } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { TAX_SUBSCRIPTION_PRICE } from '@/lib/boss/taxInvoiceSubscription';
import { REGISTRATION_STAGE_LABEL, type RegistrationStage } from '@/types/boss-taxinvoice';

// 등록 단계 표시 색 — 준비 완료만 초록, 반려는 빨강, 나머지는 할 일이 남은 상태
const STAGE_TONE: Record<RegistrationStage, StatusTone> = {
  NEED_COMPANY: 'warn',
  NOT_REGISTERED: 'neutral',
  PENDING_VERIFICATION: 'info',
  REJECTED: 'bad',
  VERIFIED: 'warn',
  NEEDS_CERTIFICATE: 'warn',
  READY: 'ok',
};

// 세금계산서 목록 맨 위 — 발급 서비스 등록 진입 · 시작 전 준비 안내 진입.
// 출시 값 · API 상태와 상관없이 늘 보인다. 오픈 뒤에는 운영 상태(서버가 팝빌 조회를 잠시 저장해 둔다)로 지금 등록 단계를 붙인다
// (2026-10-22 — 등록 · 인증서까지 마친 사장님에게도 "팝빌 연동을 마치면…" 준비 전 문구가 보였다). 못 읽으면 예전 문구 그대로.
// 사업자 정보 등록 · 권한 확인 신청은 정식 오픈 전에 미리 해 둘 수 있고, 팝빌 연동 · 인증서 등록은 연동 준비가 끝난 뒤다.
// 오픈 전에는 앱과 같은 "곧 정식 오픈" 문구를 함께 싣는다.
// 휴대폰(md 미만)은 한 줄 띠로 줄인다(2026-10-21 — 안내 카드 약 220px 때문에 첫 문서가 첫 화면 밖이었다).
//   오픈 전: 준비 안내로(안내 끝에 등록 단추가 있다) · 오픈 뒤: 발급 서비스 등록으로
export default function RegistrationEntry() {
  // 정식 오픈 여부는 서버가 정한다(2026-10-18). 현금영수증은 따로 연다(2026-10-21).
  const { taxOpen, cashOpen } = useElectronicTaxInvoiceLaunch();
  const open = taxOpen || cashOpen;
  const openedDocs = taxOpen && cashOpen ? '전자세금계산서 · 현금영수증' : taxOpen ? '전자세금계산서' : '현금영수증';
  const scope = useBossScope();
  // 지금 계정의 등록 단계(모르면 null)
  const [stage, setStage] = useState<RegistrationStage | null>(null);
  useEffect(() => {
    setStage(null);
    if (!open || !scope) return;
    let alive = true;
    void bossTaxInvoiceApi.operations().then((r) => {
      if (alive && isCurrentScope(scope) && r.ok) setStage(r.data.registration?.stage ?? null);
    });
    return () => {
      alive = false;
    };
  }, [open, scope]);
  const ready = stage === 'READY';
  return (
    <>
      <Link
        href={open ? '/boss/tax-invoice/registration' : '/boss/tax-invoice/guide'}
        className="boss-card flex min-h-[44px] items-center gap-2 px-4 py-2.5 !text-boss-text active:bg-boss-elevated md:hidden"
      >
        {!open && <Tag tone="info">오픈 예정</Tag>}
        {open && stage && <Tag tone={STAGE_TONE[stage]}>{REGISTRATION_STAGE_LABEL[stage]}</Tag>}
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
          {open ? (ready ? `${openedDocs} 발급 준비 완료` : `${openedDocs} 발급 서비스 등록`) : '전자 발급, 곧 정식 오픈 · 준비 안내'}
        </span>
        <ChevronRight size={16} strokeWidth={1.75} className="flex-none text-boss-text-muted" aria-hidden />
      </Link>
      <section
        aria-labelledby="tax-invoice-registration-entry"
        className="boss-card hidden flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 md:flex"
      >
        <div className="min-w-0 flex-1 basis-[260px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 id="tax-invoice-registration-entry" className="boss-section-title break-keep">
              {open ? `${openedDocs} 발급 서비스` : '전자 발급, 곧 정식 오픈합니다'}
            </h2>
            {!open && <Tag tone="info">오픈 예정</Tag>}
            {open && stage && <Tag tone={STAGE_TONE[stage]}>{REGISTRATION_STAGE_LABEL[stage]}</Tag>}
          </div>
          <p className="mt-1 break-keep text-[13px] leading-relaxed text-boss-text-secondary">
            {open && ready
              ? `등록을 모두 마쳤습니다. 문서 상세에서 '미리보기 · 발급'으로 바로 발급할 수 있습니다.${
                  taxOpen && !cashOpen ? ' 현금영수증 발급은 곧 열립니다.' : !taxOpen && cashOpen ? ' 전자세금계산서 발급은 곧 열립니다.' : ''
                }`
              : open
              ? `사업자 권한 확인 · 팝빌 연동을 마치면 상세에서 바로 발급할 수 있습니다. 세금계산서는 공동인증서 등록도 필요합니다.${
                  taxOpen && !cashOpen ? ' 현금영수증 발급은 곧 열립니다.' : !taxOpen && cashOpen ? ' 전자세금계산서 발급은 곧 열립니다.' : ''
                }`
              : '지금은 작성 · 서식 미리보기 · PDF와 발급 기록 관리를 쓸 수 있어요. 발급 서비스 등록은 미리 해 둘 수 있어요.'}
          </p>
          {/* 요금 한 줄(2026-10-17) — 자세한 내용은 시작 전 준비 안내. 현금영수증만 쓰면 첫 발급일부터(2026-10-21) */}
          <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">
            공동인증서를 등록한 날부터(현금영수증만 쓰면 첫 발급일부터) 1개월 무료 · 이후 {TAX_SUBSCRIPTION_PRICE} 앱 구독
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/boss/tax-invoice/guide" variant="secondary" size="sm" icon={BookOpen}>
            시작 전 준비 안내
          </ButtonLink>
          <ButtonLink href="/boss/tax-invoice/registration" variant="secondary" size="sm" icon={ShieldCheck}>
            {ready ? '발급 준비 · 구독 확인' : '발급 서비스 등록'}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
