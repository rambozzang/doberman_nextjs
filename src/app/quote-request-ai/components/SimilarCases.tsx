'use client';
import Image from 'next/image';
import type { SimilarCase } from '@/lib/ai/types';
import { formatPriceShort } from '@/lib/ai/priceCalculator';
import { WALLPAPER_LABEL } from '@/lib/ai/data/pricingTable';

interface Props {
  cases: SimilarCase[];
}

export default function SimilarCases({ cases }: Props) {
  if (cases.length === 0) return null;
  return (
    <div>
      <div className="text-sm font-semibold text-emerald-200 mb-2">🏠 비슷한 시공 사례</div>
      <div className="grid grid-cols-1 gap-2">
        {cases.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/40 p-2">
            <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-700">
              <Image src={c.imageUrl} alt={c.title} width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-semibold truncate">{c.title}</div>
              <div className="text-[11px] text-slate-400">
                {c.pyeong}평 · {WALLPAPER_LABEL[c.wallpaperType]} · {c.region}
              </div>
              <div className="text-xs text-emerald-300 font-bold mt-0.5 tabular-nums">{formatPriceShort(c.price)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
