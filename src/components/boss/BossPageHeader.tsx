import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface BossPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
}

// 본문 안 구획 헤더 — Industry 패턴
// 화면 제목(26px)은 셸 헤더가 그린다. 이 조각은 셸이 알 수 없는 동적 제목(채팅방 이름 등)을
// 본문 맨 위에 둘 때만 쓴다 — 그래서 h1 이 아니라 20px h2 다.
export default function BossPageHeader({ title, description, backHref, actions }: BossPageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="mt-0.5 grid h-7 w-7 flex-none place-items-center border border-boss-border bg-boss-bg !text-boss-text-dim transition-colors duration-[120ms] ease-out hover:border-boss-border-hover hover:!text-boss-text"
            aria-label="뒤로"
          >
            <ChevronLeft size={15} strokeWidth={1.75} />
          </Link>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-boss-head text-[20px] font-semibold leading-tight tracking-[0.01em] text-boss-text">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-boss-text-secondary">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
