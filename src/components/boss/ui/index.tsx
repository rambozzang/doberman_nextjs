'use client';

// 사장님 영역 공용 UI 프리미티브 — onGo 리디자인 시안 기준
// 값 출처: web/design_handoff_ongo_redesign/onGo Redesign.dc.html 의 인라인 스타일
//
// 설계 원칙 (시안 principles)
//   DENSITY  스크롤보다 한 화면 — 행 높이 44~48px, 목록은 카드가 아닌 행
//   STATE    상태를 행 안에서 해결 — 상태 배지 클릭 시 해당 작업으로 직접 진입
//   KEYBOARD 키보드 우선 — / 검색, ⌘↵ 저장·전송, J/K 목록 이동
//   TRUST    실패를 숨기지 않기 — 만료·한도·거부를 최상단에 노출
//
// 기존 87개 페이지가 이 파일을 import 하므로 export 이름과 prop 시그니처는 유지한다.

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
// 상태 색쌍 — 시안 pill(bg, fg)
// ═══════════════════════════════════════════
export type StatusTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'info';

const PILL: Record<StatusTone, string> = {
  ok: 'bg-boss-pill-ok text-boss-pill-ok-fg',
  warn: 'bg-boss-pill-warn text-boss-pill-warn-fg',
  bad: 'bg-boss-pill-bad text-boss-pill-bad-fg',
  neutral: 'bg-boss-pill-neutral text-boss-pill-neutral-fg',
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
// Card — KPI·소형 카드. radius 11px / padding 13px 15px
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
      className={`boss-card ${padded ? 'px-[15px] py-[13px]' : ''} ${
        interactive
          ? 'transition-colors duration-[120ms] ease-out hover:border-boss-border-card-hover'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

// ═══════════════════════════════════════════
// ContentCard — 목록·표를 담는 카드
// radius 12px / overflow hidden / padding 0 (내부 요소가 자체 패딩을 갖는다)
// ═══════════════════════════════════════════
export function ContentCard({
  children,
  className = '',
  inset = false,
}: {
  children: ReactNode;
  className?: string;
  /** 배경을 #171927 로 (인사이트·서브 패널) */
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
// padding 13px 15px + 하단 보더 / 제목 13px/700 + 모노 메타 + 우측 액션
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
  /** 제목 오른쪽 모노 10px 보조 텍스트 */
  meta?: ReactNode;
  /** 우측 건수 (모노 10px, 기본 warn 색) */
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

  return (
    <div className="boss-card-head">
      <h3 className="boss-section-title whitespace-nowrap">{title}</h3>
      {meta && <span className="font-boss-mono text-[10px] text-boss-text-muted">{meta}</span>}
      <div className="min-w-0 flex-1" />
      {count !== undefined && (
        <span className={`font-boss-mono text-[10px] ${countColor}`}>{count}</span>
      )}
      {action &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="whitespace-nowrap text-[11px] text-boss-primary transition-colors duration-[120ms] ease-out hover:text-white"
          >
            {action}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="whitespace-nowrap text-[11px] text-boss-primary transition-colors duration-[120ms] ease-out hover:text-white"
          >
            {action}
          </button>
        ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Row — 목록 행. grid 컬럼을 직접 지정할 수 있다
// 시안 발행 큐: grid-template-columns: 62px 84px minmax(0,1fr) auto / gap 12px
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
// StatCard — KPI 카드
// 라벨 11px(ls .02em) → 값 25px/700 모노(ls -.02em) + 델타 pill → 노트 11px
// 시안 델타는 "3 대기" "목표 28" 같은 문자열도 온다
// ═══════════════════════════════════════════
export function StatCard({
  label,
  value,
  delta,
  deltaTone,
  hint,
  loading,
}: {
  label: string;
  value: string;
  /** 숫자면 부호·% 자동 처리, 문자열이면 그대로 표시 */
  delta?: number | string;
  deltaTone?: StatusTone;
  hint?: string;
  loading?: boolean;
  /** @deprecated 시안 KPI 카드에는 아이콘이 없다 */
  icon?: LucideIcon;
}) {
  let deltaText: string | null = null;
  let tone: StatusTone = deltaTone ?? 'neutral';

  if (typeof delta === 'number') {
    deltaText = `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}%`;
    if (!deltaTone) tone = delta >= 0 ? 'ok' : 'bad';
  } else if (typeof delta === 'string' && delta.length > 0) {
    deltaText = delta;
  }

  return (
    <div className="boss-card px-[15px] py-[13px]">
      <p className="text-[11px] tracking-[0.02em] text-boss-text-secondary">{label}</p>
      <div className="mt-[7px] flex items-baseline gap-2">
        {loading ? (
          <span className="inline-block h-[25px] w-24 animate-pulse rounded bg-boss-elevated" />
        ) : (
          <span className="font-boss-mono text-[25px] font-bold leading-none tracking-[-0.02em] text-boss-text">
            {value}
          </span>
        )}
        {deltaText && !loading && (
          <span
            className={`whitespace-nowrap rounded-pill px-[7px] py-[3px] text-[10.5px] font-semibold ${PILL[tone]}`}
          >
            {deltaText}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-boss-text-muted">{hint}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════
// StatusPill — 상태 배지. 10.5px/600 radius 5px padding 3px 7px
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
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-[7px] py-[3px] text-[10.5px] font-semibold ${PILL[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// Badge — 기존 tone 이름을 시안 색 규칙으로 매핑 (87개 페이지 호환용)
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
    return (
      <span
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-pill bg-[var(--boss-ac-dim)] px-[7px] py-[3px] text-[10.5px] font-semibold text-boss-primary ${className}`}
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
// Chip — 26×26 정사각 칩. 시안 플랫폼 칩 CHIP(bg, fg)
// 도배에서는 유형/구분 표식으로 사용 (예: 도배·장판·필름)
// ═══════════════════════════════════════════
export type ChipTone = 'rose' | 'pink' | 'teal' | 'blue' | 'green' | 'gray';

