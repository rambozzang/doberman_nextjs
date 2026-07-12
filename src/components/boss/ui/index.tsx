'use client';

// 사장님 영역 공용 UI 프리미티브 — B2B 디자인 시스템 토큰 기반
// - light/dark 모두 지원
// - 정보 밀도 우선, 간격은 gap-2/3, 큰 여백은 섹션 사이에만
// - accent(emerald)는 활성/강조에만

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, ChevronRight, ChevronLeft, LayoutGrid, Rows3, Search, type LucideIcon } from 'lucide-react';

// ───────────────────────────────────────────
// Card
// ───────────────────────────────────────────
type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padded = true, interactive = false, className = '', children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-boss-border bg-boss-surface shadow-boss ${
        padded ? 'p-5' : ''
      } ${interactive ? 'transition-colors hover:border-boss-border-strong hover:bg-boss-elevated/50' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

// ───────────────────────────────────────────
// SectionHeader
// ───────────────────────────────────────────
export function SectionHeader({
  title,
  description,
  actions,
  size = 'sm',
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2
          className={`font-semibold text-boss-text ${
            size === 'md' ? 'text-base' : 'text-sm'
          }`}
        >
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-boss-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ───────────────────────────────────────────
// PageHeader — 상단 타이틀 영역
// ───────────────────────────────────────────
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <header className="mb-6 border-b border-boss-border pb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-[11px] text-boss-text-muted">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={11} className="text-boss-border-strong" />}
              {b.href ? (
                <Link href={b.href} className="hover:text-boss-text-secondary">
                  {b.label}
                </Link>
              ) : (
                <span>{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-boss-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-boss-text md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-boss-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

// ───────────────────────────────────────────
// Button
// ───────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-boss-primary text-boss-primary-foreground hover:bg-boss-primary-hover disabled:bg-boss-elevated disabled:text-boss-text-muted',
  secondary:
    'border border-boss-border bg-boss-elevated text-boss-text-secondary hover:border-boss-border-strong hover:bg-boss-surface hover:text-boss-text',
  ghost: 'text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text',
  danger: 'bg-boss-error text-white hover:bg-red-600',
};
const BTN_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export function Button({
  variant = 'secondary',
  size = 'sm',
  icon: Icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-boss-primary/20 disabled:cursor-not-allowed ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}

// ───────────────────────────────────────────
// StatCard — 대시보드 메트릭
// ───────────────────────────────────────────
export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-boss-border bg-boss-surface p-4 shadow-boss transition-colors hover:border-boss-border-strong">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-boss-text-muted">{label}</p>
        {Icon && <Icon size={14} className="text-boss-text-muted" />}
      </div>
      {loading ? (
        <div className="h-7 w-24 animate-pulse rounded bg-boss-elevated" />
      ) : (
        <p className="font-mono text-2xl font-semibold tabular-nums text-boss-text">{value}</p>
      )}
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        {delta !== undefined && !loading && (
          <span
            className={`flex items-center gap-0.5 font-medium ${
              positive ? 'text-boss-success' : 'text-boss-error'
            }`}
          >
            {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-boss-text-muted">{hint}</span>}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// EmptyState
// ───────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="boss-empty text-center">
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-boss-elevated text-boss-text-muted">
          <Icon size={18} />
        </div>
      )}
      <p className="text-sm font-medium text-boss-text-secondary">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-boss-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ───────────────────────────────────────────
// Badge
// ───────────────────────────────────────────
type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
const BADGE_TONES: Record<BadgeTone, string> = {
  default: 'bg-boss-elevated text-boss-text-secondary ring-boss-border',
  emerald: 'bg-boss-primary/10 text-boss-primary ring-boss-primary/20',
  sky: 'bg-boss-info/10 text-boss-info ring-boss-info/20',
  amber: 'bg-boss-warning/10 text-boss-warning ring-boss-warning/20',
  rose: 'bg-boss-error/10 text-boss-error ring-boss-error/20',
  violet: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
};

export function Badge({
  tone = 'default',
  children,
  className = '',
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ───────────────────────────────────────────
// Toolbar (필터/액션바)
// ───────────────────────────────────────────
export function Toolbar({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-boss-border bg-boss-surface px-3 py-2 shadow-boss ${className}`}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────────────────
// SearchInput
// ───────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder = '검색',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-boss-border bg-boss-bg pl-9 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
      />
    </div>
  );
}

// ───────────────────────────────────────────
// IconButton
// ───────────────────────────────────────────
export function IconButton({
  icon: Icon,
  label,
  active,
  ...rest
}: {
  icon: LucideIcon;
  label?: string;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-boss-primary/20 disabled:opacity-50 ${
        active
          ? 'border-boss-border bg-boss-elevated text-boss-primary'
          : 'border-boss-border bg-boss-surface text-boss-text-secondary hover:text-boss-text'
      }`}
      {...rest}
    >
      <Icon size={14} />
    </button>
  );
}

// ───────────────────────────────────────────
// ViewToggle
// ───────────────────────────────────────────
export function ViewToggle({
  value,
  onChange,
}: {
  value: 'grid' | 'list';
  onChange: (value: 'grid' | 'list') => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-boss-border bg-boss-bg p-0.5">
      <IconButton
        icon={LayoutGrid}
        label="그리드 보기"
        active={value === 'grid'}
        onClick={() => onChange('grid')}
        className="h-7 w-7 rounded-sm border-0"
      />
      <IconButton
        icon={Rows3}
        label="리스트 보기"
        active={value === 'list'}
        onClick={() => onChange('list')}
        className="h-7 w-7 rounded-sm border-0"
      />
    </div>
  );
}

// ───────────────────────────────────────────
// ListTabs
// ───────────────────────────────────────────
export function ListTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-boss-border">
      {tabs.map(({ key, label, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              isActive ? 'text-boss-text' : 'text-boss-text-muted hover:text-boss-text'
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive ? 'bg-boss-primary/15 text-boss-primary' : 'bg-boss-elevated text-boss-text-muted'
                }`}
              >
                {count.toLocaleString()}
              </span>
            )}
            {isActive && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-boss-primary" />}
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────
// DataTable
// ───────────────────────────────────────────
export function DataTable({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-boss-border bg-boss-surface shadow-boss ${className}`}>
      <table className="boss-table">{children}</table>
    </div>
  );
}

// ───────────────────────────────────────────
// Pagination
// ───────────────────────────────────────────
export function Pagination({
  page,
  totalPages,
  onChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-xs text-boss-text-muted">
        페이지 {page.toLocaleString()} / {totalPages.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeft size={13} /> 이전
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          다음 <ChevronRight size={13} />
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// RowList (컴팩트 행 리스트)
// ───────────────────────────────────────────
export { RowList, RowItem, RowThumb, RowAction, RowChevron } from './RowList';

// ───────────────────────────────────────────
// Skeleton
// ───────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-boss-elevated ${className}`} />;
}
