'use client';

// 사장님 영역 공용 UI 프리미티브
// 디자인 원칙:
// - 다크 배경 위에서 hairline 보더(white/5 ~ white/10) + 모노스페이스 숫자
// - gradient orb, blur 남발 금지. accent(emerald)는 활성/강조에만
// - 정보 밀도 우선: 간격은 gap-2/3, 큰 여백은 섹션 사이에만

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, ChevronRight, type LucideIcon } from 'lucide-react';

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
      className={`rounded-xl border border-white/[0.06] bg-white/[0.02] ${
        padded ? 'p-5' : ''
      } ${interactive ? 'transition-colors hover:border-white/10 hover:bg-white/[0.04]' : ''} ${className}`}
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
          className={`font-semibold text-white ${
            size === 'md' ? 'text-base' : 'text-sm'
          }`}
        >
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ───────────────────────────────────────────
// PageHeader — 상단 타이틀 영역 (기존 BossPageHeader 대체)
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
    <header className="mb-6 border-b border-white/[0.06] pb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-[11px] text-slate-500">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={11} className="text-slate-700" />}
              {b.href ? (
                <Link href={b.href} className="hover:text-slate-300">
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
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
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
    'bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500',
  secondary:
    'border border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]',
  ghost: 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
  danger: 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
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
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/10">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && <Icon size={14} className="text-slate-600" />}
      </div>
      {loading ? (
        <div className="h-7 w-24 animate-pulse rounded bg-white/5" />
      ) : (
        <p className="font-mono text-2xl font-semibold tabular-nums text-white">{value}</p>
      )}
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        {delta !== undefined && !loading && (
          <span
            className={`flex items-center gap-0.5 font-medium ${
              positive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-slate-600">{hint}</span>}
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03] text-slate-500">
          <Icon size={18} />
        </div>
      )}
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ───────────────────────────────────────────
// Badge
// ───────────────────────────────────────────
type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
const BADGE_TONES: Record<BadgeTone, string> = {
  default: 'bg-white/[0.06] text-slate-300 ring-white/10',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/20',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
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
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 ${className}`}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────────────────
// Skeleton
// ───────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/[0.04] ${className}`} />;
}
