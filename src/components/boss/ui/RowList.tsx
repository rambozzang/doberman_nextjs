'use client';

// 사장님 영역 공용 컴팩트 행 리스트 (RowList)
// - 한 줄/두 줄 행을 촘촘하게 나열하는 모바일 친화적 리스트
// - 행 우측에 인라인 빠른 액션(버튼)을 둬 조작을 줄임
// - 그리드 토글 없이 리스트가 기본 UI

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
  return (
    <div
      className={`divide-y divide-boss-border overflow-hidden rounded-lg border border-boss-border bg-boss-surface shadow-boss ${className}`}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────────────────
// RowThumb — 좌측 썸네일/아이콘
// ───────────────────────────────────────────
export function RowThumb({
  src,
  alt = '',
  icon: Icon,
  className = '',
}: {
  src?: string | null;
  alt?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-boss-elevated text-boss-text-muted ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : Icon ? (
        <Icon size={18} />
      ) : (
        <ImageOff size={18} />
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
        <p className="truncate text-sm font-medium text-boss-text">{title}</p>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-boss-text-muted">{subtitle}</p>
        )}
        {tags && <div className="mt-1.5 flex flex-wrap items-center gap-1">{tags}</div>}
      </div>
    </>
  );

  const main = href ? (
    <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
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
      className={`group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-boss-elevated/40 sm:px-4 sm:py-3 ${className}`}
    >
      {main}

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        {meta && <div className="text-right text-xs text-boss-text-muted">{meta}</div>}
        {actions && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// RowAction — 우측 인라인 액션 버튼
// ───────────────────────────────────────────
export function RowAction({
  icon: Icon,
  label,
  href,
  onClick,
  variant = 'ghost',
  hideLabel = false,
}: {
  icon?: React.ComponentType<{ size?: number }>;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'ghost' | 'primary';
  hideLabel?: boolean;
}) {
  const cls = `inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors ${
    variant === 'primary'
      ? 'bg-boss-primary/10 text-boss-primary hover:bg-boss-primary/20'
      : 'text-boss-text-secondary hover:bg-boss-elevated hover:text-boss-text'
  }`;
  const inner = (
    <>
      {Icon && <Icon size={13} />}
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
      className="shrink-0 text-boss-text-muted transition-colors group-hover:text-boss-text-secondary"
    />
  );
}
