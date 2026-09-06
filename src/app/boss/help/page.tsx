// 도움말 허브 — Industry 패턴
//
//   안내 패널(kicker + 17px 제목 + 설명) → 링크 행 리스트(패널 안 사각 행: 제목 13.5px 600 + 설명 12.5px + ›)
//   → 고객센터 패널(운영 시간 + 전화 버튼). 정적 화면이라 서버 컴포넌트다.
//   화면 제목은 헤더(PAGE_META)가 그린다.
//
// Flutter 참조: lib/app/setting/ (faq, service, privecy 등 setting 메뉴 모음)

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type HelpLink = {
  href: string;
  title: string;
  description: string;
};

const HELP_LINKS: HelpLink[] = [
  {
    href: '/boss/help/faq',
    title: '자주 묻는 질문',
    description: '가입 · 견적서 · 결제 · 탈퇴처럼 가장 많이 묻는 질문과 답',
  },
  {
    href: '/boss/onboarding',
    title: '시작 가이드',
    description: '처음 쓰는 사장님을 위한 여섯 단계 안내',
  },
  {
    href: '/boss/help/terms',
    title: '서비스 이용약관',
    description: '서비스를 이용하기 위한 약관 전문',
  },
  {
    href: '/boss/help/privacy',
    title: '개인정보 처리방침',
    description: '개인정보를 어떻게 수집 · 이용 · 보관하는지',
  },
  {
    href: '/boss/help/marketing',
    title: '마케팅 정보 수신',
    description: '수신 동의로 받는 혜택과 철회 방법',
  },
];

export default function BossHelpPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="boss-card p-5">
        <p className="boss-kicker">도움말</p>
        <h2 className="boss-section-title">무엇을 도와드릴까요?</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
          사용 방법 · 결제 · 계정 관련 질문은 아래 항목에서 찾아보세요. 해결되지 않으면 고객센터로
          연락해주세요.
        </p>
      </section>

      <div className="boss-card-content">
        {HELP_LINKS.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3.5 border-b border-boss-border-row px-5 py-3.5 transition-colors duration-[120ms] ease-out last:border-b-0 hover:bg-boss-elevated"
          >
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
        ))}
      </div>

      <section className="boss-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="boss-kicker">고객센터</p>
          <p className="mt-1 text-[13.5px] font-semibold text-boss-text">
            평일 09:00 – 18:00 <span className="font-normal text-boss-text-secondary">(주말 · 공휴일 휴무)</span>
          </p>
          <p className="mt-[3px] text-[12.5px] text-boss-text-secondary">
            앱 안 1:1 문의도 같은 시간에 답합니다.
          </p>
        </div>
        <a href="tel:1600-0000" className="boss-btn boss-btn-md boss-btn-secondary font-boss-head tabular-nums">
          1600-0000
        </a>
      </section>
    </div>
  );
}
