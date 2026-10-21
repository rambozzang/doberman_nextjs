// 세금계산서 시작 전 준비 안내 — 정적 화면이라 서버 컴포넌트다. API · 개인정보 · 저장소를 쓰지 않는다.
//
// 화면 제목(시작 전 준비 안내)과 ← 세금계산서 링크는 헤더(PAGE_META)가 그린다.
// 목록의 발급 서비스 등록 진입에서 들어온다. 등록 화면은 작성 중인 신청서를 지키려고
// 이 화면으로 옮기지 않고 같은 본문(PreparationGuide)을 대화상자로 띄운다.

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PreparationGuide from '@/components/boss/taxinvoice/PreparationGuide';

export const metadata: Metadata = { title: '시작 전 준비 안내' };

export default function TaxInvoiceGuidePage() {
  return (
    <section className="boss-tax boss-card p-5 sm:p-6">
      <PreparationGuide
        cta={
          <div>
            <Link
              href="/boss/tax-invoice/registration"
              className="boss-btn boss-btn-md boss-btn-primary min-h-[44px] w-full whitespace-normal break-keep px-5 text-[15px] sm:w-auto"
            >
              준비됐어요, 등록하기
              <ArrowRight aria-hidden size={15} strokeWidth={1.75} />
            </Link>
          </div>
        }
      />
    </section>
  );
}
