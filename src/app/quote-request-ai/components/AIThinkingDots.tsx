'use client';
import { motion } from 'framer-motion';

export default function AIThinkingDots({ label = 'AI 분석 중' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-blue-300 text-sm">
      <div className="flex gap-1.5 items-end h-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]"
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.15, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="font-medium">{label}</span>
    </div>
  );
}
