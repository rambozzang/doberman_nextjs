'use client';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { QuoteSlots, PriceEstimate, PackageOption } from '@/lib/ai/types';
import { BUILDING_LABEL, SCOPE_LABEL, WALLPAPER_LABEL, ADDITIONAL_LABEL } from '@/lib/ai/data/pricingTable';
import { getRegionName, getDistrictName } from '@/lib/ai/data/regions';
import SlotCard from './SlotCard';
import PriceGauge from './PriceGauge';
import PackageCards from './PackageCards';
import SimilarCases from './SimilarCases';

interface Props {
  slots: QuoteSlots;
  estimate: PriceEstimate | null;
  isComplete: boolean;
  isSubmitting?: boolean;
  selectedPackage?: PackageOption['id'];
  onSelectPackage?: (id: PackageOption['id']) => void;
  onSubmit: () => void;
}


function buildScopeText(slots: QuoteSlots): string | undefined {
  if (!slots.scope || slots.scope.length === 0) return undefined;
  return slots.scope.map((s) => SCOPE_LABEL[s]).join(', ');
}

function buildAreaText(slots: QuoteSlots): string | undefined {
  if (slots.area?.pyeong) return `${slots.area.pyeong}평`;
  if (slots.area?.squareMeter) return `${slots.area.squareMeter}m²`;
  return undefined;
}

function buildAdditionalText(slots: QuoteSlots): string | undefined {
  if (!slots.additionalRequest || slots.additionalRequest.length === 0) return undefined;
  return slots.additionalRequest.map((r) => ADDITIONAL_LABEL[r]).join(', ');
}

export default function LiveQuotePanel({
  slots, estimate, isComplete, isSubmitting,
  selectedPackage, onSelectPackage, onSubmit,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <SlotCard icon="🏢" label="건물" value={slots.buildingType ? BUILDING_LABEL[slots.buildingType] : undefined} />
          <SlotCard icon="📐" label="면적" value={buildAreaText(slots)} />
          <SlotCard icon="🛋️" label="공간" value={buildScopeText(slots)} />
          <SlotCard icon="🎨" label="벽지" value={slots.wallpaperType ? WALLPAPER_LABEL[slots.wallpaperType] : undefined} />
          <SlotCard
            icon="📍"
            label="지역"
            value={
              slots.region
                ? (slots.district
                    ? `${getRegionName(slots.region).replace(/광역시|특별시|특별자치시|특별자치도|도$/, '')} ${getDistrictName(slots.region, slots.district)}`
                    : getRegionName(slots.region))
                : undefined
            }
          />
          <SlotCard icon="✨" label="추가 요청" value={buildAdditionalText(slots)} />
        </div>
        {estimate && (
          <>
            <PriceGauge min={estimate.min} max={estimate.max} matchConfidence={estimate.matchConfidence} />
            {/*
              추천 패키지는 일단 비공개. 실제 도배 사장님 견적을 받기 전 단계라 패키지로 단정지어 보여주기보다
              사장님 견적 후 비교 단계에서 노출하는 것이 합리적.
              <PackageCards packages={estimate.packages} selectedId={selectedPackage} onSelect={onSelectPackage} />
            */}
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-amber-100 text-xs leading-relaxed">
              <p className="font-semibold mb-1">⚠️ 위 금액은 시장 평균 기반 예상 견적입니다.</p>
              <p className="text-amber-100/90">
                실제 시공 금액은 현장 실측, 벽 상태, 평형, 시공 옵션에 따라 달라질 수 있어요.
                신청해 주시면 검증된 도배 사장님들의 정확한 견적을 받아보실 수 있습니다.
              </p>
            </div>
            <SimilarCases cases={estimate.similarCases} />
          </>
        )}
      </div>
      <div className="px-4 pb-4 pt-2 border-t border-slate-800/60">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isComplete || isSubmitting}
          className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition ${
            isComplete && !isSubmitting
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white shadow-xl shadow-blue-500/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />신청 중...</>
            : isComplete ? <><CheckCircle2 className="w-5 h-5" />이 견적으로 신청하기</>
            : '대화를 더 진행해주세요'}
        </button>
      </div>
    </div>
  );
}
