'use client';
import type { PackageOption } from '@/lib/ai/types';
import { formatPriceShort } from '@/lib/ai/priceCalculator';

interface Props {
  packages: PackageOption[];
  selectedId?: string;
  onSelect?: (id: PackageOption['id']) => void;
}

export default function PackageCards({ packages, selectedId, onSelect }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-emerald-200">📦 추천 패키지</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {packages.map((p) => {
          const selected = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect?.(p.id)}
              className={`text-left rounded-xl p-3 border transition ${
                selected
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 shadow-lg shadow-emerald-500/30'
                  : p.highlight
                  ? 'border-emerald-400/40 bg-slate-800/60 hover:border-emerald-300/60'
                  : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{p.name}</span>
                {p.highlight && <span className="text-[10px] text-emerald-300">추천</span>}
              </div>
              <div className="text-base font-bold text-white tabular-nums">{formatPriceShort(p.price)}</div>
              <ul className="mt-1 space-y-0.5">
                {p.features.map((f, i) => (
                  <li key={i} className="text-[11px] text-slate-300 leading-snug">· {f}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
