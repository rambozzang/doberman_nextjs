import { ReactNode } from 'react';

interface BossPlaceholderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

// 백엔드 API 명세 확정 전까지의 임시 페이지 — Industry 패턴
// 화면 제목은 셸 헤더(PAGE_META)가 그리므로 여기서는 h1 을 두지 않고
// "준비 중" kicker 를 단 패널 한 장으로 자리를 잡는다.
export default function BossPlaceholder({ title, description, children }: BossPlaceholderProps) {
  return (
    <section className="boss-card p-5">
      <p className="boss-kicker">준비 중</p>
      <h2 className="boss-section-title">{title}</h2>
      {description && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">{description}</p>
      )}

      <div className="mt-4 border-t border-boss-border pt-4">
        {children ?? (
          <div className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-boss-text-secondary">
            <p>이 화면은 백엔드 API 명세가 확정되면 본 구현이 들어갑니다.</p>
            <p>지금은 라우팅과 레이아웃이 정상 동작하는지 확인하기 위한 자리입니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
