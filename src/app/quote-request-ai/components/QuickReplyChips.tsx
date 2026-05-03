'use client';
import type { QuickReply } from '@/lib/ai/types';

interface Props {
  replies: QuickReply[];
  onSelect: (qr: QuickReply) => void;
  disabled?: boolean;
}

export default function QuickReplyChips({ replies, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {replies.map((qr) => (
        <button
          key={`${qr.field}-${qr.value}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(qr)}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 text-sm hover:bg-emerald-500/20 hover:border-emerald-300/50 transition disabled:opacity-50"
        >
          {qr.icon && <span className="text-base">{qr.icon}</span>}
          <span>{qr.label}</span>
        </button>
      ))}
    </div>
  );
}
