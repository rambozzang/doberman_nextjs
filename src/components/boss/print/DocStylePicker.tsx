'use client';

// 양식 선택 — 앱의 "양식 변경" 바텀시트와 같은 역할
// 고른 양식은 기억해 두었다가 다음에도 그대로 쓴다 (앱과 동일).

import type { DocStyleOption } from './docTypes';

export default function DocStylePicker({
  styles,
  value,
  onChange,
  label = '양식',
}: {
  styles: DocStyleOption[];
  value: string;
  onChange: (key: string) => void;
  label?: string;
}) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <span className="boss-mono-label">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {styles.map((s) => {
          const active = s.key === value;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[12px] transition-colors duration-[120ms] ${
                active
                  ? 'border-boss-text bg-boss-text text-white'
                  : 'border-boss-border bg-white text-boss-text-secondary hover:bg-boss-elevated'
              }`}
            >
              <span
                aria-hidden
                className="inline-block h-3 w-3 shrink-0 border border-black/10"
                style={{ background: s.color }}
              />
              {s.name}
            </button>
          );
        })}
      </div>
      <span className="text-[11.5px] text-boss-text-muted">고른 양식은 다음에도 그대로 쓰입니다</span>
    </div>
  );
}
