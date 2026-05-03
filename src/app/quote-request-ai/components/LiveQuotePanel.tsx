'use client';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { QuoteSlots, PriceEstimate, PackageOption } from '@/lib/ai/types';
import { BUILDING_LABEL, SCOPE_LABEL, WALLPAPER_LABEL, ADDITIONAL_LABEL } from '@/lib/ai/data/pricingTable';
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

const REGION_NAME: Record<string, string> = {
  seoul: '서울', busan: '부산', daegu: '대구', incheon: '인천',
  gwangju: '광주', daejeon: '대전', ulsan: '울산', sejong: '세종',
  gyeonggi: '경기', gangwon: '강원', chungbuk: '충북', chungnam: '충남',
  jeonbuk: '전북', jeonnam: '전남', gyeongbuk: '경북', gyeongnam: '경남',
  jeju: '제주',
};

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
          <SlotCard icon="📍" label="지역" value={slots.region ? REGION_NAME[slots.region] : undefined} />
          <SlotCard icon="✨" label="추가 요청" value={buildAdditionalText(slots)} />
        </div>
        {estimate && (
          <>
            <PriceGauge min={estimate.min} max={estimate.max} matchConfidence={estimate.matchConfidence} />
            <PackageCards packages={estimate.packages} selectedId={selectedPackage} onSelect={onSelectPackage} />
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
              ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-white shadow-xl shadow-emerald-500/30'
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
