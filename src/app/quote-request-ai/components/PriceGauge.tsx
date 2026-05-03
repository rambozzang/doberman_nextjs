'use client';
import { useEffect, useState } from 'react';
import { formatPriceShort } from '@/lib/ai/priceCalculator';

interface Props {
  min: number;
  max: number;
  matchConfidence: number;
}

function useCountUp(target: number, duration = 600): number {
  const [val, setVal] = useState(target);
  useEffect(() => {
    const start = val;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(start + (target - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export default function PriceGauge({ min, max, matchConfidence }: Props) {
  const minVal = useCountUp(min);
  const maxVal = useCountUp(max);
  return (
    <div className="rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-5 backdrop-blur">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-sm text-blue-200">💰 예상 견적</span>
        <span className="text-xs text-slate-400">±15% 변동</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mb-3 tabular-nums">
        {formatPriceShort(minVal)} <span className="text-slate-400 mx-1 text-xl">~</span> {formatPriceShort(maxVal)}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">매칭 신뢰도</span>
          <span className="text-blue-300 font-semibold">{matchConfidence}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 via-blue-400 to-purple-500 transition-all duration-700"
            style={{ width: `${matchConfidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