const CHIP_TONES: Record<ChipTone, { bg: string; fg: string }> = {
  rose: { bg: '#2c1a20', fg: '#ff8a8a' },
  pink: { bg: '#2a1c2c', fg: '#e79ad4' },
  teal: { bg: '#12262b', fg: '#7de3e0' },
  blue: { bg: '#1a2138', fg: '#8fb2ff' },
  green: { bg: '#16261c', fg: '#8fdca8' },
  gray: { bg: '#22242f', fg: '#c9cbe0' },
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
      className="flex flex-none items-center justify-center rounded-chip font-boss-mono text-[9px] font-semibold"
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
// TagPill — 행 안의 작은 태그 (시안 플랫폼 태그)
// mono 9.5px / border #2e3250 / radius 4px / padding 2px 5px
// ═══════════════════════════════════════════
export function TagPill({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-[4px] border border-boss-border-strong px-[5px] py-[2px] font-boss-mono text-[9.5px] tracking-[0.04em] text-boss-text-tertiary">
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════
// Button
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
      {Icon && <Icon size={size === 'sm' ? 12 : 13} />}
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
      {Icon && <Icon size={size === 'sm' ? 12 : 13} />}
      {children}
    </Link>
  );
}

// ═══════════════════════════════════════════
// AlertBanner — 실패는 숨기지 않는다
// bad : border #3a3050 / bg #221c30 / padding 13px 15px / radius 11px / 12.5px #e2d9ef
// warn: border #2b2f47 / bg #191c2b / padding 11px 13px / radius 9px  / 12px  #c8cae0
// ═══════════════════════════════════════════
export function AlertBanner({
  tone = 'bad',
  children,
  action,
}: {
  tone?: 'bad' | 'warn';
  children: ReactNode;
  action?: ReactNode;
}) {
  const bad = tone === 'bad';
  return (
    <div
      className={`flex flex-wrap items-center gap-3 ${
        bad
          ? 'rounded-card border border-[#3a3050] bg-[#221c30] px-[15px] py-[13px]'
          : 'rounded-control border border-[#2b2f47] bg-[#191c2b] px-[13px] py-[11px]'
      }`}
    >
      <span
        className={`flex-none rounded-full ${bad ? 'h-[7px] w-[7px] bg-boss-error' : 'h-[6px] w-[6px] bg-boss-warning'}`}
      />
      <p
        className={`min-w-0 flex-1 leading-[1.5] ${
          bad ? 'text-[12.5px] text-[#e2d9ef]' : 'text-[12px] text-boss-text-soft'
        }`}
      >
        {children}
      </p>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════
// AttentionItem — "확인 필요" 행
// padding 12px 15px / gap 11px / dot 7px(mt 5px) / 본문 12.5px lh1.45 / 메타 11px
// CTA: 11px/600 accent, border #2e3250, radius 6px, padding 5px 8px
// 시안 원칙: CTA 는 중간 상세 페이지 없이 작업 화면으로 직접 진입
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
  const cta =
    'inline-flex flex-none items-center whitespace-nowrap rounded-[6px] border border-boss-border-strong px-2 py-[5px] text-[11px] font-semibold text-boss-primary transition-colors duration-[120ms] ease-out hover:border-boss-primary hover:!text-boss-primary';

  return (
    <div className="flex items-start gap-[11px] border-b border-boss-border-row px-[15px] py-3 last:border-b-0">
      <span className={`mt-[5px] h-[7px] w-[7px] flex-none rounded-full ${DOT[tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] leading-[1.45] text-boss-text">{title}</p>
        {meta && <p className="mt-[3px] text-[11px] text-boss-text-muted">{meta}</p>}
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
// MetricBox — 카드 안 3칸 지표 그리드용
// border #23263c / radius 8px / padding 7px 8px / bg #171927
// 라벨 10px, 값 모노 13px
// ═══════════════════════════════════════════
export function MetricBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-boss-border bg-boss-inset px-2 py-[7px]">
      <p className="text-[10px] text-boss-text-muted">{label}</p>
      <p className="mt-[3px] font-boss-mono text-[13px] text-boss-text">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════
// InsightCard — 모노 태그 + 제목 13.5px/700 + 본문 12px lh1.65
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
    <div className="boss-card-inset px-[15px] py-[14px]">
      <p className="font-boss-mono text-[10px] uppercase tracking-[0.14em] text-boss-primary">
        {tag}
      </p>
      <p className="mt-[7px] text-[13.5px] font-bold text-boss-text">{title}</p>
      <p className="mt-1.5 text-[12px] leading-[1.65] text-boss-text-secondary">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════
// BarChart — 시안 일별 막대 차트 (순수 CSS)
// 높이 168px / gap 6px / 막대 radius 4px 4px 2px 2px
// 기본 #2e3250, 상위 10% 는 accent
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
  /** 라벨을 몇 칸마다 표시할지 (시안은 격일) */
  labelEvery?: number;
  /**
   * 막대 최대 폭(px). 시안은 14개 막대가 폭을 채워 개당 약 72px 이다.
   * 데이터가 적을 때 막대가 지나치게 넓어져 accent 가 화면을 뒤덮는 것을 막는다.
   */
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
      {/* 막대 수가 적어도 좌측으로 몰리지 않도록 가운데 정렬한다 */}
      <div className="flex items-end justify-center gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            title={`${d.label} · ${formatValue ? formatValue(d.value) : d.value}`}
            className={`min-w-0 flex-1 rounded-t-[4px] rounded-b-[2px] ${
              d.value >= threshold ? 'bg-boss-primary' : 'bg-boss-border-strong'
            }`}
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%`, maxWidth: maxBarWidth }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="min-w-0 flex-1 text-center font-boss-mono text-[9.5px] text-boss-text-faint"
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
// Toggle — 36×20 / padding 2px / knob 16×16
// on = accent 배경 + #101120 노브, off = #2b2f47 + #6c7093 노브
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
      className={`flex h-5 w-9 flex-none items-center rounded-[10px] p-[2px] transition-colors duration-[120ms] ease-out disabled:opacity-45 ${
        checked ? 'justify-end bg-boss-primary' : 'justify-start bg-[#2b2f47]'
      }`}
    >
      <span
        className={`block h-4 w-4 rounded-full ${checked ? 'bg-boss-bg' : 'bg-boss-text-muted'}`}
      />
    </button>
  );
}

// ═══════════════════════════════════════════
// Segmented — 기간·보기 전환
// 11.5px/600 radius 7px padding 6px 11px
// 선택: border #3a3f61 / bg #1f2233 / #fff · 비선택: border #23263c / #8f93b3
// ═══════════════════════════════════════════
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map(({ key, label }) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`whitespace-nowrap rounded-chip border px-[11px] py-[6px] text-[11.5px] font-semibold transition-colors duration-[120ms] ease-out ${
              active
                ? 'border-boss-border-hover bg-boss-elevated text-white'
                : 'border-boss-border text-boss-text-secondary hover:border-boss-border-hover hover:text-white'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// RadioOption — 시안 발행 예약 라디오
// 선택: border accent / bg ac-dim / 12px 원 안 6px accent dot
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
      className={`flex w-full items-center gap-[9px] rounded-control border px-[11px] py-[10px] text-left text-[12.5px] transition-colors duration-[120ms] ease-out ${
        checked
          ? 'border-boss-primary bg-[var(--boss-ac-dim)] font-bold text-white'
          : 'border-[#2b2f47] font-medium text-boss-text-tertiary hover:border-boss-border-hover'
      }`}
    >
      <span className="flex h-3 w-3 flex-none items-center justify-center rounded-full border-[1.5px] border-current">
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-boss-primary" />}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {hint && <span className="font-boss-mono text-[10.5px] opacity-70">{hint}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════
// SubNav — 인박스 필터(178px) · 설정(194px) 좌측 서브 내비
// padding 15px 12px / 항목 8px 10px / radius 8px / 12.5px
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
    <div className={`flex flex-col gap-[3px] ${className}`}>
      {label && <p className="boss-mono-label px-2 pb-2">{label}</p>}
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
            <span className="font-boss-mono text-[10px] opacity-70">{it.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// MonoLabel
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
    <div
      className={`boss-placeholder flex items-end justify-end rounded-[6px] p-1 ${className}`}
    >
      {label && (
        <span className="m-auto font-boss-mono text-[9px] text-boss-text-tertiary">{label}</span>
      )}
      {badge && (
        <span className="rounded-[3px] bg-[#101120b0] px-[3px] py-px font-boss-mono text-[9px] text-boss-text-tertiary">
          {badge}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// DashedCta
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
  const cls = `boss-dashed-cta flex w-full items-center justify-center gap-1.5 px-3 py-2 text-[12px] hover:!text-boss-primary ${className}`;
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
          className={`font-bold tracking-[-0.01em] text-boss-text ${
            size === 'md' ? 'text-[15px]' : 'text-[13px]'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-[5px] text-[11.5px] leading-[1.55] text-boss-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
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
    <header className="mb-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-[11px] text-boss-text-muted">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={11} className="text-boss-text-ghost" />}
              {b.href ? (
                <Link
                  href={b.href}
                  className="!text-boss-text-muted transition-colors hover:!text-boss-text-secondary"
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
          {eyebrow && <p className="boss-mono-label mb-2 !text-boss-primary">{eyebrow}</p>}
          <h1 className="text-[15px] font-bold text-boss-text">{title}</h1>
          {description && (
            <p className="mt-[5px] text-[12px] leading-[1.6] text-boss-text-secondary">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
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
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-control bg-boss-inset text-boss-text-muted">
          <Icon size={18} />
        </div>
      )}
      <p className="text-[12.5px] font-semibold text-boss-text-secondary">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[11.5px] leading-[1.55] text-boss-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-[18px]">{action}</div>}
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
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>
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
        size={13}
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
        <kbd className="pointer-events-none absolute right-[9px] top-1/2 hidden -translate-y-1/2 rounded-[4px] border border-boss-border-strong px-[5px] py-px font-boss-mono text-[10px] text-boss-text-muted sm:block">
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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-chip border transition-colors duration-[120ms] ease-out disabled:opacity-45 ${
        active
          ? 'border-boss-border-hover bg-boss-elevated text-boss-primary'
          : 'border-boss-border-soft text-boss-text-dim hover:border-boss-border-hover hover:text-white'
      } ${className}`}
      {...rest}
    >
      <Icon size={14} />
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
    <div className="flex items-center gap-1">
      <IconButton
        icon={LayoutGrid}
        label="그리드 보기"
        active={value === 'grid'}
        onClick={() => onChange('grid')}
      />
      <IconButton
        icon={Rows3}
        label="리스트 보기"
        active={value === 'list'}
        onClick={() => onChange('list')}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// ListTabs — 선택 시 inset 하단 2px accent
// padding 11px 15px / 12px / weight 700·500
// ═══════════════════════════════════════════
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
    <div className="boss-scroll flex items-center overflow-x-auto border-b border-boss-border">
      {tabs.map(({ key, label, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex flex-none items-center gap-2 whitespace-nowrap px-[15px] py-[11px] text-[12px] transition-colors duration-[120ms] ease-out ${
              isActive
                ? 'font-bold text-white shadow-[inset_0_-2px_0_0_rgb(var(--boss-primary))]'
                : 'font-medium text-boss-text-secondary hover:text-white'
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`font-boss-mono text-[10px] ${
                  isActive ? 'text-boss-primary' : 'text-boss-text-muted'
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
// DataTable
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
// Pagination
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
      <p className="font-boss-mono text-[11px] text-boss-text-muted">
        {page.toLocaleString()} / {totalPages.toLocaleString()}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeft size={12} /> 이전
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          다음 <ChevronRight size={12} />
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RowList (컴팩트 행 리스트)
// ═══════════════════════════════════════════
export { RowList, RowItem, RowThumb, RowAction, RowChevron } from './RowList';

// ═══════════════════════════════════════════
// RowActions — 행 수정/삭제
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
      className="flex items-center justify-end gap-1"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-[6px] border border-boss-border-strong px-2 py-[5px] text-[11px] font-semibold text-boss-text-dim transition-colors duration-[120ms] ease-out hover:border-boss-border-hover hover:text-white"
        >
          {editLabel}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-[6px] border border-transparent px-2 py-[5px] text-[11px] font-semibold text-boss-text-muted transition-colors duration-[120ms] ease-out hover:border-boss-error hover:text-boss-error disabled:opacity-45"
        >
          {deleting ? '삭제 중…' : deleteLabel}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// ConfirmDialog
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={loading ? undefined : onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="boss-card-content relative w-full max-w-sm p-[18px] shadow-boss-lg"
      >
        <div className="flex items-start gap-3">
          {tone === 'danger' && (
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-control bg-boss-pill-bad text-boss-error">
              <AlertTriangle size={16} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-bold text-boss-text">{title}</h2>
            {description && (
              <p className="mt-1.5 text-[11.5px] leading-[1.55] text-boss-text-secondary">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-[18px] flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
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
  return <div className={`animate-pulse rounded bg-boss-elevated ${className}`} />;
}

export function RowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex h-[46px] items-center gap-3 border-b border-boss-border-row px-[15px] last:border-b-0"
        >
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
