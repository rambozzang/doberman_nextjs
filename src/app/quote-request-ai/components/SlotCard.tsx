'use client';
import { motion } from 'framer-motion';

interface Props {
  icon: string;
  label: string;
  value?: string;
  highlight?: boolean;
}

export default function SlotCard({ icon, label, value, highlight }: Props) {
  const filled = !!value;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`relative rounded-xl border p-3 backdrop-blur transition ${
        filled
          ? 'border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 shadow-lg shadow-emerald-500/10'
          : 'border-slate-700 bg-slate-800/40'
      } ${highlight ? 'ring-2 ring-emerald-400/40' : ''}`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${filled ? 'text-white' : 'text-slate-500'}`}>
        {value || '미입력'}
      </div>
      {filled && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      )}
    </motion.div>
  );
}
