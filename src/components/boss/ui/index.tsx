'use client';

// 사장님 영역 공용 UI 프리미티브 — "Industry" 디자인 시스템 (agent.opentohome.com 패턴)
// 값 출처: ~/work/hlw/app/oth-frontend/components/agent/industry.tsx
//
//   면 #f2f2f3 · 패널 #f5f5f8(테두리 16% + shadow-sm) · 글자 #1d1f20 · accent #5980a6
//   모서리 0 — 전부 사각. 숫자·제목은 Barlow Condensed(font-boss-head / font-boss-mono).
//
// 설계 원칙
//   DENSITY  한 화면에 많이 — 목록은 카드가 아닌 표(행 46px)
//   STATE    상태는 행 안에서 해결 — 배지 옆에 바로 다음 행동
//   TRUST    실패를 숨기지 않기 — 첫 조회 실패와 0건을 구분해 말한다
//   KEYBOARD / 검색, ⌘↵ 저장, J/K 이동 (BossSearchContext)
//
// 83개 페이지가 이 파일을 import 하므로 export 이름과 prop 시그니처는 유지한다.

import {
  forwardRef,
  useEffect,
  type HTMLAttributes,
  type ReactNode,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Rows3,
  Search,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════
// 상태 색쌍 — 참조 Tag tone (bg, fg)
// ═══════════════════════════════════════════
export type StatusTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'info';

const PILL: Record<StatusTone, string> = {
  ok: 'bg-boss-pill-ok text-boss-pill-ok-fg',
  warn: 'bg-boss-pill-warn text-boss-pill-warn-fg',
  bad: 'bg-boss-pill-bad text-boss-pill-bad-fg',
  // 참조: 중립 태그는 패널과 같은 색이라 얇은 링을 더해 읽히게 한다
  neutral: 'bg-boss-pill-neutral text-boss-pill-neutral-fg ring-1 ring-inset ring-boss-border-soft',
  info: 'bg-boss-pill-info text-boss-pill-info-fg',
};

const DOT: Record<StatusTone, string> = {
  ok: 'bg-boss-success',
  warn: 'bg-boss-warning',
  bad: 'bg-boss-error',
  neutral: 'bg-boss-text-ghost',
  info: 'bg-boss-info',
};

// ═══════════════════════════════════════════
// Kicker — 참조 .k : 10px 대문자 라벨. 화면 어디에나 있는 작은 머리글
// ═══════════════════════════════════════════
export function Kicker({
  children,
  className = '',
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  /** accent 색 (참조 .card-kicker) */
  accent?: boolean;
}) {
  return (
    <p className={`${accent ? 'boss-kicker' : 'boss-mono-label'} ${className}`}>{children}</p>
  );
}

// ═══════════════════════════════════════════
// Card — 패널. 참조 PANEL : 테두리 + #f5f5f8 + shadow-sm, padding 20px
// ═══════════════════════════════════════════
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
      className={`boss-card ${padded ? 'p-5' : ''} ${
        interactive
          ? 'cursor-pointer transition-colors duration-[120ms] ease-out hover:border-boss-border-hover'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

// ═══════════════════════════════════════════
// Panel — 제목·kicker·우측 액션이 있는 패널 (참조 Panel)
// ═══════════════════════════════════════════
export function Panel({
  title,
  kicker,
  right,
  className = '',
  bodyClassName = '',
  children,
}: {
  title?: string;
  kicker?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={`boss-card p-5 ${className}`}>
      {(title || kicker || right) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {kicker && <p className="boss-kicker">{kicker}</p>}
            {title && <h3 className="boss-section-title">{title}</h3>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

// ═══════════════════════════════════════════
// ContentCard — 목록·표를 담는 패널. padding 0 (내부 요소가 자체 패딩을 갖는다)
// ═══════════════════════════════════════════
export function ContentCard({
  children,
  className = '',
  inset = false,
}: {
  children: ReactNode;
  className?: string;
  /** 배경을 페이지 면 색으로 (서브 패널) */
  inset?: boolean;
}) {
  return (
    <div className={`${inset ? 'boss-card-inset' : 'boss-card-content'} ${className}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════
// CardHead — 콘텐츠 카드 내부 헤더
// 제목 17px Barlow Condensed + 보조 텍스트 + 우측 건수/액션
// ═══════════════════════════════════════════
export function CardHead({
  title,
  meta,
  count,
  countTone = 'warn',
  action,
  actionHref,
  onAction,
}: {
  title: string;
  /** 제목 오른쪽 보조 텍스트 */
  meta?: ReactNode;
  /** 우측 건수 */
  count?: ReactNode;
  countTone?: 'warn' | 'muted' | 'accent';
  /** 우측 accent 링크 — 예: "캘린더로 보기 →" */
  action?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  const countColor =
    countTone === 'warn'
      ? 'text-boss-warning'
      : countTone === 'accent'
        ? 'text-boss-primary'
        : 'text-boss-text-muted';

  const actionCls =
    'whitespace-nowrap text-[12.5px] font-semibold text-boss-primary transition-colors duration-[120ms] ease-out hover:text-boss-primary-hover hover:underline underline-offset-2';

  return (
    <div className="boss-card-head">
      <h3 className="boss-section-title whitespace-nowrap">{title}</h3>
      {meta && <span className="text-[12px] text-boss-text-muted">{meta}</span>}
      <div className="min-w-0 flex-1" />
      {count !== undefined && (
        <span className={`font-boss-head text-[13px] font-semibold tabular-nums ${countColor}`}>
          {count}
        </span>
      )}
      {action &&
        (actionHref ? (
          <Link href={actionHref} className={actionCls}>
            {action}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className={actionCls}>
            {action}
          </button>
        ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Row — 목록 행. grid 컬럼을 직접 지정할 수 있다
// ═══════════════════════════════════════════
export function Row({
  columns,
  gap = 12,
  hover = false,
  href,
  onClick,
  children,
  className = '',
}: {
  /** CSS grid-template-columns 값. 없으면 flex 행 */
  columns?: string;
  gap?: number;
  hover?: boolean;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const style: CSSProperties = columns
    ? { display: 'grid', gridTemplateColumns: columns, gap: `${gap}px`, alignItems: 'center' }
    : { display: 'flex', gap: `${gap}px`, alignItems: 'center' };

  const cls = `boss-row ${hover || href || onClick ? 'boss-row-hover' : ''} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${cls} !text-boss-text hover:!text-boss-text`} style={style}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
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
        className={cls}
        style={style}
      >
        {children}
      </div>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════
// StatCard — KPI 카드 (참조 StatCard)
// kicker 10px 대문자 accent → 값 40px Barlow Condensed → 설명 12px
// ═══════════════════════════════════════════
export function StatCard({
  label,
  value,
  delta,
  deltaTone,
  hint,
  loading,
  href,
  alert = false,
}: {
  label: string;
  value: string;
  /** 숫자면 부호·% 자동 처리, 문자열이면 그대로 표시 */
  delta?: number | string;
  deltaTone?: StatusTone;
  hint?: string;
  loading?: boolean;
  /** @deprecated 참조 KPI 카드에는 아이콘이 없다 */
  icon?: LucideIcon;
  /** 카드 전체를 링크로 */
  href?: string;
  /** 주의가 필요한 값 — 좌측에 붉은 3px 선 */
  alert?: boolean;
}) {
  let deltaText: string | null = null;
  let tone: StatusTone = deltaTone ?? 'neutral';

  if (typeof delta === 'number') {
    deltaText = `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}%`;
    if (!deltaTone) tone = delta >= 0 ? 'ok' : 'bad';
  } else if (typeof delta === 'string' && delta.length > 0) {
    deltaText = delta;
  }

  const body = (
    <>
      <p className="boss-kicker">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <span className="inline-block h-10 w-24 animate-pulse bg-boss-hover" />
        ) : (
          <span className="font-boss-head text-[40px] font-semibold leading-none tabular-nums tracking-[-0.01em] text-boss-text">
            {value}
          </span>
        )}
        {deltaText && !loading && (
          <span
            className={`whitespace-nowrap px-2 py-[3px] text-[11px] font-semibold tracking-[0.02em] ${PILL[tone]}`}
          >
            {deltaText}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[12px] leading-relaxed text-boss-text-secondary">{hint}</p>}
    </>
  );

  const cls = `boss-card block p-5 ${alert ? 'border-l-[3px] border-l-boss-error' : ''}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${cls} !text-boss-text transition-colors duration-[120ms] ease-out hover:border-boss-border-hover`}
      >
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

// ═══════════════════════════════════════════
// StatusPill — 상태 배지. 참조 Tag : 사각 / 11px / padding 3px 10px
// ═══════════════════════════════════════════
export function StatusPill({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-[3px] text-[11px] font-medium tracking-[0.02em] ${PILL[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** 참조 이름(Tag)으로도 쓸 수 있게 */
export const Tag = StatusPill;

// Badge — 기존 tone 이름을 참조 색 규칙으로 매핑 (호환용)
type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';

const BADGE_MAP: Record<BadgeTone, StatusTone | 'accent'> = {
  default: 'neutral',
  emerald: 'ok',
  sky: 'info',
  amber: 'warn',
  rose: 'bad',
  violet: 'accent',
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
  const mapped = BADGE_MAP[tone];
  if (mapped === 'accent') {
    // 참조 outline 태그 — accent 테두리 + accent 글자
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap border border-boss-primary px-2.5 py-[2px] text-[11px] font-medium tracking-[0.02em] text-boss-primary ${className}`}
      >
        {children}
      </span>
    );
  }
  return (
    <StatusPill tone={mapped} className={className}>
      {children}
    </StatusPill>
  );
}

// ═══════════════════════════════════════════
// Chip — 26×26 정사각 칩. 유형/구분 표식 (예: 도배·장판·필름)
// ═══════════════════════════════════════════
export type ChipTone = 'rose' | 'pink' | 'teal' | 'blue' | 'green' | 'gray';

const CHIP_TONES: Record<ChipTone, { bg: string; fg: string }> = {
  rose: { bg: '#fbe9e9', fg: '#8a2626' },
  pink: { bg: '#f7e8f3', fg: '#7a2b5e' },
  teal: { bg: '#e2f3f2', fg: '#1b5e5a' },
  blue: { bg: '#eef6ff', fg: '#2c455d' },
  green: { bg: '#e7f3ec', fg: '#1f5136' },
  gray: { bg: '#e9eaeb', fg: '#424244' },
};

export function Chip({
  tone = 'gray',
  children,
  size = 26,
}: {
  tone?: ChipTone;
  children: ReactNode;
  size?: number;
}) {
  const { bg, fg } = CHIP_TONES[tone];
  return (
    <span
      className="flex flex-none items-center justify-center font-boss-head text-[11px] font-semibold"
      style={{ width: size, height: size, background: bg, color: fg }}
    >
      {children}
    </span>
  );
}

/** 문자열을 안정적으로 칩 색에 매핑 — 유형별로 항상 같은 색이 나온다 */
export function chipToneOf(key: string): ChipTone {
  const tones: ChipTone[] = ['blue', 'green', 'teal', 'pink', 'rose', 'gray'];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

// ═══════════════════════════════════════════
// TagPill — 행 안의 작은 태그 (참조 neutral 태그의 소형)
// ═══════════════════════════════════════════
export function TagPill({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap border border-boss-border px-1.5 py-[1px] text-[10.5px] tracking-[0.02em] text-boss-text-dim">
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════
// Button — 참조 DCBTN
// ═══════════════════════════════════════════
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'accent' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export function Button({
  variant = 'secondary',
  size = 'md',
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
      className={`boss-btn boss-btn-${size} boss-btn-${variant} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 14} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

/** Link 로 감싸지 않고 바로 쓰는 버튼형 링크 */
export function ButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`boss-btn boss-btn-${size} boss-btn-${variant} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 13 : 14} strokeWidth={1.75} />}
      {children}
    </Link>
  );
}

// ═══════════════════════════════════════════
// AlertBanner — 실패는 숨기지 않는다 (참조 DcError / warn 상자)
// ═══════════════════════════════════════════
export function AlertBanner({
  tone = 'bad',
  children,
  action,
}: {
  tone?: 'bad' | 'warn' | 'info';
  children: ReactNode;
  action?: ReactNode;
}) {
  const box =
    tone === 'bad'
      ? 'border-boss-error/35 bg-boss-pill-bad text-boss-pill-bad-fg'
      : tone === 'warn'
        ? 'border-boss-warning/35 bg-boss-pill-warn text-boss-pill-warn-fg'
        : 'border-boss-primary/35 bg-boss-pill-info text-boss-pill-info-fg';
  return (
    <div role="alert" className={`flex flex-wrap items-center gap-3 border px-4 py-3 ${box}`}>
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed">{children}</p>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════
// AttentionItem — "확인 필요" 행 (참조 TodoTable 행)
// 점 + 본문 + 메타 + 우측 ghost CTA. CTA 는 중간 화면 없이 작업 화면으로 직접 진입
// ═══════════════════════════════════════════
export function AttentionItem({
  tone = 'warn',
  title,
  meta,
  actionLabel,
  href,
  onAction,
}: {
  tone?: StatusTone;
  title: ReactNode;
  meta?: ReactNode;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
}) {
  const cta = 'boss-btn boss-btn-sm boss-btn-ghost -mr-2';

  return (
    <div className="flex items-start gap-3 border-b border-boss-border-row px-5 py-3 last:border-b-0">
      <span className={`mt-[6px] h-[7px] w-[7px] flex-none ${DOT[tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-[1.45] text-boss-text">{title}</p>
        {meta && <p className="mt-[3px] text-[12px] text-boss-text-secondary">{meta}</p>}
      </div>
      {actionLabel &&
        (href ? (
          <Link href={href} className={cta}>
            {actionLabel}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className={cta}>
            {actionLabel}
          </button>
        ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// MetricBox — 카드 안 지표 칸 (참조 dl 그리드 칸)
// 페이지 면 색 배경 / kicker 10px / 값 22px Barlow Condensed
// ═══════════════════════════════════════════
export function MetricBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-boss-border bg-boss-inset px-3 py-2.5">
      <p className="boss-mono-label">{label}</p>
      <p className="mt-0.5 font-boss-head text-[22px] font-semibold leading-tight tabular-nums text-boss-text">
        {value}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// InsightCard — kicker + 제목 + 본문
// ═══════════════════════════════════════════
export function InsightCard({
  tag,
  title,
  description,
}: {
  tag: string;
  title: string;
  description: string;
}) {
  return (
    <div className="boss-card-inset px-4 py-3.5">
      <p className="boss-kicker">{tag}</p>
      <p className="mt-1.5 text-[14px] font-bold text-boss-text">{title}</p>
      <p className="mt-1 text-[12.5px] leading-[1.6] text-boss-text-secondary">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════
// Bar — 참조 게이지. 4·6·8px 진행바. 값이 없으면 그리지 않는다
// ═══════════════════════════════════════════
export function Bar({
  pct,
  height = 6,
  tone = 'accent',
}: {
  pct: number;
  height?: number;
  tone?: 'accent' | 'warn' | 'ok';
}) {
  const w = Math.max(0, Math.min(100, pct));
  const fill = tone === 'warn' ? 'bg-boss-warning' : tone === 'ok' ? 'bg-boss-success' : 'bg-boss-primary';
  return (
    <span className="block w-full bg-[#d4d4d7]" style={{ height }}>
      <span className={`block h-full ${fill}`} style={{ width: `${w}%` }} />
    </span>
  );
}

// ═══════════════════════════════════════════
// BarChart — 순수 CSS 막대 차트
// 막대 사각, 기본 #d4d4d7, 상위 10% 는 accent
// ═══════════════════════════════════════════
export function BarChart({
  data,
  height = 168,
  labelEvery = 2,
  maxBarWidth = 72,
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  /** 라벨을 몇 칸마다 표시할지 */
  labelEvery?: number;
  /** 막대 최대 폭(px) — 데이터가 적을 때 막대가 화면을 뒤덮는 것을 막는다 */
  maxBarWidth?: number;
  formatValue?: (v: number) => string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  // 상위 10% 임계값 — 최소 1개는 강조된다
  const sorted = [...data].map((d) => d.value).sort((a, b) => b - a);
  const threshold = sorted[Math.max(0, Math.ceil(sorted.length * 0.1) - 1)] ?? max;

  return (
    <div>
      <div className="flex items-end justify-center gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            title={`${d.label} · ${formatValue ? formatValue(d.value) : d.value}`}
            className={`min-w-0 flex-1 ${d.value >= threshold ? 'bg-boss-primary' : 'bg-[#d4d4d7]'}`}
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%`, maxWidth: maxBarWidth }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="min-w-0 flex-1 text-center font-boss-head text-[11px] tabular-nums text-boss-text-muted"
            style={{ maxWidth: maxBarWidth }}
          >
            {i % labelEvery === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Toggle — 스위치. 유일하게 둥근 컨트롤(관습)
// on = accent, off = 글자 30%
// ═══════════════════════════════════════════
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-9 flex-none items-center rounded-full p-[2px] transition-colors duration-[120ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-boss-primary disabled:opacity-45 ${
        checked ? 'justify-end bg-boss-primary' : 'justify-start bg-boss-text-ghost'
      }`}
    >
      <span className="block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
    </button>
  );
}

// ═══════════════════════════════════════════
// Segmented — 참조 Seg : 붙어 있는 사각 버튼 묶음. 선택은 accent 로 채운다
// ═══════════════════════════════════════════
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}: {
  options: { key: T; label: ReactNode }[];
  value: T;
  onChange: (key: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap border border-boss-border ${className}`}
    >
      {options.map(({ key, label }, i) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`whitespace-nowrap px-3 py-[7px] text-[13px] transition-colors duration-[120ms] ease-out ${
              i > 0 ? 'border-l border-boss-border' : ''
            } ${
              active
                ? 'bg-boss-primary font-semibold text-boss-primary-foreground'
                : 'bg-boss-bg text-boss-text hover:bg-boss-hover'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** 참조 이름(Seg)으로도 쓸 수 있게 */
export const Seg = Segmented;

// ═══════════════════════════════════════════
// RadioOption — 참조 .radio : 사각 상자 + 점(dot) 라디오
// 선택: accent 테두리 + accent-100 배경
// ═══════════════════════════════════════════
export function RadioOption({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className={`flex w-full items-center gap-2.5 border px-3 py-2.5 text-left text-[13.5px] transition-colors duration-[120ms] ease-out ${
        checked
          ? 'border-boss-primary bg-boss-elevated font-semibold text-boss-text'
          : 'border-boss-border bg-boss-bg text-boss-text hover:border-boss-border-hover'
      }`}
    >
      <span
        className={`grid h-4 w-4 flex-none place-items-center rounded-full border-[1.5px] ${
          checked ? 'border-boss-primary bg-boss-primary' : 'border-boss-border-hover'
        }`}
      >
        {checked && <span className="block h-1.5 w-1.5 rounded-full bg-boss-bg" />}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {hint && <span className="font-boss-head text-[12px] text-boss-text-muted">{hint}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════
// CheckLine — 참조 .radio 모양의 체크박스 (같은 점 모양을 쓴다)
// ═══════════════════════════════════════════
export function CheckLine({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`inline-flex items-start gap-2 text-[13.5px] leading-snug text-boss-text ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-boss-primary ${
          checked ? 'border-boss-primary bg-boss-primary' : 'border-boss-border-hover bg-transparent'
        }`}
      >
        {checked && <span className="block h-1.5 w-1.5 rounded-full bg-boss-bg" />}
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  );
}

// ═══════════════════════════════════════════
// SubNav — 설정·인박스 좌측 서브 내비 (레일의 라이트 버전)
// ═══════════════════════════════════════════
export function SubNav({
  label,
  items,
  value,
  onChange,
  className = '',
}: {
  label?: string;
  items: { key: string; label: string; count?: ReactNode }[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <p className="boss-mono-label px-3 pb-2">{label}</p>}
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          aria-current={value === it.key}
          onClick={() => onChange(it.key)}
          className="boss-subnav-item text-left"
        >
          <span className="min-w-0 flex-1 truncate">{it.label}</span>
          {it.count !== undefined && (
            <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// MonoLabel — 대문자 라벨 (Kicker 와 같다, 호환용)
// ═══════════════════════════════════════════
export function MonoLabel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`boss-mono-label ${className}`}>{children}</p>;
}

// ═══════════════════════════════════════════
// Placeholder — 썸네일 자리표시자
// ═══════════════════════════════════════════
export function Placeholder({
  className = '',
  badge,
  label,
}: {
  className?: string;
  /** 우하단 배지 (예: 재생 시간) */
  badge?: ReactNode;
  /** 가운데 라벨 (예: PHOTO 4:3) */
  label?: ReactNode;
}) {
  return (
    <div className={`boss-placeholder flex items-end justify-end p-1 ${className}`}>
      {label && (
        <span className="m-auto font-boss-head text-[11px] uppercase tracking-[0.08em] text-boss-text-muted">
          {label}
        </span>
      )}
      {badge && (
        <span className="bg-boss-text/75 px-1 py-px font-boss-head text-[10px] text-boss-bg">
          {badge}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// DashedCta — 목록 마지막 행 / 빈 슬롯
// ═══════════════════════════════════════════
export function DashedCta({
  href,
  onClick,
  children,
  className = '',
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const cls = `boss-dashed-cta flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-medium hover:!text-boss-primary ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════
// SectionHeader / PageHeader
// 화면 제목은 셸 헤더(nav.ts PAGE_META)가 담당한다.
// PageHeader 는 셸 밖(인쇄·인증) 또는 본문 안 큰 구획에서만 쓴다.
// ═══════════════════════════════════════════
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
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2
          className={`font-boss-head font-semibold tracking-[0.01em] text-boss-text ${
            size === 'md' ? 'text-[20px]' : 'text-[17px]'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[12.5px] leading-[1.55] text-boss-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * 상세 화면 상단 액션 줄.
 *
 * 상세 화면의 주요 버튼(상태 변경 · 출력 · 삭제 등)이 오른쪽 패널 아래에 있어
 * 매번 스크롤해야 눌렀다. 사장님은 현장에서 폰으로 쓰기 때문에 더 불편하다.
 * 상세 화면은 이 줄을 제목 바로 아래(본문 맨 위)에 두고 주요 버튼을 여기 모은다.
 *
 * 화면 위에 붙어 따라다니고(sticky), 인쇄에는 나오지 않는다.
 */
export function DetailActions({
  children,
  note,
}: {
  children: ReactNode;
  /** 버튼 왼쪽에 놓을 짧은 설명(상태 등) */
  note?: ReactNode;
}) {
  return (
    <div className="no-print sticky top-0 z-20 -mx-5 flex flex-wrap items-center gap-2 border-b border-boss-border bg-boss-surface px-5 py-2.5 sm:-mx-7 sm:px-7">
      {note ? <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-boss-text-secondary">{note}</div> : null}
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

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
    <header className="mb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-1.5 flex items-center gap-1 text-[12px] text-boss-text-muted">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={11} className="text-boss-text-ghost" />}
              {b.href ? (
                <Link
                  href={b.href}
                  className="!text-boss-text-muted transition-colors hover:!text-boss-text"
                >
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
        <div className="min-w-0">
          {eyebrow && <p className="boss-mono-label">{eyebrow}</p>}
          <h1 className="mt-0.5 font-boss-head text-[26px] font-semibold leading-tight tracking-[-0.015em] text-boss-text">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════
// EmptyState / Toolbar / SearchInput
// ═══════════════════════════════════════════
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
        <div className="mb-3 flex h-10 w-10 items-center justify-center border border-boss-border bg-boss-bg text-boss-text-muted">
          <Icon size={18} strokeWidth={1.5} />
        </div>
      )}
      <p className="text-[13.5px] font-semibold text-boss-text">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[12.5px] leading-[1.6] text-boss-text-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toolbar({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>{children}</div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = '검색',
  className = '',
  hint = true,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** `/` 키캡 힌트 표시 */
  hint?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-boss-text-muted"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="boss-input pl-[30px] pr-9"
      />
      {hint && (
        <kbd className="pointer-events-none absolute right-[9px] top-1/2 hidden -translate-y-1/2 border border-boss-border px-[5px] py-px font-boss-head text-[11px] text-boss-text-muted sm:block">
          /
        </kbd>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// IconButton / ViewToggle
// ═══════════════════════════════════════════
export function IconButton({
  icon: Icon,
  label,
  active,
  className = '',
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
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center border transition-colors duration-[120ms] ease-out disabled:opacity-45 ${
        active
          ? 'border-boss-primary bg-boss-elevated text-boss-primary'
          : 'border-boss-border bg-boss-bg text-boss-text-dim hover:border-boss-border-hover hover:text-boss-text'
      } ${className}`}
      {...rest}
    >
      <Icon size={15} strokeWidth={1.75} />
    </button>
  );
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: 'grid' | 'list';
  onChange: (value: 'grid' | 'list') => void;
}) {
  return (
    <div className="inline-flex">
      <IconButton
        icon={Rows3}
        label="리스트 보기"
        active={value === 'list'}
        onClick={() => onChange('list')}
      />
      <IconButton
        icon={LayoutGrid}
        label="그리드 보기"
        active={value === 'grid'}
        onClick={() => onChange('grid')}
        className="-ml-px"
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// ListTabs — 상태 필터. 참조 Seg 와 같은 붙은 사각 버튼 + 건수
// ═══════════════════════════════════════════
export function ListTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="boss-scroll inline-flex max-w-full overflow-x-auto border border-boss-border"
    >
      {tabs.map(({ key, label, count }, i) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(key)}
            className={`flex flex-none items-center gap-1.5 whitespace-nowrap px-3 py-[7px] text-[13px] transition-colors duration-[120ms] ease-out ${
              i > 0 ? 'border-l border-boss-border' : ''
            } ${
              isActive
                ? 'bg-boss-primary font-semibold text-boss-primary-foreground'
                : 'bg-boss-bg text-boss-text hover:bg-boss-hover'
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`font-boss-head text-[12px] tabular-nums ${
                  isActive ? 'text-boss-primary-foreground/80' : 'text-boss-text-muted'
                }`}
              >
                {count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// DataTable — 참조 TABLE. 패널 안 표, 가로 스크롤
// ═══════════════════════════════════════════
export function DataTable({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`boss-scroll boss-card-content overflow-x-auto ${className}`}>
      <table className="boss-table">{children}</table>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pagination — 참조: "n / m 페이지" K 라벨 + 이전/다음 secondary
// ═══════════════════════════════════════════
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
    <div className="flex items-center justify-between gap-3">
      <p className="boss-mono-label font-boss-head text-[12px] normal-case tracking-[0.04em]">
        {page.toLocaleString()} / {Math.max(1, totalPages).toLocaleString()} 페이지
      </p>
      <div className="inline-flex">
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
          className="-ml-px"
        >
          다음 <ChevronRight size={13} />
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Field / SelectField / TextareaField — 참조 DcField : 라벨 + 입력 한 벌
// 단위(㎡·만원)는 입력창 안 오른쪽에 붙여 틀릴 여지를 줄인다
// ═══════════════════════════════════════════
export function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="boss-label">
      {children}
      {required && <span className="ml-0.5 text-boss-error">*</span>}
    </label>
  );
}

export function Field({
  label,
  required,
  hint,
  suffix,
  id,
  className = '',
  ...rest
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  suffix?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  // maxLength 가 있으면 "n/최대" 를 오른쪽에 보여 준다 — 어디까지 쓸 수 있는지 사장님이 바로 안다
  const counter = fieldCounter(rest.value, rest.maxLength);
  return (
    <div className={className}>
      <FieldLabel required={required} htmlFor={id}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          id={id}
          {...rest}
          className={`boss-input ${
            suffix
              ? 'pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
              : ''
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[12.5px] text-boss-text-muted">
            {suffix}
          </span>
        )}
      </div>
      <FieldFoot hint={hint} counter={counter} />
    </div>
  );
}

/** 글자 수 표시 — 값이 문자열이고 maxLength 가 있을 때만 */
function fieldCounter(value: unknown, maxLength?: number): string | null {
  if (!maxLength || typeof value !== 'string') return null;
  return `${value.length}/${maxLength}`;
}

/** 칸 아래 줄 — 왼쪽 안내, 오른쪽 글자 수. 둘 다 없으면 그리지 않는다 */
function FieldFoot({ hint, counter }: { hint?: ReactNode; counter: string | null }) {
  if (!hint && !counter) return null;
  return (
    <div className="mt-1 flex items-start justify-between gap-3 text-[12px] leading-relaxed">
      <div className="min-w-0 text-boss-text-secondary">{hint}</div>
      {counter && (
        <span className="shrink-0 font-boss-head tabular-nums text-boss-text-muted" aria-live="polite">
          {counter}
        </span>
      )}
    </div>
  );
}

export function SelectField({
  label,
  required,
  hint,
  children,
  id,
  className = '',
  ...rest
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <FieldLabel required={required} htmlFor={id}>
        {label}
      </FieldLabel>
      <select id={id} {...rest} className="boss-input">
        {children}
      </select>
      {hint && <div className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">{hint}</div>}
    </div>
  );
}

export function TextareaField({
  label,
  required,
  hint,
  id,
  className = '',
  ...rest
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const counter = fieldCounter(rest.value, rest.maxLength);
  return (
    <div className={className}>
      <FieldLabel required={required} htmlFor={id}>
        {label}
      </FieldLabel>
      <textarea id={id} {...rest} className="boss-input" />
      <FieldFoot hint={hint} counter={counter} />
    </div>
  );
}

// ═══════════════════════════════════════════
// DescRow — 참조 사무소 패널의 dl 행 : 라벨(muted) … 값(semibold)
// ═══════════════════════════════════════════
export function DescRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-boss-border-row py-2 text-[13px] last:border-b-0">
      <dt className="shrink-0 text-boss-text-secondary">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold text-boss-text">{value}</dd>
    </div>
  );
}

// ═══════════════════════════════════════════
// RowList (컴팩트 행 리스트)
// ═══════════════════════════════════════════
export { RowList, RowItem, RowThumb, RowAction, RowChevron } from './RowList';

// ═══════════════════════════════════════════
// RowActions — 행 수정/삭제 (참조 ghost 버튼)
// ═══════════════════════════════════════════
export function RowActions({
  onEdit,
  onDelete,
  editLabel = '수정',
  deleteLabel = '삭제',
  deleting = false,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  deleting?: boolean;
}) {
  if (!onEdit && !onDelete) return null;
  return (
    // Link로 감싼 카드 안에서도 안전하게 쓰도록 기본 동작과 전파를 모두 차단
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {onEdit && (
        <button type="button" onClick={onEdit} className="boss-btn boss-btn-sm boss-btn-ghost">
          {editLabel}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="boss-btn boss-btn-sm boss-btn-ghost !text-boss-text-muted hover:!text-boss-error"
        >
          {deleting ? '삭제 중…' : deleteLabel}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// ConfirmDialog — 참조 ConfirmBox 를 모달로
// ═══════════════════════════════════════════
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '삭제',
  cancelLabel = '취소',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // ESC로 닫기 (처리 중에는 무시)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;
  const danger = tone === 'danger';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-boss-text/40"
        onClick={loading ? undefined : onCancel}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full max-w-sm border bg-boss-surface p-5 shadow-boss-lg ${
          danger ? 'border-boss-error/35' : 'border-boss-border'
        }`}
      >
        <div className="flex items-start gap-3">
          {danger && (
            <div className="flex h-9 w-9 flex-none items-center justify-center bg-boss-pill-bad text-boss-pill-bad-fg">
              <AlertTriangle size={16} strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-bold text-boss-text">{title}</h2>
            {description && (
              <p className="mt-1 text-[12.5px] leading-[1.6] text-boss-text-secondary">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? '처리 중…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Skeleton — 목록은 행 높이를 유지한 채 로딩
// ═══════════════════════════════════════════
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-boss-hover ${className}`} />;
}

export function RowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex h-[46px] items-center gap-3 border-b border-boss-border-row px-5 last:border-b-0"
        >
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
