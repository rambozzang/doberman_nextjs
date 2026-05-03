'use client';
export default function AIThinkingDots({ label = 'AI 분석 중' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-emerald-300 text-sm">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{label}</span>
    </div>
  );
}
