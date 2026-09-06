// 시작하기(온보딩 가이드) — Industry 패턴
//
//   환영 패널(kicker + 17px 제목 + 설명) → 단계 행 리스트(패널 안 사각 행: 번호 타일 + 제목 + 설명 + ›)
//   → 하단 안내 패널. 정적 가이드라 서버 컴포넌트다. 화면 제목은 헤더(PAGE_META)가 그린다.
//
// Flutter 원본: lib/app/login/ (signup_page 흐름) + lib/app/setting/main_page (메뉴 안내)

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Step = {
  no: number;
  title: string;
  description: string;
  href: string;
};

const STEPS: Step[] = [
  {
    no: 1,
    title: '회원가입 및 본인 인증',
    description: '휴대폰 인증으로 사장님 계정을 안전하게 만들어주세요.',
    href: '/boss/signup',
  },
  {
    no: 2,
    title: '회사 정보 등록',
    description: '사업자등록번호, 회사명, 로고를 등록해 견적서 브랜딩을 완성하세요.',
    href: '/boss/onboarding/company',
  },
  {
    no: 3,
    title: '첫 견적서 작성',
    description: '템플릿을 활용해 5분 안에 견적서를 만들어 고객에게 공유해보세요.',
    href: '/boss/estimate',
  },
  {
    no: 4,
    title: '현장 일정 관리',
    description: '캘린더에 시공 일정을 등록하고 알림을 받아보세요.',
    href: '/boss/calendar',
  },
  {
    no: 5,
    title: '결제 / 정산 설정',
    description: '계약금, 중도금, 잔금 단계별 정산을 손쉽게 관리하세요.',
    href: '/boss/billing',
  },
  {
    no: 6,
    title: '고객 관리 시작',
    description: '고객 정보와 상담 이력을 한 곳에서 관리해 재방문을 늘리세요.',
    href: '/boss/customers',
  },
];

export default function BossOnboardingPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="boss-card p-5">
        <p className="boss-kicker">환영합니다</p>
        <h2 className="boss-section-title">도배르만 사장님 센터에 오신 것을 환영합니다</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
          아래 여섯 단계를 순서대로 따라가면 견적 · 일정 · 결제 · 고객 관리를 한 번에 시작할 수
          있습니다. 각 행을 누르면 해당 화면으로 이동합니다.
        </p>
      </section>

      <ol className="boss-card-content divide-y divide-boss-border-row">
        {STEPS.map(({ no, title, description, href }) => (
          <li key={no}>
            <Link
              href={href}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors duration-[120ms] ease-out hover:bg-boss-elevated"
            >
              <span
                aria-hidden
                className="grid h-9 w-9 flex-none place-items-center bg-boss-rail font-boss-head text-[16px] font-semibold text-boss-surface"
              >
                {no}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold !text-boss-text">{title}</span>
                <span className="mt-[3px] block text-[12.5px] leading-[1.55] !text-boss-text-secondary">
                  {description}
                </span>
              </span>
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                className="flex-none text-boss-text-ghost transition-colors group-hover:text-boss-text-secondary"
              />
            </Link>
          </li>
        ))}
      </ol>

      <section className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <p className="text-[12.5px] text-boss-text-secondary">
          이미 가이드를 마쳤다면 도움말에서 화면별 사용법과 FAQ 를 확인하세요.
        </p>
        <Link href="/boss/help" className="boss-btn boss-btn-sm boss-btn-secondary">
          도움말 열기
        </Link>
      </section>
    </div>
  );
}
