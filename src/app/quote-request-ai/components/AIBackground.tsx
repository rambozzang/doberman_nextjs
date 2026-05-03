'use client';
export default function AIBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ai-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 24 }).map((_, i) => {
          const cx = (i * 137) % 100;
          const cy = (i * 73) % 100;
          const delay = (i % 6) * 0.5;
          return (
            <circle
              key={i}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r="2"
              fill="url(#ai-glow)"
              className="animate-pulse"
              style={{ animationDelay: `${delay}s`, animationDuration: '3s' }}
            />
          );
        })}
        {Array.from({ length: 12 }).map((_, i) => {
          const x1 = (i * 91) % 100;
          const y1 = (i * 53) % 100;
          const x2 = ((i + 3) * 91) % 100;
          const y2 = ((i + 3) * 53) % 100;
          return (
            <line
              key={`l${i}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="#a855f7"
              strokeOpacity="0.15"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
}
