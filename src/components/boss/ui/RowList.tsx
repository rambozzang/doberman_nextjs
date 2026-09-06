'use client';

// 사장님 영역 공용 컴팩트 행 리스트 (RowList) — Industry 패턴
// - 한 줄/두 줄 행을 촘촘하게 나열하는 모바일 친화적 리스트
// - 행 우측에 인라인 빠른 액션(버튼)을 둬 조작을 줄임
// - 패널(테두리 + #f5f5f8) 안의 행, hover 는 accent-100

import { type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, ImageOff } from 'lucide-react';

// ───────────────────────────────────────────
// RowList — 컨테이너
// ───────────────────────────────────────────
export function RowList({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`boss-card-content divide-y divide-boss-border-row ${className}`}>{children}</div>;
}

// ───────────────────────────────────────────
// RowThumb — 좌측 썸네일/아이콘 (사각)
// ───────────────────────────────────────────
export function RowThumb({
  src,
  alt = '',
  icon: Icon,
  className = '',
}: {
  src?: string | null;
  alt?: string;
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border border-boss-border bg-boss-bg text-boss-text-muted ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : Icon ? (
        <Icon size={18} strokeWidth={1.5} />
      ) : (
        <ImageOff size={18} strokeWidth={1.5} />
      )}
    </div>
  );
}

// ───────────────────────────────────────────
// RowItem — 단일 행
// ───────────────────────────────────────────
type RowItemProps = {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tags?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function RowItem({
  href,
  onClick,
  leading,
  title,
  subtitle,
  tags,
  meta,
  actions,
  className = '',
}: RowItemProps) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-boss-text">{title}</p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[12.5px] text-boss-text-secondary">{subtitle}</p>
        )}
        {tags && <div className="mt-1.5 flex flex-wrap items-center gap-1">{tags}</div>}
      </div>
    </>
  );

  const main = href ? (
    <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 !text-boss-text">
      {body}
    </Link>
  ) : onClick ? (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
    >
      {body}
    </div>
  ) : (
    <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
  );

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-boss-elevated sm:px-5 ${className}`}
    >
      {main}

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        {meta && (
          <div className="text-right font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
            {meta}
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// RowAction — 우측 인라인 액션 버튼 (참조 ghost / secondary)
// ───────────────────────────────────────────
export function RowAction({
  icon: Icon,
  label,
  href,
  onClick,
  variant = 'ghost',
  hideLabel = false,
}: {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'ghost' | 'primary';
  hideLabel?: boolean;
}) {
  const cls = `boss-btn boss-btn-sm ${variant === 'primary' ? 'boss-btn-secondary' : 'boss-btn-ghost'}`;
  const inner = (
    <>
      {Icon && <Icon size={13} strokeWidth={1.75} />}
      {!hideLabel && <span>{label}</span>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {inner}
    </button>
  );
}

// ───────────────────────────────────────────
// RowChevron — 상세 이동 표시
// ───────────────────────────────────────────
export function RowChevron() {
  return (
    <ChevronRight
      size={16}
      strokeWidth={1.75}
      className="shrink-0 text-boss-text-ghost transition-colors group-hover:text-boss-text-secondary"
    />
  );
}
