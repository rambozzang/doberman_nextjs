'use client';

// 견적 수신 지역 선택 — 앱 `widgets/region_multi_selector.dart` 와 같은 규칙
//   시/도 중에서 최대 3개, "전국"은 단독 선택.
// 저장은 호출부에서 한다(회사 정보 화면 · 웹견적 요청 화면 둘 다 쓴다).

import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/boss/ui';
import { REGIONS, NATIONWIDE_REGION, MAX_RECEIVE_REGIONS, parseRegions, normalizeRegions } from '@/lib/boss/regions';

export default function RegionPicker({
  open,
  value,
  saving = false,
  onCancel,
  onSave,
}: {
  open: boolean;
  /** 콤마로 구분된 현재 지역 */
  value: string;
  saving?: boolean;
  onCancel: () => void;
  /** 콤마로 구분된 새 지역을 넘긴다 */
  onSave: (regions: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>(parseRegions(value));

  useEffect(() => {
    if (open) setSelected(parseRegions(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving, onCancel]);

  if (!open) return null;

  const isNationwide = selected.includes(NATIONWIDE_REGION);
  const isFull = !isNationwide && selected.length >= MAX_RECEIVE_REGIONS;

  const toggle = (region: string) => {
    setSelected((prev) => {
      if (region === NATIONWIDE_REGION) {
        // 전국은 단독 — 고르면 나머지를 비운다
        return prev.includes(NATIONWIDE_REGION) ? [] : [NATIONWIDE_REGION];
      }
      const withoutAll = prev.filter((r) => r !== NATIONWIDE_REGION);
      if (withoutAll.includes(region)) return withoutAll.filter((r) => r !== region);
      if (withoutAll.length >= MAX_RECEIVE_REGIONS) return withoutAll;
      return [...withoutAll, region];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[88dvh] w-full max-w-[520px] flex-col border border-boss-border bg-boss-surface">
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-3.5">
          <div>
            <p className="text-[15px] font-semibold text-boss-text">견적 수신 지역</p>
            <p className="mt-0.5 text-[12px] text-boss-text-secondary">
              견적 요청을 받고 싶은 지역을 최대 {MAX_RECEIVE_REGIONS}개까지 고르세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="닫기"
            className="grid h-8 w-8 place-items-center text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="boss-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {REGIONS.map((region) => {
              const on = selected.includes(region);
              const disabled = !on && region !== NATIONWIDE_REGION && isFull;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => toggle(region)}
                  disabled={disabled || saving}
                  aria-pressed={on}
                  className={`flex items-center justify-between gap-1.5 border px-3 py-2 text-left text-[13px] transition-colors duration-[120ms] ${
                    on
                      ? 'border-boss-primary bg-boss-primary text-white'
                      : disabled
                        ? 'cursor-not-allowed border-boss-border bg-boss-inset text-boss-text-ghost'
                        : 'border-boss-border bg-white text-boss-text hover:bg-boss-elevated'
                  }`}
                >
                  <span className="truncate">{region}</span>
                  {on && <Check size={13} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            {isNationwide
              ? '전국을 고르면 모든 지역의 견적 요청 알림을 받습니다. 알림이 많으면 원하는 시 · 도만 고르세요.'
              : `고른 지역: ${selected.length}/${MAX_RECEIVE_REGIONS}개. 전국은 다른 지역과 함께 고를 수 없습니다.`}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-boss-border px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSave(normalizeRegions(selected))}
            disabled={saving || selected.length === 0}
          >
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
