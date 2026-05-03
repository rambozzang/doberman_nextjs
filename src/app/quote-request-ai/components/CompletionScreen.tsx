'use client';
import { CheckCircle2, Home, RotateCcw } from 'lucide-react';

interface Props {
  onGoHome: () => void;
  onReset: () => void;
}

export default function CompletionScreen({ onGoHome, onReset }: Props) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-emerald-400/30 rounded-3xl p-8 text-center shadow-2xl shadow-emerald-500/10">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/40">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">AI 견적 신청 완료!</h2>
        <p className="text-slate-300 text-sm mb-6">
          24시간 이내에 매칭된 전문가들이 직접 연락드릴 거예요. 곧 만나요!
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onGoHome}
            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-white font-bold flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />홈으로
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />새 견적
          </button>
        </div>
      </div>
    </div>
  );
}
